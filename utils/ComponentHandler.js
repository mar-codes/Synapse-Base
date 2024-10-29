const fs = require('node:fs');
const path = require('node:path');

function parseCustomId(customId) {
    const [baseId, ...args] = customId.split('-');
    return { baseId, args };
}

function setupComponentHandler(client) {
    client.components = new Map();
    client.componentsByType = new Map();
    client.components.parseCustomId = parseCustomId;

    const componentsPath = path.join(__dirname, '..', 'components');
    const componentTypes = fs.readdirSync(componentsPath).filter(file => fs.statSync(path.join(componentsPath, file)).isDirectory());

    const usedCustomIds = new Set();
    let totalComponents = 0;

    for (const type of componentTypes) {
        const typePath = path.join(componentsPath, type);
        const componentFiles = fs.readdirSync(typePath).filter(file => file.endsWith('.js'));
        totalComponents += componentFiles.length;

        if (!client.componentsByType.has(type)) {
            client.componentsByType.set(type, new Map());
        }

        for (const file of componentFiles) {
            const component = require(path.join(typePath, file));

            if (!component.customId) {
                client.logs.error(`The ${type} component at ${path.join(typePath, file)} is missing a required "customId" property.`);
                continue;
            }

            if (!component.execute) {
                client.logs.error(`The ${type} component at ${path.join(typePath, file)} is missing a required "execute" property.`);
                continue;
            }

            if (usedCustomIds.has(component.customId)) {
                client.logs.error(`Duplicate customId "${component.customId}" found in ${file}. Component IDs must be unique across all component types.`);
                continue;
            }
            
            component.type = type;
            usedCustomIds.add(component.customId);
            client.components.set(component.customId, component);
            client.componentsByType.get(type).set(component.customId, component);
        }
    }
    client.logs.component(`Loaded ${totalComponents} component(s)`);
}

module.exports = setupComponentHandler;