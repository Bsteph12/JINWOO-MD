module.exports = {
  name: 'mute',
  description: 'Met en silence le bot',
  async execute({ sock, msg, db, saveDB, sendReply }) {
    const jid = msg.key.remoteJid;
    db[jid] = db[jid] || {};
    db[jid].muted = true;
    saveDB();
    await sendReply(sock, msg, '🔇 Bot mis en silence.');
  }
};