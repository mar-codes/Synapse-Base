module.exports = {
    command: 'commandname',
    
    async execute(message, args, client) {
        await message.reply('Hello!');
    }
};