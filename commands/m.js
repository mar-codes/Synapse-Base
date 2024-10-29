const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    perms: ["Administrator"],
    devGuild: true,
    alias: ["test"],
    data: new SlashCommandBuilder()
        .setName('m')
        .setDescription('test command lol'),
    async execute(interaction, client) {
        try {
           // easier way to fetch data 
           const user = await client.fetch.getUser('1234567890');
           const role = await client.fetch.getRole('1234567890');
           const channel = await client.fetch.getChannel('1234567890');
           const guild = await client.fetch.getGuild('1234567890');
           const member = await client.fetch.getMember('1234567890');
           const message = await client.fetch.getMessage('1234567890');

            // easier way to compare role heirarchy
            const roleComparison = await client.roleUtils.compareRoles('1252312783098220708', '1290022290070966333', interaction.guild.id);

            if (roleComparison.higher === "1252312783098220708") {
                return await interaction.reply({ content: 'Role 1 is higher than Role 2', ephemeral: true });
            } else { 
                return await interaction.reply({ content: 'Role 2 is higher than Role 1', ephemeral: true });
            }
        } catch (error) {
            await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        }
    }
};