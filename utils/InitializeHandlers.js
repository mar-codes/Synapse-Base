module.exports = async (client) => {
    try {
        const ProcessHandler = require("./ProcessHandler");
        ProcessHandler.setup();
        ProcessHandler.setClient(client);
        await require('./DBConnector.js').setupDatabase(client);

        await Promise.all([
            require("./CommandLoader")(client),
            require('./ComponentHandler')(client),
            require('./EventHandler')(client),
            require('./Other/TemplateGen.js')(client),
            require('./PrefixHandler')(client),
            require('./InteractionHandler')(client),
            require('./Other/RoleUtils.js')(client),
        ]);

        await require('./HotReload')(client);
        
        client.handlersInitialized = true;
    } catch (error) {
        client.logs.error(`Failed to initialize handlers: ${error.message}`);
        process.exit(1);
    }
};