module.exports = {
    command: 'ping',
    description: 'Replies with Pong!',
    execute: async (message, args, client) => {
        const reply = await message.channel.send('Pinging...');
        const latency = reply.createdTimestamp - message.createdTimestamp;
        reply.edit(`Pong! Latency is ${latency}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    }
};