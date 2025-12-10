#!/usr/bin/env node
// view-saved-data.js - View current saved game state

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'game-state.json');

console.log('🔍 Bretton Woods - Saved Data Viewer\n');
console.log('=' .repeat(50));

if (!fs.existsSync(STATE_FILE)) {
  console.log('\n❌ No saved data file found!');
  console.log(`   Looking for: ${STATE_FILE}`);
  console.log('\n💡 This is normal if:');
  console.log('   - Server has never been started');
  console.log('   - No users have registered');
  console.log('   - Data file was deleted');
  process.exit(0);
}

try {
  const data = fs.readFileSync(STATE_FILE, 'utf8');
  const gameState = JSON.parse(data);
  
  console.log('\n✅ Data file found!');
  console.log(`   Location: ${STATE_FILE}`);
  console.log(`   Size: ${(fs.statSync(STATE_FILE).size / 1024).toFixed(2)} KB`);
  
  console.log('\n📊 SAVED DATA SUMMARY:');
  console.log('=' .repeat(50));
  
  // Users
  const userCount = Object.keys(gameState.users || {}).length;
  console.log(`\n👥 Registered Users: ${userCount}`);
  if (userCount > 0) {
    console.log('   Usernames:');
    Object.keys(gameState.users).forEach(username => {
      const user = gameState.users[username];
      const joinedDate = new Date(user.createdAt).toLocaleDateString();
      console.log(`   - ${username} (joined ${joinedDate})`);
    });
  }
  
  // Active Players
  const playerCount = Object.keys(gameState.players || {}).length;
  console.log(`\n🎮 Active Players: ${playerCount}`);
  if (playerCount > 0) {
    console.log('   In game:');
    Object.values(gameState.players).forEach(player => {
      console.log(`   - ${player.country}`);
    });
  }
  
  // Game State
  console.log(`\n🎯 Game Status:`);
  console.log(`   - Phase: ${gameState.gamePhase || 'lobby'}`);
  console.log(`   - Started: ${gameState.gameStarted ? 'Yes' : 'No'}`);
  if (gameState.gamePhase === 'voting') {
    console.log(`   - Current Round: ${gameState.currentRound}`);
  } else if (gameState.gamePhase === 'phase2') {
    console.log(`   - Current Year: ${gameState.phase2?.currentYear || 'N/A'}`);
  }
  
  // Scores
  console.log(`\n📈 Current Scores:`);
  const scores = gameState.scores || {};
  Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, score]) => {
      if (score > 0) {
        console.log(`   - ${country}: ${score} points`);
      }
    });
  
  // File timestamps
  const stats = fs.statSync(STATE_FILE);
  console.log(`\n⏰ Last Modified: ${stats.mtime.toLocaleString()}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Data is being saved and persisted correctly!\n');
  
} catch (err) {
  console.error('\n❌ Error reading data file:', err.message);
  console.log('\n💡 The file may be corrupted. Consider:');
  console.log('   - Restoring from backup (game-state-backup.json)');
  console.log('   - Deleting the file to start fresh');
}
