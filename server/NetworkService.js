
class NetworkService {
    constructor() {
        this.networkManager = null;
        this.initialized = false;
    }

    getNetworkManager() {
        return this.networkManager;
    }

    async initialize() {
    if (this.initialized) return Promise.resolve(this.networkManager);

    try {
        // Dynamic import (works in modern browsers)
        const NetworkManagerModule = await import('../src/multiplayer/NetworkManager.js');
        const NetworkManager = NetworkManagerModule.default;

        this.networkManager = new NetworkManager();

        // Connect and mark as initialized
        const data = await this.networkManager.connect();
        this.initialized = true;
        console.log('NetworkService initialized with ID:', data.id);
        return this.networkManager;
    } catch (error) {
        console.error('Failed to initialize NetworkService:', error);
        throw error;
    }
    }
}

// Create and export a singleton instance meaning using the same NetworkManager across scenes
export default new NetworkService();