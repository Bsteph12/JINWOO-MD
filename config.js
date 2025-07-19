// bot-config.js - Configuration personnalisée du bot

module.exports = {
  // ——————————————————————————————————————————————
  // 🎨 PERSONNALISATION DU BOT
  // ——————————————————————————————————————————————
 prefix: '!',
  owner: '237698711207@s.@s.whatsapp.net',
  repo: 'https://github.com/darling221237',
    botOwner:'丂ㄒ乇_卩卄卂几乇_' ,
    botNumber:'237698711207', 
  // Informations du bot
  botName: "🤖 Mon Bot WhatsApp",
  botDescription: "Bot WhatsApp développé avec ❤️",
  
  // Informations de votre chaîne/canal
  channelName: "📺 Ma Chaîne Tech",
  channelDescription: "Suivez-moi pour plus de contenus !",
  channelUrl: "https://youtube.com/@votre-chaine", // ⚠️ À REMPLACER
  
  // Images et média
  thumbnailUrl: "https://i.postimg.cc/Hn9PbMg1/2c6ca349055f63a31a122697503257dd.jpg", // ⚠️ À REMPLACER
  logoUrl: "https://i.postimg.cc/Hn9PbMg1/2c6ca349055f63a31a122697503257dd.jpg", // Optionnel
  
  // Newsletter WhatsApp (optionnel)
  newsletterJid: "120363419336864081@newsletter",
  
  // ——————————————————————————————————————————————
  // 🎭 THÈMES ET STYLES
  // ——————————————————————————————————————————————
  
  // Émojis personnalisés
  emojis: {
    bot: "🤖",
    menu: "📋",
    ping: "🏓",
    alive: "✅",
    mute: "🔇",
    unmute: "🔊",
    tagall: "📢",
    hidetag: "🫥",
    welcome: "👋",
    goodbye: "👋",
    repo: "📦",
    heart: "❤️",
    rocket: "🚀",
    warning: "⚠️",
    error: "❌",
    success: "✅"
  },
  
  // Couleurs pour les messages (utilisation future)
  colors: {
    primary: "#00d4aa",
    secondary: "#ff6b6b",
    success: "#51cf66",
    warning: "#ffd43b",
    error: "#ff6b6b",
    info: "#339af0"
  },
  
  // ——————————————————————————————————————————————
  // 📱 RÉSEAUX SOCIAUX
  // ——————————————————————————————————————————————
  
  socialLinks: {
    youtube: "https://youtube.com/@votre-chaine", // ⚠️ À REMPLACER
    github: "https://github.com/votre-username", // ⚠️ À REMPLACER
    telegram: "https://t.me/votre-canal", // Optionnel
    instagram: "https://instagram.com/votre-compte", // Optionnel
    twitter: "https://twitter.com/votre-compte", // Optionnel
    website: "https://votre-site.com" // Optionnel
  },
  
  // ——————————————————————————————————————————————
  // 🔧 CONFIGURATION AVANCÉE
  // ——————————————————————————————————————————————
  
  // Messages personnalisés
  messages: {
    menuTitle: "🤖 *BOT MENU* 🤖",
    menuFooter: "💻 *Développé avec ❤️*",
    botActive: "🚀 *Bot actif et prêt !*",
    commandsSection: "📋 *COMMANDES DISPONIBLES*",
    groupSection: "👥 *GESTION DE GROUPE*",
    autoSection: "🎉 *AUTOMATISATION*",
    unknownCommand: "❌ Commande inconnue. Tapez */menu* !",
    errorOccurred: "⚠️ Une erreur est survenue, désolé !",
    groupMuted: "🔇 Groupe muté, commande ignorée"
  },
  
  // Configuration du menu
  menuConfig: {
    showHeader: true,
    showFooter: true,
    showSections: true,
    showEmojis: true,
    showDescription: true
  },
  
  // ——————————————————————————————————————————————
  // 🛡️ SÉCURITÉ ET MODÉRATION
  // ——————————————————————————————————————————————
  
  // Administrateurs du bot (JIDs WhatsApp)
  admins: [
    "22898133388@s.whatsapp.net", // ⚠️ Remplacez par votre numéro
    // Ajoutez d'autres admins ici
  ],
  
  // Groupes autorisés (laisser vide pour autoriser tous)
  allowedGroups: [
    // "123456789-123456@g.us", // ID du groupe
  ],
  
  // Commandes réservées aux admins
  adminCommands: [
    "mute",
    "unmute",
    "tagall",
    "hidetag"
  ],
  
  // ——————————————————————————————————————————————
  // 📊 STATISTIQUES ET LOGS
  // ——————————————————————————————————————————————
  
  // Activer les statistiques
  enableStats: true,
  
  // Activer les logs détaillés
  enableDetailedLogs: true,
  
  // Sauvegarder les conversations (pour debug)
  saveConversations: false
};

// ——————————————————————————————————————————————
// 🚀 FONCTION DE VALIDATION
// ——————————————————————————————————————————————

function validateConfig() {
  const warnings = [];
  
  if (module.exports.channelUrl.includes("votre-chaine")) {
    warnings.push("⚠️ N'oubliez pas de remplacer 'channelUrl' par votre vraie URL");
  }
  
  if (module.exports.thumbnailUrl.includes("example.jpg")) {
    warnings.push("⚠️ N'oubliez pas de remplacer 'thumbnailUrl' par votre vraie image");
  }
  
  if (module.exports.admins.includes("22898133388@s.whatsapp.net")) {
    warnings.push("⚠️ N'oubliez pas de remplacer le numéro admin par le vôtre");
  }
  
  if (warnings.length > 0) {
    console.log("\n🔧 Configuration à finaliser :");
    warnings.forEach(warning => console.log(warning));
    console.log("");
  }
}

// Valider la configuration au démarrage
validateConfig();

// ——————————————————————————————————————————————
// 🎯 FONCTIONS UTILITAIRES
// ——————————————————————————————————————————————

// Vérifier si un utilisateur est admin
function isAdmin(jid) {
  return module.exports.admins.includes(jid);
}

// Vérifier si une commande est réservée aux admins
function isAdminCommand(command) {
  return module.exports.adminCommands.includes(command);
}

// Obtenir le lien social
function getSocialLink(platform) {
  return module.exports.socialLinks[platform] || null;
}

module.exports.isAdmin = isAdmin;
module.exports.isAdminCommand = isAdminCommand;
module.exports.getSocialLink = getSocialLink;