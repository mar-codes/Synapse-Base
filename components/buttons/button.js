const { ButtonBuilder, ActionRowBuilder } = require('@discordjs/builders');

module.exports = {
    customId: 'button',
    async execute(interaction, client) {
        const button = new ButtonBuilder()
        .setCustomId('button2')
        .setLabel('Button')
        .setStyle('Primary')

        const row = new ActionRowBuilder().addComponents(button)

        await interaction.reply({ content: 'yo', components: [row], ephemeral: true });
    }
}