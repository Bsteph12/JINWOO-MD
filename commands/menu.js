// commands/menu.js

module.exports = {
  name: 'menu',
  description: 'Affiche le menu principal du bot avec image et lien',
  
  async execute({ sock, msg, config, stylise }) {
    // Vérifications de sécurité
    if (!sock || !msg || !msg.key || !msg.key.remoteJid) {
      console.error('❌ Paramètres manquants dans la commande menu');
      return;
    }

    const jid = msg.key.remoteJid;
    const prefix = config.prefix;
    
    const menuText = [
      '╔═══════◇◆◇═══════╗' , 
      '⌜ 𝗝ł₦₩ØØ : システム起動 ⌟' , 
      '╚═══════◇◆◇═══════╝ ',
      '', 
      '', 
      `▸ *PREFIX*   : ${prefix}`, 
      `▸ *USER*     : ${config.botOwner} `, 
      `▸ *NUMBER*   : ${config.botNumber} `, 
      '▸ *COMMMAND* : 50' , 
   '', 
   '', 

      '│',
      '├─ 📋 *SETTING*',
      '│',
      `├─ ${prefix}ping`,
      `├─ ${prefix}alive`,
      `├─ ${prefix}repo`,
      '│',
      '├─ 👥 *GROUP MENU*',
      `├─ ${prefix}mute`,
      `├─ ${prefix}unmute`,
      `├─ ${prefix}tagall`,
      `├─ ${prefix}hidetag`,
      '│',
      '├─ 🎉 *FEATURES*',
      `├─ ${prefix}welcome `,
      `├─ ${prefix}goodbye`,
      '│',
      '╰─ 💻 *by ste_phane_*',
      '',
  
    ].join('\n');

    // Configuration du contextInfo avec image et lien
    const contextInfo = {
      mentionedJid: [],
      forwardingScore: 99,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363419336864081@newsletter',
        serverMessageId: 20,
        newsletterName: 'Jł₦₩ØØ'
      },
      externalAdReply: {
        title: "Jł₦₩ØØ",
        body: "by ×͜×丂ㄒ乇_卩卄卂几乇_༒",
        thumbnailUrl: 'https://i.postimg.cc/Hn9PbMg1/2c6ca349055f63a31a122697503257dd.jpg', // ⚠️ Remplacez par votre image
        sourceUrl: 'https://youtube.com/@votre-chaine', // ⚠️ Remplacez par votre lien
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true,
        containsAutoReply: true,
        jpegThumbnail: null // Optionnel : buffer d'image locale
      }
    };

    try {
      await sock.sendMessage(jid, { 
        text: menuText,
        contextInfo: contextInfo
      });
      
      console.log('✅ Menu envoyé avec succès avec image et lien');
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi du menu enrichi:', err);
      
      // Fallback 1: Menu stylisé sans contextInfo
      try {
        await sock.sendMessage(jid, { 
          text: stylise(menuText) 
        });
        console.log('⚠️ Menu envoyé en fallback (stylisé)');
      } catch (fallbackErr) {
        console.error('❌ Erreur dans le fallback stylisé:', fallbackErr);
        
        // Fallback 2: Menu simple
        try {
          await sock.sendMessage(jid, { 
            text: menuText 
          });
          console.log('⚠️ Menu envoyé en fallback simple');
        } catch (finalErr) {
          console.error('❌ Erreur dans le fallback final:', finalErr);
        }
      }
    }
  }
};