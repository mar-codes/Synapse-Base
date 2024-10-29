const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require('node:path');
const logs = require('./Logger');

const IGNORED_FOLDERS = ['node_modules', '.git'];
const IGNORED_PACKAGES = ['@discordjs'];
const builtInModules = new Set(['assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib']);

function ReadFolder(basePath = '', depth = 5) {
    const files = [];
    const fullPath = path.join(__dirname, basePath);
    
    if (!fs.existsSync(fullPath)) return [];
    
    function readDirectory(currentPath, currentDepth) {
        if (currentDepth === 0) return;
        const folderFiles = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const file of folderFiles) {
            const filePath = path.join(currentPath, file.name);
            if (file.isDirectory()) {
                if (!IGNORED_FOLDERS.includes(file.name)) readDirectory(filePath, currentDepth - 1);
                continue;
            }
            if (file.name.endsWith('.js')) files.push(filePath);
        }
    }

    readDirectory(fullPath, depth);
    return files;
}

function getPackages(file) {
    const content = fs.readFileSync(file, "utf-8");
    const packages = new Set();
    const requirePattern = /(?:require|from|import)\s*(?:\()?['"`]([^'"`{}$]+)['"`]/g;
    let match;
    
    while ((match = requirePattern.exec(content)) !== null) {
        const pkg = match[1].split('/')[0];
        if (IGNORED_PACKAGES.includes(pkg)) {
            continue;
        }
        if (!builtInModules.has(pkg) && !pkg.startsWith('node:') && !pkg.startsWith('.')) {
            packages.add(pkg);
        }
    }
    
    return Array.from(packages);
}

function npmCommand(command) {
    try {
        execSync(command, { 
            stdio: "pipe",
            shell: true,
            env: { ...process.env, NODE_ENV: 'development' }
        });
    } catch (error) {
        logs.error(`npm command failed: ${error.message}`);
        if (command.includes('install')) {
            const packages = command.split(' ').slice(2);
            for (const pkg of packages) {
                try {
                    execSync(`npm install "${pkg}"`, {
                        stdio: "pipe",
                        shell: true,
                        env: { ...process.env, NODE_ENV: 'development' }
                    });
                } catch (err) {
                    logs.error(`Failed to install ${pkg}: ${err.message}`);
                }
            }
        }
    }
}

function managePackages(client) {
    try {
        const files = ReadFolder('..', 3);
        const packageJSONPath = path.join(__dirname, '..', 'package.json');

        if (!fs.existsSync(packageJSONPath)) {
            throw new Error("No package.json found");
        }
        const packageJSON = require(packageJSONPath);
        const installedPackages = new Set(Object.keys(packageJSON.dependencies || {}));
        const requiredPackages = new Set(files.flatMap(getPackages));

        const unusedPackages = Array.from(installedPackages).filter(pkg => !requiredPackages.has(pkg));
        const missingPackages = Array.from(requiredPackages).filter(pkg => {
            const cleanName = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
            return !fs.existsSync(path.join(__dirname, '..', 'node_modules', cleanName)) && !installedPackages.has(pkg);
        });

        if (unusedPackages.length) {
            logs.info(`Removing unused packages: ${unusedPackages.join(", ")}`);
            npmCommand(`npm uninstall ${unusedPackages.join(" ")}`);
        }

        if (missingPackages.length) {
            logs.info(`Installing missing packages: ${missingPackages.join(", ")}`);
            for (const pkg of missingPackages) {
                npmCommand(`npm install "${pkg}"`);
            }
        }
        
        logs.info(`Installed ${missingPackages.length} missing packages and removed ${unusedPackages.length} unused packages`);
    } catch (error) {
        logs.error(`Package management failed: ${error.message}`);
        throw error;
    }
}

module.exports = managePackages;