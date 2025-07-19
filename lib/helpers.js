// lib/helpers.js

const fs   = require('fs');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(__dirname, 'db.json');

// ——————————————————————————————————————————————
// 1. Chargement / sauvegarde de la base de données
// ——————————————————————————————————————————————
let db = {};

try {
  const content = fs.readFileSync(DB_PATH, 'utf-8');
  db = JSON.parse(content);
} catch (err) {
  console.warn('⚠️ Base de données introuvable ou corrompue, démarrage avec {}');
  db = {};
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Erreur lors de la sauvegarde de la DB:', err);
  }
}

// ——————————————————————————————————————————————
// 2. Mise en forme des messages (embed style ASCII)
// ——————————————————————————————————————————————
const stylise = (text) => {
  return [
    '╭─「 *BOT* 」',
    ...text.split('\n').map(line => `│ ${line}`),
    '╰────────'
  ].join('\n');
};

// ——————————————————————————————————————————————
// 3. Configuration par défaut pour les images et liens
// ——————————————————————————————————————————————
const defaultConfig = {
  botName: "🤖 WhatsApp Bot",
  channelName: "📺 Ma Chaîne",
  thumbnailUrl: 'https://i.imgur.com/example.jpg', // ⚠️ À remplacer
  channelUrl: 'https://youtube.com/@votre-chaine', // ⚠️ À remplacer
  newsletterJid: '120363313242950119@newsletter'
};

// ——————————————————————————————————————————————
// 4. Construction du contextInfo enrichi avec image
// ——————————————————————————————————————————————
function buildEnhancedContext(m, options = {}) {
  // Vérification de sécurité
  if (!m || !m.key) {
    console.warn('⚠️ Message ou clé manquante dans buildEnhancedContext');
    return {};
  }

  const participant = m.key.participant || m.key.remoteJid;
  
  if (!participant || typeof participant !== 'string') {
    console.warn('⚠️ JID invalide dans buildEnhancedContext:', participant);
    return {};
  }

  const config = { ...defaultConfig, ...options };

  return {
    mentionedJid: [participant],
    forwardingScore: 99,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: config.newsletterJid,
      serverMessageId: 20,
      newsletterName: config.channelName
    },
    externalAdReply: {
      title: config.botName,
      body: config.channelName,
      thumbnailUrl: config.thumbnailUrl,
      sourceUrl: config.channelUrl,
      mediaType: 1,
      renderLargerThumbnail: true,
      showAdAttribution: true,
      containsAutoReply: true
    }
  };
}

// Version simple du contexte (pour compatibilité)
function buildContext(m) {
  if (!m || !m.key) {
    console.warn('⚠️ Message ou clé manquante dans buildContext');
    return {};
  }

  const participant = m.key.participant || m.key.remoteJid;
  
  if (!participant || typeof participant !== 'string') {
    console.warn('⚠️ JID invalide dans buildContext:', participant);
    return {};
  }

  return {
    mentionedJid: [participant],
    forwardingScore: 99,
    isForwarded: true
  };
}

