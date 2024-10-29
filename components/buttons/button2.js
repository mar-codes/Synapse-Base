const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'button2',
    async execute(interaction, client) {
        const modal = new ModalBuilder()
            .setCustomId('modal')
            .setTitle('Modal')

        const input = new TextInputBuilder()
            .setCustomId('input')
            .setPlaceholder('Enter something...')
            .setLabel('Input')
            .setStyle(TextInputStyle.Short)

        const row = new ActionRowBuilder().addComponents(input)

        modal.addComponents(row)

        await interaction.showModal(modal);
    }
}