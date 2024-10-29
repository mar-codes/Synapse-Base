module.exports = {
    customId: 'args',
    async execute(interaction, args, client) {
        await interaction.reply({ content: `Args: ${args.join(', ')}`, ephemeral: true });
    }
}