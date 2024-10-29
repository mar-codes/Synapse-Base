const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description'),
        
    async execute(interaction, client) {
        await interaction.reply('Hello!');
    }
};