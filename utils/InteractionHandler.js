const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder } = require('discord.js');

function createHandler(client) {
    const cooldowns = new Map();
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

    const validationChecks = {
        guildOnly: (context, command) => {
            return !command.guildOnly || context.guild;
        },
        devGuild: (context, command) => {
            return !command.devGuild || context.guild.id === config.devGuild;
        },
        developer: (context, command) => {
            return !command.devOnly || config.developerIds.includes(context.user?.id || context.author?.id);
        },
        permissions: (context, command) => {
            if (!command.perms?.length) return true;
            const member = context.member;
            if (!member) return false;
            const missingPerms = command.perms.filter(perm => !member.permissions.has(perm));
            return missingPerms.length === 0;
        },
        cooldown: (context, command) => {
            if (!command.cooldown) return true;
            
            const commandName = context.commandName || command.command;
            const subCommand = context.options?.getSubcommand(false);
            const cooldownKey = subCommand ? `${commandName}-${subCommand}` : commandName;
            
            const timestamps = cooldowns.get(cooldownKey) || new Map();
            cooldowns.set(cooldownKey, timestamps);
            
            const now = Date.now();
            const cooldownAmount = command.cooldown * 1000;
            const userId = context.user?.id || context.author?.id;
            const userExpiration = timestamps.get(userId);
            
            if (userExpiration && now < userExpiration) {
                const timeLeft = (userExpiration - now) / 1000;
                const reply = `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${cooldownKey}\` command.`;
                if (context.reply) {
                    context.reply({ content: reply, ephemeral: true });
                } else {
                    context.channel.send(reply);
                }
                return false;
            }
            
            timestamps.set(userId, now + cooldownAmount);
            setTimeout(() => timestamps.delete(userId), cooldownAmount);
            return true;
        }
    };

    const validationMessages = {
        guildOnly: 'This command can only be used in a server.',
        devGuild: 'This command can only be used in the development guild.',
        developer: 'This command is only available to developers.',
        permissions: (context, command) => {
            const missingPerms = command.perms.filter(perm => !context.member.permissions.has(perm));
            return `You lack the following permissions: ${missingPerms.join(', ')}`;
        }
    };

    async function handleError(context, error) {
        client.logs.error(`Error: ${error.stack}`);
        const errorMessage = error.toString().slice(0, 3997) + '...';
        const embed = new EmbedBuilder()
            .setTitle('An error occurred!')
            .setColor("Red")
            .setDescription('```' + errorMessage + '```');

        if (context.reply) {
            const replyMethod = (context.deferred || context.replied) ? 'followUp' : 'reply';
            await context[replyMethod]({ embeds: [embed], ephemeral: true }).catch(console.error);
        } else {
            await context.channel.send({ embeds: [embed] }).catch(console.error);
        }
    }

    async function validateAndExecute(context, command, args = []) {
        const userTag = context.user?.tag || context.author?.tag;
        const commandName = context.commandName || command.command;
        client.logs.command(`Command "${commandName}" used by ${userTag}`);
    
        for (const [check, validator] of Object.entries(validationChecks)) {
            if (!validator(context, command)) {
                const message = typeof validationMessages[check] === 'function' 
                    ? validationMessages[check](context, command)
                    : validationMessages[check];
                    
                client.logs.warn(`User ${userTag} was blocked from using ${commandName} by ${check} check`);
                
                if (message) {
                    if (context.reply) {
                        await context.reply({ content: message, ephemeral: true });
                    } else {
                        await context.channel.send(message);
                    }
                }
                return;
            }
        }
    
        try {
            if (context.isCommand?.()) {
                await command.execute(context, client);
            } else {
                await command.execute(context, args, client);
            }
        } catch (error) {
            await handleError(context, error);
        }
    }

    async function handleInteraction(interaction) {
        try {
            switch (true) {
                case interaction.isCommand():
                    await validateAndExecute(interaction, client.commands.get(interaction.commandName));
                    break;
    
                case interaction.isButton():
                case interaction.isAnySelectMenu():
                case interaction.isModalSubmit(): {
                    const { baseId, args } = client.components.parseCustomId(interaction.customId);
                    const component = client.components.get(baseId);
                    
                    if (!component) {
                        throw new Error('This component doesn\'t exist.');
                    }
                    
                    client.logs.component(`Component "${baseId}" activated by ${interaction.user.tag} with args: ${args.join(', ')}`);
                    await component.execute(interaction, args, client);
                    break;
                }
            }
        } catch (error) {
            await handleError(interaction, error);
        }
    }

    async function handleMessage(message) {
        if (!message.content.startsWith(client.config.prefix) || message.author.bot) return;

        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.prefixCommands.get(commandName);
        
        if (command) {
            await validateAndExecute(message, command, args);
        }
    }

    client.handleInteraction = handleInteraction;
    client.handleMessage = handleMessage;

    return { handleInteraction, handleMessage };
}

module.exports = (client) => {
    const handler = createHandler(client);
    client.on('interactionCreate', handler.handleInteraction);
    client.on('messageCreate', handler.handleMessage);
    return handler;
};