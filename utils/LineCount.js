const fs = require('node:fs');
const path = require('node:path');
const log = require('./Logger.js');

const files = [
    './Cache/Cache.js',
    './CacheSetup.js',
    './CommandLoader.js',
    './ComponentHandler.js',
    './DBConnector.js',
    './EnvironmentCheck.js',
    './EventHandler.js',
    './HotReload.js',
    './InitializeHandlers.js',
    './IntentChecker.js',
    './InteractionHandler.js',
    './Logger.js',
    './PackageChecker.js',
    './PrefixHandler.js',
    './ProcessHandler.js',
    './Prompt.js',
    './Other/FetchUtils.js',
    '../index.js'
];

const totalLines = files.reduce((total, file) => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    return total + content.split('\n').length;
}, 0);

log.info(`Total lines in project: ${totalLines}`);