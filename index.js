const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: require("./utils/IntentChecker.js")(),
    failIfNotExists: false,
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    rest: { retries: 3, timeout: 15000, sweepInterval: 300 }
});

client.logs = require("./utils/Logger.js");
client.commands = new Map();
client.components = new Map();
client.config = require("./config.json");
client.fetch = require('./utils/Other/FetchUtils.js')(client);
client.roleUtils = require('./utils/Other/RoleUtils.js')(client);

require('./utils/EnvironmentCheck.js')(client);
require('./utils/CacheSetup.js')(client);
require('./utils/PackageChecker.js')(client);

async function login(attempts = 0) {
    try {
        await client.login(client.config.token);
    } catch (error) {
        if (attempts < 5) {
            await new Promise(r => setTimeout(r, 5000));
            return login(attempts + 1);
        }
        client.logs.error(`Failed to log in after 5 attempts`);
        process.exit(1);
    }
}

(async () => {
    try {
        await require('./utils/InitializeHandlers.js')(client);
        client.on('ready', () => client.handlersInitialized && client.logs.system(`Logged in as ${client.user.tag}!`));
        await login();
        require('./utils/lineCount.js')
    } catch (error) {
        client.logs.error(`Initialization failed: ${error.message}`);
        process.exit(1);
    }
})();