module.exports = {
  name: 'tagall',
  description: 'Mentionne tous les membres',
  async execute({ sock, msg, sendReply }) {
    const metadata = await sock.groupMetadata(msg.key.remoteJid);
    const mentions = metadata.participants.map(p => p.id);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '👥 Attention à tous!',
      mentions
    });
  }
};