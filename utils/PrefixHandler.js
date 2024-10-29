const fs = require('node:fs');
const path = require('node:path');

module.exports = (client) => {
    client.prefixCommands = new Map();
    const prefixCommandsPath = path.join(__dirname, '..', 'prefix');
    const commandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));
    let loadedCommands = 0;

    for (const file of commandFiles) {
        const command = require(path.join(prefixCommandsPath, file));
        const checks = {
            command: 'command',
            execute: 'execute'
        };

        const missingProperty = Object.entries(checks).find(([key]) => !command[key]);
        
        if (missingProperty) {
            client.logs.warn(`The prefix command at ${file} is missing a required "${missingProperty[0]}" ${missingProperty[1]}.`);
            continue;
        }

        if (client.prefixCommands.has(command.command)) {
            client.logs.warn(`The prefix command "${command.command}" is already loaded.`);
            continue;
        }

        client.prefixCommands.set(command.command, command);
        loadedCommands++;
    }

    client.logs.prefix(`Loaded ${loadedCommands} prefix command(s)`);
}