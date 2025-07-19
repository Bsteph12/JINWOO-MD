const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const readline = require('readline');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const { stylise, sendMenu, sendReply, db, saveDB } = require('./lib/helpers');

function ask(questionText) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(questionText, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function startBot(usePairing = true) {
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

  // Connexion via code de pairage uniquement
  if (usePairing && !sock.authState.creds.registered) {
    const number = await ask("📱 Votre numéro WhatsApp (ex: 22898133388) : ");
    try {
      let code = await sock.requestPairingCode(number);
      code = code.match(/.{1,4}/g).join("-");
      console.log("🔗 Code de pairage :", code);
      console.log("➡️ Entrez ce code dans WhatsApp → Appareils liés");
    } catch (err) {
      console.error("❌ Erreur lors du pairing :", err.message);
    }
  }

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('📵 Déconnecté, code', code);
      if (code !== DisconnectReason.loggedOut) startBot(usePairing);
    } else if (connection === 'open') {
      console.log('✅ Connecté à WhatsApp');
    }
  });

  // Charge les commandes automatiquement
  const commands = {};
  const commandsPath = path.join(__dirname, 'commands');
  fs.readdirSync(commandsPath)
    .filter(f => f.endsWith('.js'))
    .forEach(f => {
      const cmd = require(path.join(commandsPath, f));
      if (cmd.name) commands[cmd.name] = cmd;
    });

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
      return sock.sendMessage(jid, { text: stylise(`❌ Commande inconnue. Tappez *${config.prefix}menu* !`) });
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

startBot(true); // Toujours en pairing code