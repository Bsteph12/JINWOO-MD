module.exports = {
  name: 'welcome',
  description: 'Active/désactive messages de bienvenue',
  async execute({ sock, msg, db, saveDB, sendReply }) {
    const jid = msg.key.remoteJid;
    db[jid] = db[jid] || {};
    db[jid].welcome = !db[jid].welcome;
    saveDB();
    await sendReply(sock, msg, `🎉 Welcome ${db[jid].welcome ? 'activé' : 'désactivé'}`);
  }
};