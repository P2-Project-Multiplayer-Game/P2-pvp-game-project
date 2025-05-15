const fs = require('fs');
const path = require('path');

class CharacterLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'character_logs');
    this.ensureLogDirectoryExists();
  }

  ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      console.log(`Created character logs directory: ${this.logsDir}`);
    }
  }

  // Log a complete match after game over
  logMatch(matchData) {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `match_${timestamp}.csv`;
      const filepath = path.join(this.logsDir, filename);
      
      // Generate CSV content
      let csvContent = this.generateMatchCSV(matchData);
      
      // Write to file
      fs.writeFileSync(filepath, csvContent);
      console.log(`Match log saved to ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error logging match:', error);
    }
  }

  generateMatchCSV(matchData) {
    const { rankings, matchDuration } = matchData;
    
    // Format duration as minutes:seconds
    const durationMinutes = Math.floor(matchDuration / 60000);
    const durationSeconds = Math.floor((matchDuration % 60000) / 1000);
    const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
    
    // Start with match summary header
    let csv = 'MATCH SUMMARY\n';
    csv += `Date,${new Date().toISOString()}\n`;
    csv += `Duration,${formattedDuration}\n\n`;
    
    // Add player rankings
    csv += 'CHARACTER RANKINGS\n';
    csv += 'Rank,Character,Damage Dealt,Kills\n';
    
    // Sort by rank and add each character's stats
    rankings.sort((a, b) => a.rank - b.rank).forEach(player => {
      const kills = player.kills ? player.kills.length : 0;
      csv += `${player.rank},${player.characterType},${player.damageDealt || 0},${kills}\n`;
    });
    
    // Add kills breakdown section
    csv += '\nKILL BREAKDOWN\n';
    csv += 'Killer Character,Victim Character,Count\n';
    
    // Create a map to count kills by character type
    const killMap = new Map();
    
    // Process all kills
    rankings.forEach(player => {
      if (!player.kills || player.kills.length === 0) return;
      
      player.kills.forEach(kill => {
        const killerType = player.characterType;
        const victimType = kill.victimType;
        const key = `${killerType},${victimType}`;
        
        if (killMap.has(key)) {
          killMap.set(key, killMap.get(key) + 1);
        } else {
          killMap.set(key, 1);
        }
      });
    });
    
    // Add kill counts to CSV
    killMap.forEach((count, key) => {
      csv += `${key},${count}\n`;
    });
    
    // Add a totals line
    csv += '\nTOTAL DAMAGE BY CHARACTER\n';
    csv += 'Character,Total Damage\n';
    
    // Calculate damage totals by character type
    const damageByType = new Map();
    rankings.forEach(player => {
      const type = player.characterType;
      const damage = player.damageDealt || 0;
      
      if (damageByType.has(type)) {
        damageByType.set(type, damageByType.get(type) + damage);
      } else {
        damageByType.set(type, damage);
      }
    });
    
    // Add damage totals to CSV
    damageByType.forEach((damage, type) => {
      csv += `${type},${damage}\n`;
    });
    
    return csv;
  }
}

module.exports = CharacterLogger;