const rgb = (r, g, b) => `\x1b[38;2;${Math.min(255, Math.max(0, r))};${Math.min(255, Math.max(0, g))};${Math.min(255, Math.max(0, b))}m`;

const colors = {
    reset: "\x1b[0m",
    fg: {
        red: rgb(255, 0, 50),
        green: rgb(0, 255, 100),
        yellow: rgb(255, 255, 0),
        blue: rgb(0, 140, 255),
        magenta: rgb(255, 0, 255),
        white: rgb(255, 255, 255),
        cyan: rgb(0, 255, 255),
        gray: rgb(130, 130, 130),
        lightRed: rgb(255, 50, 50),
        lightGreen: rgb(50, 255, 50),
        orange: rgb(255, 120, 0),
        purple: rgb(200, 0, 255),
        lightPurple: rgb(220, 100, 255),
        lightCyan: rgb(100, 255, 255)
    }
};

const logLevels = new Map([
    ['error', { color: colors.fg.red, label: "[ FATAL ]" }],
    ['warn', { color: colors.fg.orange, label: "[ ALERT ]" }],
    ['info', { color: colors.fg.cyan, label: "[ STATUS ]" }],
    ['debug', { color: colors.fg.gray, label: "[ DEBUG ]" }],
    ['success', { color: colors.fg.lightGreen, label: "[ OK ]" }],
    ['system', { color: colors.fg.blue, label: "[ SYS ]" }],
    ['component', { color: colors.fg.lightPurple, label: "[ COMP ]" }],
    ['command', { color: colors.fg.green, label: "[ CMD ]" }],
    ['prefix', { color: colors.fg.white, label: "[ PREFIX ]" }],
    ['event', { color: colors.fg.lightCyan, label: "[ EVENT ]" }],
    ['hotReload', { color: colors.fg.yellow, label: "[ RELOAD ]" }],
    ['database', { color: colors.fg.magenta, label: "[ DB ]" }],
    ['startup', { color: colors.fg.purple, label: "[ INIT ]" }],
    ['cache', { color: colors.fg.lightRed, label: "[ CACHE ]" }],
    ['api', { color: colors.fg.gray, label: "[ API ]" }],
    ['fetch', { color: colors.fg.gray, label: "[ FETCH ]" }],
    ['rest', { color: colors.fg.gray, label: "[ REST ]" }]
]);

function formatMessage(level, message) {
    const logLevel = logLevels.get(level) || logLevels.get('info');
    const safeMessage = String(message).slice(0, 2000);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const formattedLabel = `${logLevel.color}${logLevel.label}`;
    return `${colors.fg.gray}${timestamp} ${formattedLabel} ${logLevel.color}${safeMessage}${colors.reset}`;
}

function log(level, message) {
    try {
        console.log(formatMessage(level, message));
    } catch {
        console.log(`${new Date().toLocaleTimeString('en-US')} INFO     ${message}`);
    }
}

module.exports = Object.fromEntries([...logLevels.keys()].map(level => [level, log.bind(null, level)]));