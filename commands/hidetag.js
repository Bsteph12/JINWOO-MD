module.exports = {
  name: 'hidetag',
  description: 'Mention cachée',
  async execute({ sock, msg }) {
    const metadata = await sock.groupMetadata(msg.key.remoteJid);
    const mentions = metadata.participants.map(p => p.id);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '🙈',
      mentions
    });
  }
};