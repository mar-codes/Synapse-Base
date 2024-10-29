module.exports = {
    customId: 'select',
    async execute(interaction, client) {
        await interaction.reply({ content: 'select works', ephemeral: true });
        console.log('select works');
    }
}