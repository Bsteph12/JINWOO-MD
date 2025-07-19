module.exports = {
  name: 'ping',
  description: 'Répond pong et latence',
  async execute({ sock, msg, sendReply }) {
    const t0 = Date.now();
    await sendReply(sock, msg, '🏓 Pong...');
    const t1 = Date.now() - t0;
    await sendReply(sock, msg, `🕒 Latence : ${t1} ms`);
  }
};