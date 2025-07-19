module.exports = {
  name: 'repo',
  description: 'Lien du dépôt',
  async execute({ sock, msg, sendReply, config }) {
    await sendReply(sock, msg, `🔗 Repo: ${config.repo}`);
  }
};