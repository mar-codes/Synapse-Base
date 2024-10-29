const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function RegisterCommands(client) {
    const globalCommands = [];
    const guildCommands = [];
    const commandsCollection = client.commands;
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                const commandData = command.data.toJSON();
                
                if (command.devGuild) {
                    guildCommands.push(commandData);
                } else {
                    globalCommands.push(commandData);
                }
                commandsCollection.set(command.data.name, command);
                
                if (command.alias?.length) {
                    command.alias.forEach(alias => {
                        if (commandsCollection.has(alias)) {
                            client.logs.warn(`Duplicate alias "${alias}" for command "${command.data.name}"`);
                            return;
                        }

                        const aliasData = {
                            ...commandData,
                            name: alias
                        };

                        if (command.devGuild) {
                            guildCommands.push(aliasData);
                        } else {
                            globalCommands.push(aliasData);
                        }

                        commandsCollection.set(alias, command);
                        client.logs.command(`Registered alias "${alias}" for command "${command.data.name}"`);
                    });
                }
            } else {
                client.logs.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }

            if (command.devGuild) {
                const devGuildID = client.config.devGuild;
                if (!devGuildID) {
                    client.logs.warn(`The command "${command.data.name}" is set to a dev guild, but no dev guild ID is set in the config.`);
                }
            }

            if (command.devOnly) {            
                const validDevIds = Array.isArray(client.config.developerIds) ? 
                    client.config.developerIds
                        .filter(id => id && id.toString().trim() !== "")
                        .map(id => BigInt(id.toString().trim())) : [];
                        
                if (validDevIds.length === 0) {
                    client.logs.warn(`The command "${command.data.name}" is set to developer only, but no valid dev IDs are in the developer IDs list.`);
                }
            }
        } catch (error) {
            client.logs.error(`Error loading command from ${filePath}: ${error.message}`);
        }
    }

    const rest = new REST().setToken(client.config.token);

    try {
        if (client.config.devGuild && guildCommands.length > 0) {
            const guildData = await rest.put(
                Routes.applicationGuildCommands(client.config.botID, client.config.devGuild),
                { body: guildCommands }
            );
            client.logs.success(`Loaded ${guildData.length} guild commands`);
            return commandsCollection;
        }

        if (globalCommands.length > 0) {
            const globalData = await rest.put(
                Routes.applicationCommands(client.config.botID),
                { body: globalCommands }
            );
            client.logs.success(`Loaded ${globalData.length} global commands`);
        }
    } catch (error) {
        client.logs.error(`Error refreshing application commands: ${error.message}`);
    }

    return commandsCollection;
}