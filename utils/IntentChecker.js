const fs = require('node:fs');
const path = require('node:path');
const { GatewayIntentBits } = require('discord.js');
const logs = require('./Logger.js');

module.exports = () => {
    const eventsPath = path.join(__dirname, '..', 'events');
    if (!fs.existsSync(eventsPath)) {
        const intents = [GatewayIntentBits.Guilds];
        logs.system(`No events folder found. Using base intents: ${Object.keys(GatewayIntentBits).filter(k => intents.includes(GatewayIntentBits[k])).join(', ')}`);
        return intents;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    if (eventFiles.length === 0) {
        const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages];
        logs.system(`Added Intents: ${Object.keys(GatewayIntentBits).filter(k => intents.includes(GatewayIntentBits[k])).join(', ')}`);
        return intents;
    }

    const eventToIntentMap = {
        messageCreate: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
        messageDelete: [GatewayIntentBits.GuildMessages],
        messageUpdate: [GatewayIntentBits.GuildMessages],
        messageReactionAdd: [GatewayIntentBits.GuildMessageReactions],
        messageReactionRemove: [GatewayIntentBits.GuildMessageReactions],
        guildMemberAdd: [GatewayIntentBits.GuildMembers],
        guildMemberRemove: [GatewayIntentBits.GuildMembers],
        guildMemberUpdate: [GatewayIntentBits.GuildMembers],
        presenceUpdate: [GatewayIntentBits.GuildPresences],
        voiceStateUpdate: [GatewayIntentBits.GuildVoiceStates],
        typingStart: [GatewayIntentBits.GuildMessageTyping],
        messageDeleteBulk: [GatewayIntentBits.GuildMessages],
        inviteCreate: [GatewayIntentBits.GuildInvites],
        inviteDelete: [GatewayIntentBits.GuildInvites],
    };

    const requiredIntents = new Set([GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]);

    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (eventToIntentMap[event.event]) {
            eventToIntentMap[event.event].forEach(intent => requiredIntents.add(intent));
        }
    }

    const intentsArray = Array.from(requiredIntents);
    logs.system(`Added intents: ${Object.keys(GatewayIntentBits).filter(k => intentsArray.includes(GatewayIntentBits[k])).join(', ')}`);
    return intentsArray;
};