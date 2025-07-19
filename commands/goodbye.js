module.exports = {
  name: 'goodbye',
  description: 'Active/désactive messages dau revoir',
  async execute({ sock, msg, db, saveDB, sendReply }) {
    const jid = msg.key.remoteJid;
    db[jid] = db[jid] || {};
    db[jid].goodbye = !db[jid].goodbye;
    saveDB();
    await sendReply(sock, msg, `👋 Goodbye ${db[jid].goodbye ? 'activé' : 'désactivé'}`);
  }
};