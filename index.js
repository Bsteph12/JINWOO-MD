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

async function checkAuthState() {
  const sessionPath = './session';
  const credsPath = path.join(sessionPath, 'creds.json');
  
  // Vérifier si le fichier creds.json existe
  if (fs.existsSync(credsPath)) {
    console.log('✅ Fichier creds.json trouvé, connexion automatique...');
    return true;
  }
  
  console.log('⚠️ Aucun fichier creds.json trouvé.');
  console.log('📱 Veuillez générer votre session sur : https://votre-site.onrender.com');
  console.log('📥 Puis copiez le fichier creds.json téléchargé dans le dossier ./session/');
  
  return false;
}

async function startBot(usePairing = false) {
  // Vérifier l'état d'authentification avant de démarrer
  const hasAuth = await checkAuthState();
  
  if (!hasAuth && !usePairing) {
    console.log('❌ Impossible de démarrer sans authentification.');
    console.log('🔗 Générez votre session sur : https://votre-site.onrender.com');
    process.exit(1);
  }

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['STEPHDEV Bot', 'Chrome', '20.0.04'],
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  // Mode pairing pour la première configuration (optionnel)
  if (usePairing && !sock.authState.creds.registered) {
    console.log('🔗 Mode pairing activé - Utilisez plutôt le générateur web !');
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
      
      if (code === DisconnectReason.loggedOut) {
        console.log('🔐 Session expirée ou révoquée');
        console.log('📱 Regénérez votre session sur : https://votre-site.onrender.com');
        console.log('📥 Puis remplacez le fichier creds.json dans ./session/');
      } else {
        // Reconnexion automatique pour les autres erreurs
        startBot(false);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp');
      console.log(`📱 Connecté avec le numéro : ${sock.user.id.split(':')[0]}`);
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

  return sock;
}

// Fonction pour vérifier périodiquement la session
function monitorSession() {
  const credsPath = './session/creds.json';
  
  if (!fs.existsSync(credsPath)) {
    console.log('⚠️ Session manquante ! Générez-la sur : https://votre-site.onrender.com');
    return false;
  }
  
  return true;
}

// Démarrage du bot
async function main() {
  console.log('🚀 Démarrage du bot STEPHDEV...');
  
  // Créer le dossier session s'il n'existe pas
  if (!fs.existsSync('./session')) {
    fs.mkdirSync('./session', { recursive: true });
  }
  
  try {
    await startBot(false); // false = pas de pairing manuel, utilise creds.json
  } catch (error) {
    console.error('❌ Erreur lors du démarrage :', error.message);
    console.log('🔗 Assurez-vous d\'avoir généré votre session sur : https://votre-site.onrender.com');
  }
}

// Gestion des signaux de fermeture
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du bot...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non gérée :', err);
});

main();
