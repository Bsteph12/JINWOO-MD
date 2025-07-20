// commands/viewonce.js

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'viewonce',
  description: 'Révèle les messages view once (images/vidéos)',
  aliases: ['vo', 'antiviewonce'],
  
  async execute({ sock, msg, config, stylise }) {
    // Vérifications de sécurité
    if (!sock || !msg || !msg.key || !msg.key.remoteJid) {
      console.error('❌ Paramètres manquants dans la commande viewonce');
      return;
    }

    const jid = msg.key.remoteJid;
    
    // Configuration du contextInfo enrichi
    const contextInfo = {
      mentionedJid: [],
      forwardingScore: 99,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363419336864081@newsletter',
        serverMessageId: 23,
        newsletterName: 'Jł₦₩ØØ Anti-ViewOnce'
      },
      externalAdReply: {
        title: "💀 Anti ViewOnce",
        body: "Révélateur de messages secrets",
        thumbnailUrl: 'https://i.postimg.cc/Hn9PbMg1/2c6ca349055f63a31a122697503257dd.jpg',
        sourceUrl: 'https://youtube.com/@votre-chaine',
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        containsAutoReply: true
      }
    };

    try {
      // Extraction du message cité avec gestion d'erreurs améliorée
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                           msg.message?.imageMessage ||
                           msg.message?.videoMessage;

      if (!quotedMessage) {
        const helpText = [
          '╔═══════◇◆◇═══════╗',
          '⌜ 💀 𝗔𝗡𝗧𝗜 𝗩𝗜𝗘𝗪𝗢𝗡𝗖𝗘 ⌟',
          '╚═══════◇◆◇═══════╝',
          '',
          '❌ *Message manquant !*',
          '',
          '📖 *Comment utiliser:*',
          '1️⃣ Répondez à un message ViewOnce',
          '2️⃣ Tapez la commande',
          '3️⃣ Le contenu sera révélé',
          '',
          '🎯 *Fonctionne avec:*',
          '• 📸 Images ViewOnce',
          '• 📹 Vidéos ViewOnce',
          '',
          '💻 *by ste_phane_*'
        ].join('\n');

        return await sock.sendMessage(jid, { 
          text: stylise ? stylise(helpText) : helpText,
          contextInfo: contextInfo
        });
      }

      console.log('🔍 Analyse du message pour détection ViewOnce...');

      // Détection améliorée des messages view once
      const isViewOnceImage = quotedMessage.imageMessage?.viewOnce === true || 
                             quotedMessage.viewOnceMessage?.message?.imageMessage ||
                             msg.message?.viewOnceMessage?.message?.imageMessage;
                             
      const isViewOnceVideo = quotedMessage.videoMessage?.viewOnce === true || 
                             quotedMessage.viewOnceMessage?.message?.videoMessage ||
                             msg.message?.viewOnceMessage?.message?.videoMessage;

      // Récupération du contenu média
      let mediaMessage;
      if (isViewOnceImage) {
        mediaMessage = quotedMessage.imageMessage || 
                      quotedMessage.viewOnceMessage?.message?.imageMessage ||
                      msg.message?.viewOnceMessage?.message?.imageMessage;
      } else if (isViewOnceVideo) {
        mediaMessage = quotedMessage.videoMessage || 
                      quotedMessage.viewOnceMessage?.message?.videoMessage ||
                      msg.message?.viewOnceMessage?.message?.videoMessage;
      }

      if (!mediaMessage) {
        console.log('❌ Structure du message:', JSON.stringify(msg, null, 2));
        
        const errorText = [
          '╔═══════◇◆◇═══════╗',
          '⌜ ❌ 𝗡𝗢𝗡 𝗗𝗘𝗧𝗘𝗖𝗧𝗘 ⌟',
          '╚═══════◇◆◇═══════╝',
          '',
          '🚫 *Message ViewOnce non détecté !*',
          '',
          '🔧 *Vérifications:*',
          '• Répondez bien au message ViewOnce',
          '• Le message doit être récent',
          '• Réessayez avec un autre message',
          '',
          '💡 *Astuce:* Répondez directement',
          'au message ViewOnce',
          '',
          '💻 *by ste_phane_*'
        ].join('\n');

        return await sock.sendMessage(jid, { 
          text: stylise ? stylise(errorText) : errorText,
          contextInfo: contextInfo
        });
      }

      // Traitement des images ViewOnce
      if (isViewOnceImage) {
        try {
          console.log('📸 Traitement de l\'image ViewOnce...');
          
          // Message de traitement
          const processingText = [
            '╔═══════◇◆◇═══════╗',
            '⌜ 📸 𝗧𝗥𝗔𝗜𝗧𝗘𝗠𝗘𝗡𝗧 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            '🔓 *Révélation en cours...*',
            '📸 *Type:* Image ViewOnce',
            '',
            '⏳ _Téléchargement du contenu..._'
          ].join('\n');

          await sock.sendMessage(jid, {
            text: stylise ? stylise(processingText) : processingText,
            contextInfo: contextInfo
          });

          const stream = await downloadContentFromMessage(mediaMessage, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          const caption = mediaMessage.caption || '';
          
          // Message de révélation stylisé
          const revealCaption = [
            '╔═══════◇◆◇═══════╗',
            '⌜ 💀 𝗥𝗘𝗩𝗘𝗟𝗔𝗧𝗜𝗢𝗡 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            '🔓 *Image ViewOnce révélée !*',
            '📸 *Type:* Image secrète',
            caption ? `💬 *Caption:* ${caption}` : '',
            '',
            '💀 *Jł₦₩ØØ Anti-ViewOnce*',
            '💻 *by ste_phane_*'
          ].filter(line => line !== '').join('\n');

          await sock.sendMessage(jid, { 
            image: buffer,
            caption: stylise ? stylise(revealCaption) : revealCaption,
            contextInfo: contextInfo
          }, { quoted: msg });
          
          console.log('✅ Image ViewOnce traitée avec succès');
          return;
          
        } catch (err) {
          console.error('❌ Erreur lors du téléchargement de l\'image:', err);
          
          const errorText = [
            '╔═══════◇◆◇═══════╗',
            '⌜ ❌ 𝗘𝗖𝗛𝗘𝗖 𝗜𝗠𝗔𝗚𝗘 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            '🚫 *Échec du traitement !*',
            '',
            '🔧 *Erreur:* Image indisponible',
            '💡 *Cause possible:*',
            '• Message trop ancien',
            '• Fichier corrompu',
            '• Problème de connexion',
            '',
            '🔄 *Réessayez plus tard*'
          ].join('\n');

          await sock.sendMessage(jid, { 
            text: stylise ? stylise(errorText) : errorText,
            contextInfo: contextInfo
          });
          return;
        }
      }

      // Traitement des vidéos ViewOnce
      if (isViewOnceVideo) {
        try {
          console.log('📹 Traitement de la vidéo ViewOnce...');
          
          // Message de traitement
          const processingText = [
            '╔═══════◇◆◇═══════╗',
            '⌜ 📹 𝗧𝗥𝗔𝗜𝗧𝗘𝗠𝗘𝗡𝗧 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            '🔓 *Révélation en cours...*',
            '📹 *Type:* Vidéo ViewOnce',
            '',
            '⏳ _Téléchargement et traitement..._',
            '📁 _Création du fichier temporaire..._'
          ].join('\n');

          await sock.sendMessage(jid, {
            text: stylise ? stylise(processingText) : processingText,
            contextInfo: contextInfo
          });
          
          // Création du répertoire temporaire
          const tempDir = path.join(__dirname, '../temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const tempFile = path.join(tempDir, `viewonce_${Date.now()}.mp4`);
          const stream = await downloadContentFromMessage(mediaMessage, 'video');
          const writeStream = fs.createWriteStream(tempFile);
          
          for await (const chunk of stream) {
            writeStream.write(chunk);
          }
          writeStream.end();

          // Attente de la fin d'écriture
          await new Promise((resolve) => writeStream.on('finish', resolve));

          const caption = mediaMessage.caption || '';

          // Message de révélation stylisé
          const revealCaption = [
            '╔═══════◇◆◇═══════╗',
            '⌜ 💀 𝗥𝗘𝗩𝗘𝗟𝗔𝗧𝗜𝗢𝗡 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            '🔓 *Vidéo ViewOnce révélée !*',
            '📹 *Type:* Vidéo secrète',
            caption ? `💬 *Caption:* ${caption}` : '',
            '',
            '💀 *Jł₦₩ØØ Anti-ViewOnce*',
            '💻 *by ste_phane_*'
          ].filter(line => line !== '').join('\n');

          await sock.sendMessage(jid, { 
            video: fs.readFileSync(tempFile),
            caption: stylise ? stylise(revealCaption) : revealCaption,
            contextInfo: contextInfo
          }, { quoted: msg });

          // Nettoyage du fichier temporaire
          try {
            fs.unlinkSync(tempFile);
            console.log('🗑️ Fichier temporaire supprimé');
          } catch (cleanupErr) {
            console.error('⚠️ Erreur lors du nettoyage:', cleanupErr);
          }
          
          console.log('✅ Vidéo ViewOnce traitée avec succès');
          return;
          
        } catch (err) {
          console.error('❌ Erreur lors du traitement de la vidéo:', err);
          
          const errorText = [
            '╔═══════◇◆◇═══════╗',
            '⌜ ❌ 𝗘𝗖𝗛𝗘𝗖 𝗩𝗜𝗗𝗘𝗢 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            '🚫 *Échec du traitement !*',
            '',
            '🔧 *Erreur:* Vidéo indisponible',
            '💡 *Cause possible:*',
            '• Fichier trop volumineux',
            '• Format non supporté',
            '• Problème de connexion',
            '',
            '🔄 *Réessayez avec une autre vidéo*'
          ].join('\n');

          await sock.sendMessage(jid, { 
            text: stylise ? stylise(errorText) : errorText,
            contextInfo: contextInfo
          });
          return;
        }
      }

      // Si on arrive ici, ce n'était pas un message ViewOnce
      const notViewOnceText = [
        '╔═══════◇◆◇═══════╗',
        '⌜ ❌ 𝗡𝗢𝗧 𝗩𝗜𝗘𝗪𝗢𝗡𝗖𝗘 ⌟',
        '╚═══════◇◆◇═══════╝',
        '',
        '🚫 *Ce n\'est pas un message ViewOnce !*',
        '',
        '🎯 *Pour utiliser cette commande:*',
        '1️⃣ Trouvez un message ViewOnce',
        '2️⃣ Répondez-lui avec cette commande',
        '3️⃣ Le contenu sera révélé',
        '',
        '📱 *Types supportés:*',
        '• 📸 Images ViewOnce',
        '• 📹 Vidéos ViewOnce',
        '',
        '💻 *by ste_phane_*'
      ].join('\n');

      await sock.sendMessage(jid, { 
        text: stylise ? stylise(notViewOnceText) : notViewOnceText,
        contextInfo: contextInfo
      });

    } catch (error) {
      console.error('❌ Erreur dans la commande viewonce:', error);
      
      // Message d'erreur général stylisé
      const generalErrorText = [
        '╔═══════◇◆◇═══════╗',
        '⌜ ❌ 𝗘𝗥𝗥𝗘𝗨𝗥 𝗚𝗘𝗡𝗘𝗥𝗔𝗟𝗘 ⌟',
        '╚═══════◇◆◇═══════╝',
        '',
        '🚫 *Erreur lors du traitement !*',
        '',
        '🔧 *Détails:* Erreur système',
        '💡 *Solutions:*',
        '• Vérifiez votre connexion',
        '• Réessayez plus tard',
        '• Contactez le support',
        '',
        '🔄 *Réessayez dans quelques minutes*',
        '',
        '💻 *by ste_phane_*'
      ].join('\n');

      // Fallback: Message d'erreur simple
      try {
        await sock.sendMessage(jid, { 
          text: stylise ? stylise(generalErrorText) : generalErrorText,
          contextInfo: contextInfo
        });
      } catch (fallbackErr) {
        console.error('❌ Erreur dans le fallback:', fallbackErr);
        try {
          await sock.sendMessage(jid, { 
            text: '❌ Erreur lors du traitement du message ViewOnce. Réessayez plus tard.'
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
 * Anti-ViewOnce System
 * Adapted by ste_phane_
 */
