import 'dotenv/config';
import { gameDataService } from '../server/game-data-service.js';

async function checkDangerLevels() {
  console.log('🔍 Checking danger levels for all locations...\n');

  try {
    const locations = await gameDataService.getAllLocations();
    
    console.log('📍 All locations:');
    console.log('─'.repeat(80));
    
    locations.forEach(loc => {
      const dangerIcon = 
        !loc.dangerLevel ? '✅' :
        loc.dangerLevel >= 70 ? '🔴' :
        loc.dangerLevel >= 40 ? '🟠' :
        loc.dangerLevel >= 20 ? '🟡' :
        '🟢';
      
      const dangerText = loc.dangerLevel !== undefined 
        ? `${loc.dangerLevel}%`.padEnd(5) 
        : 'SAFE '.padEnd(5);
      
      console.log(
        `${dangerIcon} ${dangerText} | ${loc.id.padEnd(25)} | ${loc.name.padEnd(30)} | ${loc.type}`
      );
    });
    
    console.log('─'.repeat(80));
    
    const outskirtsLocations = locations.filter(loc => loc.type === 'outskirts');
    console.log(`\n✨ Found ${outskirtsLocations.length} outskirts locations with danger levels`);
    
    const avgDanger = outskirtsLocations.reduce((sum, loc) => sum + (loc.dangerLevel || 0), 0) / outskirtsLocations.length;
    console.log(`📊 Average danger level: ${avgDanger.toFixed(1)}%\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDangerLevels();

