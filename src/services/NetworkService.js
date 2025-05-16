
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
        const NetworkManagerModule = await import('../multiplayer/NetworkManager.js');
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
    
    disconnect() {
        if (this.networkManager && this.networkManager.socket) {
            console.log('NetworkService: Forcing disconnection');
            
            // Clear all listeners before disconnecting
            if (this.networkManager.eventListeners) {
                for (const event in this.networkManager.eventListeners) {
                    console.log(`Removing all listeners for ${event}`);
                    this.networkManager.eventListeners[event] = [];
                }
            }
            
            // Set transitioning flag to skip new events during disconnect
            this.networkManager.isTransitioning = true;
            
            // Disconnect
            this.networkManager.disconnect();
            this.initialized = false;
            this.networkManager = null;
            
            console.log('NetworkService: Completed full cleanup');
        }
    }
}

// Create and export a singleton instance meaning using the same NetworkManager across scenes
export default new NetworkService();