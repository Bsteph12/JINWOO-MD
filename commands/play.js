// commands/play.js

const yts = require('yt-search');
const axios = require('axios');

module.exports = {
  name: 'play',
  description: 'Télécharge et envoie une chanson depuis YouTube',
  
  async execute({ sock, msg, config, stylise }) {
    // Vérifications de sécurité
    if (!sock || !msg || !msg.key || !msg.key.remoteJid) {
      console.error('❌ Paramètres manquants dans la commande play');
      return;
    }

    const jid = msg.key.remoteJid;
    
    try {
      // Extraction du texte de recherche
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || '';
      const searchQuery = text.split(' ').slice(1).join(' ').trim();
      
      if (!searchQuery) {
        const helpText = [
          '╔═══════◇◆◇═══════╗',
          '⌜ 🎵 𝗣𝗟𝗔𝗬 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 ⌟',
          '╚═══════◇◆◇═══════╝',
          '',
          '❌ *Titre manquant !*',
          '',
          `📖 *Usage:* ${config.prefix}play [titre]`,
          `📝 *Exemple:* ${config.prefix}play Imagine Dragons`,
          '',
          '💻 *by ste_phane_*'
        ].join('\n');

        return await sock.sendMessage(jid, { 
          text: stylise ? stylise(helpText) : helpText
        });
      }

      // Message de chargement stylisé
      const loadingText = [
        '╔═══════◇◆◇═══════╗',
        '⌜ 🔍 𝗥𝗘𝗖𝗛𝗘𝗥𝗖𝗛𝗘 ⌟',
        '╚═══════◇◆◇═══════╝',
        '',
        '🎵 *Recherche en cours...*',
        `🎯 *Titre:* ${searchQuery}`,
        '',
        '⏳ _Veuillez patienter..._'
      ].join('\n');

      await sock.sendMessage(jid, {
        text: stylise ? stylise(loadingText) : loadingText
      });

      console.log(`🔍 Recherche YouTube pour: "${searchQuery}"`);

      // Recherche sur YouTube
      const { videos } = await yts(searchQuery);
      if (!videos || videos.length === 0) {
        const noResultText = [
          '╔═══════◇◆◇═══════╗',
          '⌜ ❌ 𝗔𝗨𝗖𝗨𝗡 𝗥𝗘𝗦𝗨𝗟𝗧𝗔𝗧 ⌟',
          '╚═══════◇◆◇═══════╝',
          '',
          '🚫 *Aucune chanson trouvée !*',
          '',
          `🔍 *Recherche:* ${searchQuery}`,
          '💡 *Essayez avec un autre titre*',
          '',
          '💻 *by ste_phane_*'
        ].join('\n');

        return await sock.sendMessage(jid, { 
          text: stylise ? stylise(noResultText) : noResultText
        });
      }

      // Récupération du premier résultat
      const video = videos[0];
      const urlYt = video.url;

      console.log(`✅ Vidéo trouvée: "${video.title}" (${video.duration.text})`);

      // Message de téléchargement
      const downloadText = [
        '╔═══════◇◆◇═══════╗',
        '⌜ 📥 𝗧𝗘𝗟𝗘𝗖𝗛𝗔𝗥𝗚𝗘𝗠𝗘𝗡𝗧 ⌟',
        '╚═══════◇◆◇═══════╝',
        '',
        '🎵 *Téléchargement en cours...*',
        `📀 *Titre:* ${video.title}`,
        `⏱️ *Durée:* ${video.duration.text}`,
        `👀 *Vues:* ${video.views}`,
        '',
        '⬇️ _Téléchargement du fichier audio..._'
      ].join('\n');

      await sock.sendMessage(jid, {
        text: stylise ? stylise(downloadText) : downloadText
      });

      // Récupération de l'audio via API
      console.log('📡 Appel API pour télécharger l\'audio...');
      const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`, {
        timeout: 30000 // 30 secondes de timeout
      });
      const data = response.data;

      if (!data || !data.status || !data.result || !data.result.downloadUrl) {
        throw new Error('API response invalid or missing downloadUrl');
      }

      const audioUrl = data.result.downloadUrl;
      const title = data.result.title || video.title;

      console.log('✅ URL audio récupérée, envoi du fichier...');

      // Configuration du contextInfo pour l'audio
      const contextInfo = {
        mentionedJid: [],
        forwardingScore: 99,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363419336864081@newsletter',
          serverMessageId: 22,
          newsletterName: 'Jł₦₩ØØ Music'
        },
        externalAdReply: {
          title: title,
          body: `Durée: ${video.duration.text} • Vues: ${video.views}`,
          thumbnailUrl: video.thumbnail,
          sourceUrl: urlYt,
          mediaType: 1,
          renderLargerThumbnail: true,
          showAdAttribution: false,
          containsAutoReply: true
        }
      };

      // Envoi de l'audio avec contextInfo
      await sock.sendMessage(jid, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
        contextInfo: contextInfo
      }, { quoted: msg });

      console.log('✅ Audio envoyé avec succès');

    } catch (error) {
      console.error('❌ Erreur dans la commande play:', error);
      
      // Message d'erreur stylisé
      const errorText = [
        '╔═══════◇◆◇═══════╗',
        '⌜ ❌ 𝗘𝗥𝗥𝗘𝗨𝗥 ⌟',
        '╚═══════◇◆◇═══════╝',
        '',
        '🚫 *Échec du téléchargement*',
        '',
        '🔧 *Causes possibles:*',
        '• Vidéo indisponible',
        '• Problème de connexion',
        '• API temporairement down',
        '',
        '💡 *Essayez à nouveau plus tard*',
        '',
        '💻 *by ste_phane_*'
      ].join('\n');

      // Fallback: Message d'erreur simple
      try {
        await sock.sendMessage(jid, { 
          text: stylise ? stylise(errorText) : errorText
        });
      } catch (fallbackErr) {
        console.error('❌ Erreur dans le fallback:', fallbackErr);
        try {
          await sock.sendMessage(jid, { 
            text: "❌ Échec du téléchargement. Veuillez réessayer plus tard."
          });
        } catch (finalErr) {
          console.error('❌ Erreur finale:', finalErr);
        }
      }
    }
  }
};

/*
 * Powered by Jł₦₩ØØ Bot
 * Credits to Keith MD for the API
 * Adapted by ste_phane_
 */
