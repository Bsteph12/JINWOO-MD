const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const { stylise, sendMenu, sendReply, db, saveDB } = require('./lib/helpers');

async function startBot() {
  // Vérifier si creds.json existe
  const credsPath = './session/creds.json';
  if (!fs.existsSync(credsPath)) {
    console.log('❌ Fichier creds.json non trouvé dans ./session/');
    console.log('🔗 Allez sur votre service Render pour générer un code de pairage');
    process.exit(1);
  }

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('📵 Déconnecté, code', code);
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(), 3000); // Reconnexion après 3s
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp');
    }
  });

  // Charge les commandes automatiquement
  const commands = {};
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath)
      .filter(f => f.endsWith('.js'))
      .forEach(f => {
        const cmd = require(path.join(commandsPath, f));
        if (cmd.name) commands[cmd.name] = cmd;
      });
  }

  // Écoute des messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const content = msg.message.conversation
      || msg.message.extendedTextMessage?.text
      || '';

    const isCommand = content.startsWith(config.prefix);
    const sender = msg.key.participant || jid;

    console.log(`[${new Date().toISOString()}]`, isGroup ? '[GROUP]' : '[PRIVATE]', sender + ':', content);

    if (!isCommand) return;

    const [cmdName, ...args] = content.slice(config.prefix.length).trim().split(/\s+/);
    const cmd = commands[cmdName.toLowerCase()];

    if (!cmd) {
      return sock.sendMessage(jid, { text: stylise(`❌ Commande inconnue. Tapez *${config.prefix}menu* !`) });
    }

    try {
      // Ignorer les groupes muted sauf menu ou unmute
      if (isGroup && db[jid]?.muted && !['menu', 'unmute'].includes(cmdName)) return;

      await cmd.execute({
        sock,
        msg,
        args,
        db,
        saveDB,
        config,
        stylise,
        sendMenu,
        sendReply
      });

    } catch (err) {
      console.error('⚠️ Erreur dans la commande', cmdName, err);
      await sock.sendMessage(jid, { text: stylise('⚠️ Une erreur est survenue, désolé !') });
    }
  });
}

startBot();
