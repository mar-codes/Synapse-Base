const fs = require('node:fs');
const path = require('node:path');

const templates = {
    commands: `const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description'),
        
    async execute(interaction, client) {
        await interaction.reply('Hello!');
    }
};`,

    buttons: `module.exports = {
    customId: 'buttonid',
    
    async execute(interaction, args, client) {
        await interaction.reply('Button clicked!');
    }
};`,

    menus: `module.exports = {
    customId: 'menuid',
    
    async execute(interaction, args, client) {
        const selected = interaction.values[0];
        await interaction.reply(\`Selected: \${selected}\`);
    }
};`,

    modals: `module.exports = {
    customId: 'modalid',
    
    async execute(interaction, args, client) {
        const input = interaction.fields.getTextInputValue('inputid');
        await interaction.reply(\`Received: \${input}\`);
    }
};`,

    prefix: `module.exports = {
    command: 'commandname',
    
    async execute(message, args, client) {
        await message.reply('Hello!');
    }
};`,

    events: `module.exports = {
    event: 'eventName',
    once: false,
    
    async execute(client, ...args) {
        // Your event code here
    }
};`
};

function setupTemplateGenerator(client) {
    const componentsPath = path.join(__dirname, '..', '..', 'components');
    const commandsPath = path.join(__dirname, '..', '..', 'commands');
    const prefixPath = path.join(__dirname, '..', '..', 'prefix');
    const eventsPath = path.join(__dirname, '..', '..', 'events');

    const watchPaths = {
        commands: commandsPath,
        buttons: path.join(componentsPath, 'buttons'),
        menus: path.join(componentsPath, 'menus'),
        modals: path.join(componentsPath, 'modals'),
        prefix: prefixPath,
        events: eventsPath
    };

    for (const [type, dir] of Object.entries(watchPaths)) {
        fs.mkdirSync(dir, { recursive: true });
        
        fs.watch(dir, (eventType, filename) => {
            if (eventType === 'rename' && filename?.endsWith('.js')) {
                const filePath = path.join(dir, filename);
                
                if (!fs.existsSync(filePath)) return;
                
                const stats = fs.statSync(filePath);
                if (stats.size === 0) {
                    fs.writeFileSync(filePath, templates[type]);
                    client.logs.system(`Generated ${type} template for ${filename}`);
                }
            }
        });
    }
}

module.exports = setupTemplateGenerator;