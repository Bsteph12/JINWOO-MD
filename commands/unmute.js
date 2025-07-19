module.exports = {
  name: 'unmute',
  description: 'Réactive le bot',
  async execute({ sock, msg, db, saveDB, sendReply }) {
    const jid = msg.key.remoteJid;
    db[jid] = db[jid] || {};
    db[jid].muted = false;
    saveDB();
    await sendReply(sock, msg, '🔊 Bot réactivé.');
  }
};