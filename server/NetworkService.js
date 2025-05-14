// client side Socket.IO code
class NetworkService {
  constructor() {
        this.networkManager = null;
        this.initialized = false;
    }

    getNetworkManager() {
        return this.networkManager;
    }
  
    initialize() {
        if (this.initialized) return Promise.resolve(this.networkManager);
        
        // Create new NetworkManager if one doesn't exist
        const NetworkManager = require('../multiplayer/NetworkManager.js').default;
        this.networkManager = new NetworkManager();
        
        // Connect and mark as initialized
        return this.networkManager.connect()
            .then(data => {
                this.initialized = true;
                console.log('NetworkService initialized with ID:', data.id);
                return this.networkManager;
            });
    }
}

// Create and export a singleton instance meaning using the same NetworkManager across scenes
export default new NetworkService();