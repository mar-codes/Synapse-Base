const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const Prompt = require('./Prompt');

let config;
try {
    config = require('../config.json');
} catch (error) {
    console.error('Config file not found or invalid');
}

async function checkIfConflict(client) {
    if (config && config.mongoURL && config.sqliteFileName) {
        client.logs.warn('Both MongoDB and SQLite configurations found. Please use only one database type.');
        await cleanupDatabaseFiles(client);
        return true;
    }
    return false;
}

async function setupDatabase(client) {
    const conflict = await checkIfConflict(client);
    if (conflict) {
        return false;
    }

    if (!config?.mongoURL && !config?.sqliteFileName) {
        client.logs.warn('No database configuration found');
        await cleanupDatabaseFiles(client);
    }

    if (config?.mongoURL) {
        return setupMongoDB(client);
    } else if (config?.sqliteFileName) {
        return setupSQLite(client);
    }
    
    return true;
}

async function setupMongoDB(client, retries = 3, delay = 5000) {
    client.logs.database('Connecting to MongoDB');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
            }
            
            await mongoose.connect(config.mongoURL, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                retryReads: true
            });
            
            mongoose.connection.on('disconnected', async () => {
                client.logs.warn('MongoDB disconnected, attempting to reconnect...');
                await setupMongoDB(client);
            });
            
            client.logs.database('Connected to MongoDB');
            await createSchemaFolder(client);
            return;
        } catch (error) {
            if (attempt === retries) {
                client.logs.error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
                await deleteSchemaFolder(client);
                process.exit(1);
            }
            client.logs.warn(`MongoDB connection attempt ${attempt} failed, retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function setupSQLite(client) {
  client.logs.database(`Found SQLite configuration: ${config.sqliteFileName}`);
  const databaseDir = path.join(__dirname, '..','database');
  const setupSqlPath = path.join(databaseDir, 'setup.sql');
  
  const sqliteFileName = config.sqliteFileName.split('.').shift()
  const sqliteFilePath = path.join(__dirname, '..', `${sqliteFileName}.sqlite`);

  try {
    await fs.promises.mkdir(databaseDir, { recursive: true });
    if (!fs.existsSync(setupSqlPath)) {
      await fs.promises.writeFile(setupSqlPath, '-- Put your SQL database code here\n-- CREATE TABLE example (id INTEGER PRIMARY KEY, name TEXT);');
    }
    await setupDB(client, setupSqlPath, sqliteFilePath);
  } catch (error) {
    client.logs.error(`Error setting up SQLite: ${error.message}`);
  }
}

async function cleanupDatabaseFiles(client) {
  const schemaPath = path.join(__dirname, '..', 'schema');
  const databaseDir = path.join(__dirname, '..', 'database');
  const rootDir = path.join(__dirname, '..');

  const hasDatabaseFiles = fs.existsSync(databaseDir) || 
                         fs.existsSync(schemaPath) ||
                         fs.readdirSync(rootDir).some(file => file.endsWith('.sqlite'));

  if (!hasDatabaseFiles) {
      client.logs.info('No database files to delete');
      return true;
  }

  const conf = await Prompt('\x1b[31mDo you want to delete the database files and folders? (y/N) \x1b[0m');
  if (conf.toLowerCase() !== 'y') {
      client.logs.info('Database files and folders were not deleted');
      return true;
  }

  try {
      await fs.promises.rm(schemaPath, { recursive: true, force: true }).catch(() => {});
      await fs.promises.rm(databaseDir, { recursive: true, force: true }).catch(() => {});

      const files = await fs.promises.readdir(rootDir);
      for (const file of files) {
          if (file.endsWith('.sqlite')) {
              await fs.promises.unlink(path.join(rootDir, file)).catch(() => {});
          }
      }
      
      await fs.promises.unlink(path.join(rootDir, 'setup.sql')).catch(() => {});
      
      client.logs.info('Database files and folders deleted');
      return true;
  } catch (error) {
      client.logs.error(`Error cleaning up database files: ${error.message}`);
      return false;
  }
}

async function createSchemaFolder(client) {
  const schemaPath = path.join(__dirname, '..', 'schema');
  try {
    await fs.promises.mkdir(schemaPath, { recursive: true });
    client.logs.success('Schema folder created');
  } catch (error) {
    client.logs.error(`Error creating schema folder: ${error.message}`);
  }
}

async function deleteSchemaFolder(client) {
  const schemaPath = path.join(__dirname, '..', 'schema');
  try {
    const conf = await Prompt('\x1b[31mDo you want to delete the schema folder? (y/N) \x1b[0m');
    if (conf.toLowerCase() === 'y') {
      await fs.promises.rm(schemaPath, { recursive: true, force: true });
      client.logs.info('Schema folder deleted');
    } else {
      client.logs.info('Schema folder was not deleted');
    }
  } catch (error) {
    client.logs.error(`Error deleting schema folder: ${error.message}`);
  }
}

async function setupDB(client, sqlFilePath, dbPath) {
  try {
    fs.mkdirSync(`${__dirname}/../database`, { recursive: true });

    const sqlContent = await fs.promises.readFile(sqlFilePath, 'utf-8');
    if (!sqlContent.trim()) {
      client.logs.warn('setup.sql is empty. Please add your database schema.');
      return;
    }

    client.db = new Database(dbPath);
    const sqlStatements = sqlContent
      .replace(/^\s*--.*$/gm, '')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    if (sqlStatements.length === 0) {
      client.logs.warn('No valid SQL statements found in setup.sql. Please add your database schema.');
      return;
    }

    client.db.transaction(() => {
      for (const statement of sqlStatements) { 
        client.db.prepare(statement).run();
      }
    })();
    client.logs.info(`Executed ${sqlStatements.length} SQL statement(s) successfully.`);
  } catch (error) {
    client.logs.error(`Error setting up database: ${error.message}`);
    if (client.db) {
      client.db.close();
    }
  }
}

module.exports = { setupDatabase };