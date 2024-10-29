module.exports = {
    customId: 'modal',
    async execute(interaction, client) {
        await interaction.reply({ content: 'modal works', ephemeral: true });
        console.log('modal works');
    }
}