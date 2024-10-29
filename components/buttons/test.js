module.exports = {
    customId: 'buttonid',
    
    async execute(interaction, args, client) {
        await interaction.reply('Button clicked!');
    }
};