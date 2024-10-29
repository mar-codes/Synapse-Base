const logs = require('../Logger');

class TimedCache extends Map {
    constructor(defaultTTL = 60000) {
        super();
        this.ttls = new Map();
        this.defaultTTL = defaultTTL;
    }

    set(key, value, ttl = this.defaultTTL) {
        super.set(key, value);
        const expiry = Date.now() + ttl;
        this.ttls.set(key, expiry);
        setTimeout(() => {
            const clearedValue = super.get(key);
            if (clearedValue !== undefined) {
                logs.cache(`Cleared key "${key}" with value: ${clearedValue}`);
                this.delete(key);
            }
        }, ttl);
        return this;
    }

    get(key) {
        if (!this.has(key)) return null;
        const expiry = this.ttls.get(key);
        if (expiry < Date.now()) {
            const clearedValue = super.get(key);
            if (clearedValue !== undefined) {
                logs.cache(`Cleared expired key "${key}" with value: ${clearedValue}`);
                this.delete(key);
            }
            return null;
        }
        return super.get(key);
    }

    delete(key) {
        this.ttls.delete(key);
        return super.delete(key);
    }

    clear() {
        this.ttls.clear();
        return super.clear();
    }
}

class LRUCache extends Map {
    constructor(maxSize = 1000) {
        super();
        this.maxSize = maxSize;
    }

    set(key, value) {
        if (this.has(key)) {
            this.delete(key);
        } else if (this.size >= this.maxSize) {
            this.delete(this.first());
        }
        super.set(key, value);
        return this;
    }

    get(key) {
        if (!this.has(key)) return null;
        const value = super.get(key);
        this.delete(key);
        super.set(key, value);
        return value;
    }

    first() {
        return this.keys().next().value;
    }
}

class ExpiryMap extends Map {
    constructor() {
        super();
        this.timeouts = new Map();
    }

    set(key, value, expiry = null) {
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }

        if (expiry instanceof Date || typeof expiry === 'number') {
            const timeout = setTimeout(() => this.delete(key), 
                expiry instanceof Date ? expiry.getTime() - Date.now() : expiry);
            this.timeouts.set(key, timeout);
        }

        return super.set(key, value);
    }

    delete(key) {
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
        return super.delete(key);
    }

    clear() {
        this.timeouts.forEach(clearTimeout);
        this.timeouts.clear();
        return super.clear();
    }
}

module.exports = { TimedCache, LRUCache, ExpiryMap };