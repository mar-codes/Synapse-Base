const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = (client) => {
    const baseWatchPaths = ['commands', 'events', 'components', 'prefix'];
    const fileHashes = new Map();
    const watchers = new Map();
    let reloadLock = false;

    const getFileHash = filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return Buffer.from(content).toString('base64');
        } catch {
            return null;
        }
    };

    const loadCommand = async (filePath) => {
        const command = require(filePath);
        if (!command.data || !command.execute) return;

        const rest = new REST().setToken(client.config.token);
        const commandData = command.data.toJSON();

        const oldCommand = client.commands.get(command.data.name);
        if (oldCommand?.alias) {
            oldCommand.alias.forEach(alias => {
                client.commands.delete(alias);
            });
        }
        client.commands.delete(command.data.name);

        client.commands.set(command.data.name, command);

        if (command.alias?.length) {
            command.alias.forEach(alias => {
                if (client.commands.has(alias)) {
                    client.logs.warn(`Duplicate alias "${alias}" for command "${command.data.name}"`);
                    return;
                }
                client.commands.set(alias, command);
                client.logs.command(`Reloaded alias "${alias}" for command "${command.data.name}"`);
            });
        }

        if (command.devGuild) {
            await rest.put(
                Routes.applicationGuildCommands(client.config.botID, client.config.devGuild),
                { body: [commandData] }
            );
        } else {
            await rest.put(
                Routes.applicationCommands(client.config.botID),
                { body: [commandData] }
            );
        }
    };

    const loadEvent = (filePath) => {
        const event = require(filePath);
        if (!event.event || !event.execute) return;

        const existingEvent = client._events[event.event];
        if (existingEvent) client.removeListener(event.event, existingEvent);

        if (event.once) {
            client.once(event.event, (...args) => event.execute(...args, client));
        } else {
            client.on(event.event, (...args) => event.execute(...args, client));
        }
    };

    const loadComponent = (filePath) => {
        const component = require(filePath);
        if (!component.customId || !component.execute) return;

        client.components.set(component.customId, component);
        const type = getComponentType(filePath);
        if (!client.componentsByType.has(type)) {
            client.componentsByType.set(type, new Map());
        }
        client.componentsByType.get(type).set(component.customId, component);
    };

    const loadPrefix = (filePath) => {
        const command = require(filePath);
        if (!command.command || !command.execute) return;
        client.prefixCommands.set(command.command, command);
    };

    const getComponentType = (filePath) => {
        const parts = filePath.split(path.sep);
        const componentsIndex = parts.indexOf('components');
        return parts[componentsIndex + 1] || 'unknown';
    };

    const getBaseFolder = (filePath) => {
        const normalizedPath = filePath.split(path.sep);
        return baseWatchPaths.find(base => normalizedPath.includes(base));
    };

    const handleFileChange = async (filePath) => {
        if (reloadLock) return;
        reloadLock = true;

        const newHash = getFileHash(filePath);
        const oldHash = fileHashes.get(filePath);
        const baseFolder = getBaseFolder(filePath);

        if (newHash === oldHash || !baseFolder) {
            reloadLock = false;
            return;
        }

        fileHashes.set(filePath, newHash);
        
        try {
            delete require.cache[require.resolve(filePath)];
            
            switch(baseFolder) {
                case 'commands':
                    await loadCommand(filePath);
                    break;
                case 'events':
                    loadEvent(filePath);
                    break;
                case 'components':
                    loadComponent(filePath);
                    break;
                case 'prefix':
                    loadPrefix(filePath);
                    break;
            }
            
            client.logs.hotReload(`Reloaded ${path.basename(filePath)}`);
        } catch (error) {
            client.logs.error(`Hot reload error: ${error.message}`);
        }

        reloadLock = false;
    };

    const watchDirectory = (dirPath) => {
        if (watchers.has(dirPath)) return;

        const watcher = fs.watch(dirPath, async (eventType, fileName) => {
            if (!fileName) return;
            
            const fullPath = path.join(dirPath, fileName);
            
            if (eventType === 'rename') {
                try {
                    const stats = await fs.promises.stat(fullPath);
                    if (stats.isDirectory()) {
                        initializeWatcher(fullPath);
                    } else if (fileName.endsWith('.js')) {
                        handleFileChange(fullPath);
                    }
                } catch {
                    watchers.get(dirPath)?.close();
                    watchers.delete(dirPath);
                }
            } else if (eventType === 'change' && fileName.endsWith('.js')) {
                handleFileChange(fullPath);
            }
        });

        watchers.set(dirPath, watcher);
    };

    const initializeWatcher = async (basePath) => {
        try {
            const files = await fs.promises.readdir(basePath, { withFileTypes: true });
            
            for (const file of files) {
                const fullPath = path.join(basePath, file.name);
                
                if (file.isDirectory()) {
                    await initializeWatcher(fullPath);
                } else if (file.name.endsWith('.js')) {
                    fileHashes.set(fullPath, getFileHash(fullPath));
                }
            }
            
            watchDirectory(basePath);
        } catch (error) {
            client.logs.error(`Watch error: ${error.message}`);
        }
    };

    baseWatchPaths.forEach(watchPath => {
        const fullPath = path.join(__dirname, '..', watchPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        initializeWatcher(fullPath);
    });

    process.on('SIGINT', () => {
        watchers.forEach(watcher => watcher.close());
        process.exit(0);
    });
};