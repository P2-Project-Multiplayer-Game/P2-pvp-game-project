// lobby management for multiplayer matches
class LobbyManager {
  constructor() {
    // only has the default main room for now 
    this.defaultRoom = 'main';
    this.lobbies = new Map(); // Map of roomId -> lobby data
    
    // Create default lobby
    this.lobbies.set(this.defaultRoom, {
      players: new Map(), // Map of playerId -> player data with ready state
      isGameStarted: false,
      minPlayers: 1, // Minimum players required
      maxPlayers: 6  // Maximum players allowed
    });
  }
  
  // Get default room
  getDefaultRoom() {
    return this.defaultRoom;
  }
  
  // Add player to lobby with ready state
  addPlayer(roomId, playerId, playerData) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby) return false;
    
    // Check if lobby is already full
    if (lobby.players.size >= lobby.maxPlayers) {
      return false;
    }
    
    // Add player to lobby with initial ready state as false
    lobby.players.set(playerId, {
      ...playerData,
      isReady: false
    });
    
    return true;
  }
  
  // Remove player from lobby
  removePlayer(roomId, playerId) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby) return false;
    
    return lobby.players.delete(playerId);
  }
  
  // Set player ready state
  setPlayerReady(roomId, playerId, isReady) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby || !lobby.players.has(playerId)) return false;
    
    const player = lobby.players.get(playerId);
    player.isReady = isReady;
    lobby.players.set(playerId, player);
    
    return true;
  }
  
  // Check if all players are ready
  areAllPlayersReady(roomId) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby) return false;
    
    // Must have minimum number of players
    if (lobby.players.size < lobby.minPlayers) return false;
    
    // All players must be ready
    for (const player of lobby.players.values()) {
      if (!player.isReady) return false;
    }
    
    return true;
  }
  
  // Get players in a lobby
  getPlayersInLobby(roomId) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby) return [];
    
    return Array.from(lobby.players.values());
  }
  
  // Get lobby status
  getLobbyStatus(roomId) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby) return null;
    
    const playersReady = Array.from(lobby.players.values()).filter(p => p.isReady).length;
    
    return {
      totalPlayers: lobby.players.size,
      playersReady: playersReady,
      isGameStarted: lobby.isGameStarted,
      minPlayers: lobby.minPlayers,
      maxPlayers: lobby.maxPlayers
    };
  }
  
  // Set game started status for a lobby
  setGameStarted(roomId, isStarted) {
    const lobby = this.lobbies.get(roomId);
    if (!lobby) return false;
    
    lobby.isGameStarted = isStarted;
    return true;
  }
}

module.exports = LobbyManager;