// ——————————————————————————————————————————————
// 5. Fonctions d'envoi améliorées
// ——————————————————————————————————————————————
async function sendMenuWithImage(sock, jid, options = {}) {
  if (!sock || !jid) {
    console.error('❌ Socket ou JID manquant dans sendMenuWithImage');
    return;
  }

  const prefix = config.prefix;
  const menuConfig = { ...defaultConfig, ...options };
  
  const menuText = [
    '╭─「 🤖 *BOT MENU* 🤖 」',
    '│',
    '├─ 📋 *COMMANDES DISPONIBLES*',
    '│',
    `├─ ${prefix}ping – 🏓 Test de latence`,
    `├─ ${prefix}alive – ✅ Statut du bot`,
    `├─ ${prefix}repo – 📦 Code source`,
    '│',
    '├─ 👥 *GESTION DE GROUPE*',
    `├─ ${prefix}mute – 🔇 Silence le bot`,
    `├─ ${prefix}unmute – 🔊 Réactive le bot`,
    `├─ ${prefix}tagall – 📢 Mentionner tous`,
    `├─ ${prefix}hidetag – 🫥 Mention cachée`,
    '│',
    '├─ 🎉 *AUTOMATISATION*',
    `├─ ${prefix}welcome – 👋 Message d'accueil`,
    `├─ ${prefix}goodbye – 👋 Message d'adieu`,
    '│',
    '╰─ 💻 *Développé avec ❤️*',
    '',
    '🚀 *Bot actif et prêt !*'
  ].join('\n');

  const contextInfo = {
    mentionedJid: [],
    forwardingScore: 99,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: menuConfig.newsletterJid,
      serverMessageId: 20,
      newsletterName: menuConfig.channelName
    },
    externalAdReply: {
      title: menuConfig.botName,
      body: menuConfig.channelName,
      thumbnailUrl: menuConfig.thumbnailUrl,
      sourceUrl: menuConfig.channelUrl,
      mediaType: 1,
      renderLargerThumbnail: true,
      showAdAttribution: true,
      containsAutoReply: true
    }
  };

  try {
    return await sock.sendMessage(jid, { 
      text: menuText,
      contextInfo: contextInfo
    });
  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi du menu avec image:', err);
    // Fallback vers menu simple
    try {
      return await sock.sendMessage(jid, { text: stylise(menuText) });
    } catch (fallbackErr) {
      console.error('❌ Erreur dans le fallback du menu:', fallbackErr);
      throw fallbackErr;
    }
  }
}

// Menu simple (fonction originale)
async function sendMenu(sock, jid) {
  if (!sock || !jid) {
    console.error('❌ Socket ou JID manquant dans sendMenu');
    return;
  }

  const prefix = config.prefix;
  const menuText = [
    '✨ *Menu du bot* ✨',
    '',
    `• ${prefix}ping – test de latence`,
    `• ${prefix}alive – statut du bot`,
    `• ${prefix}mute / ${prefix}unmute – silence / réactivation`,
    `• ${prefix}tagall – mentionner tous`,
    `• ${prefix}hidetag – mention cachée`,
    `• ${prefix}repo – lien GitHub`,
    `• ${prefix}welcome / ${prefix}goodbye – messages auto`
  ].join('\n');

  try {
    return await sock.sendMessage(jid, { text: stylise(menuText) });
  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi du menu:', err);
    throw err;
  }
}

async function sendReply(sock, m, text, quoted = m, useEnhancedContext = false) {
  if (!sock || !m || !text) {
    console.error('❌ Paramètres manquants dans sendReply');
    return;
  }

  if (!m.key || !m.key.remoteJid) {
    console.error('❌ JID distant manquant dans sendReply');
    return;
  }

  try {
    const contextInfo = useEnhancedContext ? 
      buildEnhancedContext(m) : 
      buildContext(m);
    
    return await sock.sendMessage(m.key.remoteJid, {
      text: stylise(text),
      contextInfo
    }, { quoted });
  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi de la réponse:', err);
    // Fallback: envoi simple
    try {
      return await sock.sendMessage(m.key.remoteJid, {
        text: stylise(text)
      }, { quoted });
    } catch (fallbackErr) {
      console.error('❌ Erreur dans le fallback:', fallbackErr);
      throw fallbackErr;
    }
  }
}

// ——————————————————————————————————————————————
// 6. Fonction utilitaire pour valider les JIDs
// ——————————————————————————————————————————————
function isValidJid(jid) {
  return jid && typeof jid === 'string' && jid.includes('@');
}

// ——————————————————————————————————————————————
// 7. Export des utilitaires
// ——————————————————————————————————————————————
module.exports = {
  db,
  saveDB,
  stylise,
  sendMenu,
  sendMenuWithImage,
  sendReply,
  buildContext,
  buildEnhancedContext,
  isValidJid,
  defaultConfig
};