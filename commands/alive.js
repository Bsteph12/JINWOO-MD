module.exports = {
  name: 'alive',
  description: 'Statut du bot',
  async execute({ sock, msg, sendReply }) {
    const uptime = process.uptime();
    const hrs = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    await sendReply(sock, msg, `🤖 Bot en ligne depuis ${hrs}h${mins}m`);
  }
};