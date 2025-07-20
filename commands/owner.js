// commands/owner.js

module.exports = {
  name: 'owner',
  description: 'Affiche les informations de contact du propriétaire du bot',
  
  async execute({ sock, msg, config, stylise }) {
    // Vérifications de sécurité
    if (!sock || !msg || !msg.key || !msg.key.remoteJid) {
      console.error('❌ Paramètres manquants dans la commande owner');
      return;
    }

    const jid = msg.key.remoteJid;
    
    // Création de la vCard
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${config.botOwner}
TEL;waid=${config.ownerNumber}:${config.ownerNumber}
END:VCARD
`;

    // Configuration du contextInfo avec image et lien (optionnel)
    const contextInfo = {
      mentionedJid: [],
      forwardingScore: 99,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363419336864081@newsletter',
        serverMessageId: 21,
        newsletterName: 'Jł₦₩ØØ'
      },
      externalAdReply: {
        title: "Contact Owner",
        body: `${config.botOwner} - Propriétaire du bot`,
        thumbnailUrl: 'https://i.postimg.cc/Hn9PbMg1/2c6ca349055f63a31a122697503257dd.jpg', // ⚠️ Remplacez par votre image
        sourceUrl: 'https://youtube.com/@votre-chaine', // ⚠️ Remplacez par votre lien
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        containsAutoReply: true,
        jpegThumbnail: null
      }
    };

    
        // Fallback 2: Message texte avec les informations
        try {
          const fallbackText = [
            '╔═══════◇◆◇═══════╗',
            '⌜ 𝗢𝗪𝗡𝗘𝗥 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 ⌟',
            '╚═══════◇◆◇═══════╝',
            '',
            ` *Nom:* ${config.botOwner}`,
            ` *Numéro:* ${config.ownerNumber}`,
            '',
            '*by dxdev*'
          ].join('\n');

          await sock.sendMessage(jid, { 
            text: stylise ? stylise(fallbackText) : fallbackText 
          });
          console.log('⚠️ Informations owner envoyées en fallback texte');
        } catch (finalErr) {
          console.error('❌ Erreur dans le fallback final:', finalErr);
        }
      }
    }
  }
};
