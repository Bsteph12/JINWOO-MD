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
const { stylise, sendMenu, sendReply, db, saveDB, isValidJid } = require('./lib/helpers');

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
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(usePairing), 5000); // Délai de 5s avant reconnexion
      }
    } else if (connection === 'open') {
      console.log('✅ Connecté à WhatsApp');
    }
  });

  // Charge les commandes automatiquement
  const commands = {};
  const commandsPath = path.join(__dirname, 'commands');
  
  if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath)
      .filter(f => f.endsWith('.js'))
      .forEach(f => {
        try {
          const cmd = require(path.join(commandsPath, f));
          if (cmd.name) {
            commands[cmd.name] = cmd;
            console.log(`✅ Commande chargée: ${cmd.name}`);
          }
        } catch (err) {
          console.error(`❌ Erreur lors du chargement de ${f}:`, err.message);
        }
      });
  } else {
    console.warn('⚠️ Dossier commands/ introuvable');
  }

  // Écoute des messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    
    // Vérifications de sécurité
    if (!msg || !msg.message || !msg.key) {
      console.warn('⚠️ Message invalide reçu:', msg);
      return;
    }

    const jid = msg.key.remoteJid;
    
    // Vérification du JID
    if (!isValidJid(jid)) {
      console.warn('⚠️ JID invalide:', jid);
      return;
    }

    const isGroup = jid.endsWith('@g.us');
    const content = msg.message.conversation
      || msg.message.extendedTextMessage?.text
      || '';

    // Ignorer les messages vides
    if (!content || typeof content !== 'string') return;

    const isCommand = content.startsWith(config.prefix);
    const sender = msg.key.participant || jid;

    console.log(`[${new Date().toISOString()}]`, isGroup ? '[GROUP]' : '[PRIVATE]', sender + ':', content);

    if (!isCommand) return;

    const [cmdName, ...args] = content.slice(config.prefix.length).trim().split(/\s+/);
    const cmd = commands[cmdName.toLowerCase()];

    if (!cmd) {
      try {
        return await sock.sendMessage(jid, { 
          text: stylise(`❌ Commande inconnue. Tapez *${config.prefix}menu* !`) 
        });
      } catch (err) {
        console.error('❌ Erreur lors de l\'envoi du message d\'erreur:', err);
      }
      return;
    }

    try {
      // Ignorer les groupes muted sauf menu ou unmute
      if (isGroup && db[jid]?.muted && !['menu', 'unmute'].includes(cmdName)) {
        console.log('🔇 Groupe muté, commande ignorée:', cmdName);
        return;
      }

      console.log(`🚀 Exécution de la commande: ${cmdName}`);
      
      await cmd.execute({
        sock,
        msg,
        args,
        db,
        saveDB,
        config,
        stylise,
        sendMenu,
        sendReply,
        jid,
        isGroup,
        sender
      });

    } catch (err) {
      console.error('⚠️ Erreur dans la commande', cmdName, ':', err);
      try {
        await sock.sendMessage(jid, { 
          text: stylise('⚠️ Une erreur est survenue, désolé !') 
        });
      } catch (sendErr) {
        console.error('❌ Erreur lors de l\'envoi du message d\'erreur:', sendErr);
      }
    }
  });

  // Gestion des erreurs globales
  process.on('uncaughtException', (err) => {
    console.error('❌ Erreur non gérée:', err);
  });

  process.on('unhandledRejection', (err) => {
    console.error('❌ Promesse rejetée:', err);
  });
}

startBot(true); // Toujours en pairing code
