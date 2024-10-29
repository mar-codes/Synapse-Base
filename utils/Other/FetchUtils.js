module.exports = (client) => ({
    async getUser(userId) {
        try {
            const user = await client.users.fetch(userId);
            client.logs.fetch(`Successfully fetched user ${userId}`);
            return user;
        } catch (error) {
            client.logs.error(`Failed to fetch user ${userId}: ${error.message}`);
            return null;
        }
    },

    async getGuild(guildId) {
        try {
            const guild = await client.guilds.fetch(guildId);
            client.logs.fetch(`Successfully fetched guild ${guildId}`);
            return guild;
        } catch (error) {
            client.logs.error(`Failed to fetch guild ${guildId}: ${error.message}`);
            return null;
        }
    },

    async getMember(guildId, userId) {
        try {
            const guild = await client.guilds.fetch(guildId);
            if (!guild) {
                client.logs.error(`Failed to fetch member ${userId}: Guild ${guildId} not found`);
                return null;
            }
            const member = await guild.members.fetch(userId);
            client.logs.fetch(`Successfully fetched member ${userId} from guild ${guildId}`);
            return member;
        } catch (error) {
            client.logs.error(`Failed to fetch member ${userId} from guild ${guildId}: ${error.message}`);
            return null;
        }
    },

    async getChannel(channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            client.logs.fetch(`Successfully fetched channel ${channelId}`);
            return channel;
        } catch (error) {
            client.logs.error(`Failed to fetch channel ${channelId}: ${error.message}`);
            return null;
        }
    },

    async getMessage(channelId, messageId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                client.logs.error(`Failed to fetch message ${messageId}: Channel ${channelId} not found`);
                return null;
            }
            const message = await channel.messages.fetch(messageId);
            client.logs.fetch(`Successfully fetched message ${messageId} from channel ${channelId}`);
            return message;
        } catch (error) {
            client.logs.error(`Failed to fetch message ${messageId} from channel ${channelId}: ${error.message}`);
            return null;
        }
    },
    
    async getRole(guildId, roleId) {
        try {
            const guild = await client.guilds.fetch(guildId);
            if (!guild) {
                client.logs.error(`Failed to fetch role ${roleId}: Guild ${guildId} not found`);
                return null;
            }
            const role = await guild.roles.fetch(roleId);
            client.logs.fetch(`Successfully fetched role ${roleId} from guild ${guildId}`);
            return role;
        } catch (error) {
            client.logs.error(`Failed to fetch role ${roleId} from guild ${guildId}: ${error.message}`);
            return null;
        }
    }
});