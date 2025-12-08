// server.js - Bretton Woods Multiplayer Server
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 65002;
const STATE_FILE = path.join(__dirname, 'game-state.json');

// Serve static files
app.use(express.static(__dirname));

// Game state stored on server
let gameState = {
  gameId: Date.now(),
  gameStarted: false,
  currentRound: 0,
  players: {},
  votes: {},
  readyPlayers: [],
  gamePhase: 'lobby',
  scores: { USA: 0, UK: 0, USSR: 0, France: 0, China: 0 },
  roundHistory: []
};

// Load game state from file if it exists
function loadGameState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      gameState = JSON.parse(data);
      console.log('Game state loaded from file');
    }
  } catch (err) {
    console.error('Error loading game state:', err);
  }
}

// Save game state to file
function saveGameState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(gameState, null, 2));
    console.log('Game state saved to file');
  } catch (err) {
    console.error('Error saving game state:', err);
  }
}

// Load state on startup
loadGameState();

// Broadcast state to all connected clients
function broadcastState() {
  io.emit('stateUpdate', gameState);
  saveGameState();
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send current state to newly connected client
  socket.emit('stateUpdate', gameState);
  
  // Join game
  socket.on('joinGame', ({ playerId, country }) => {
    // Check if country is already taken
    const taken = Object.values(gameState.players).some(p => p.country === country);
    
    if (taken) {
      socket.emit('joinResult', { success: false, message: 'Country already taken' });
    } else {
      gameState.players[playerId] = {
        id: playerId,
        country: country,
        socketId: socket.id,
        joinedAt: Date.now()
      };
      socket.emit('joinResult', { success: true });
      broadcastState();
      console.log(`Player ${playerId} joined as ${country}`);
    }
  });
  
  // Leave game
  socket.on('leaveGame', ({ playerId }) => {
    delete gameState.players[playerId];
    gameState.readyPlayers = gameState.readyPlayers.filter(id => id !== playerId);
    broadcastState();
    console.log(`Player ${playerId} left game`);
  });
  
  // Set player ready status
  socket.on('setReady', ({ playerId, ready }) => {
    if (ready) {
      if (!gameState.readyPlayers.includes(playerId)) {
        gameState.readyPlayers.push(playerId);
      }
    } else {
      gameState.readyPlayers = gameState.readyPlayers.filter(id => id !== playerId);
    }
    broadcastState();
    console.log(`Player ${playerId} ready: ${ready}`);
  });
  
  // Start game
  socket.on('startGame', () => {
    const playerCount = Object.keys(gameState.players).length;
    const readyCount = gameState.readyPlayers.length;
    
    if (playerCount > 0 && readyCount === playerCount) {
      gameState.gameStarted = true;
      gameState.currentRound = 1;
      gameState.gamePhase = 'voting';
      gameState.readyPlayers = [];
      broadcastState();
      console.log('Game started');
    }
  });
  
  // Submit vote
  socket.on('submitVote', ({ playerId, issueId, optionId }) => {
    const player = gameState.players[playerId];
    if (player) {
      const voteKey = `${issueId}-${player.country}`;
      gameState.votes[voteKey] = optionId;
      broadcastState();
      console.log(`Player ${playerId} voted for option ${optionId} on issue ${issueId}`);
    }
  });
  
  // Advance to next round
  socket.on('nextRound', () => {
    const playerCount = Object.keys(gameState.players).length;
    const readyCount = gameState.readyPlayers.length;
    
    if (playerCount > 0 && readyCount === playerCount) {
      calculateScoresAndAdvance();
      broadcastState();
      console.log(`Advanced to round ${gameState.currentRound}`);
    }
  });
  
  // Reset game
  socket.on('resetGame', () => {
    gameState = {
      gameId: Date.now(),
      gameStarted: false,
      currentRound: 0,
      players: {},
      votes: {},
      readyPlayers: [],
      gamePhase: 'lobby',
      scores: { USA: 0, UK: 0, USSR: 0, France: 0, China: 0 },
      roundHistory: []
    };
    broadcastState();
    console.log('Game reset');
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    // Find and remove player by socket ID
    const playerId = Object.keys(gameState.players).find(
      id => gameState.players[id].socketId === socket.id
    );
    
    if (playerId) {
      delete gameState.players[playerId];
      gameState.readyPlayers = gameState.readyPlayers.filter(id => id !== playerId);
      broadcastState();
      console.log(`Player ${playerId} disconnected`);
    }
    
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Calculate scores and advance round
function calculateScoresAndAdvance() {
  const issues = require('./game-data.json').issues;
  const currentIssue = issues[gameState.currentRound - 1];
  
  if (currentIssue) {
    // Count votes for each option
    const voteCounts = {};
    currentIssue.options.forEach(opt => voteCounts[opt.id] = 0);
    
    Object.keys(gameState.players).forEach(playerId => {
      const player = gameState.players[playerId];
      const voteKey = `${currentIssue.id}-${player.country}`;
      const votedOptionId = gameState.votes[voteKey];
      if (votedOptionId) {
        voteCounts[votedOptionId] = (voteCounts[votedOptionId] || 0) + 1;
      }
    });
    
    // Find winning option
    let winningOptionId = null;
    let maxVotes = -1;
    Object.entries(voteCounts).forEach(([optId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningOptionId = optId;
      }
    });
    
    // Award points based on winning option
    if (winningOptionId) {
      const winningOption = currentIssue.options.find(opt => opt.id === winningOptionId);
      if (winningOption) {
        Object.keys(gameState.players).forEach(playerId => {
          const player = gameState.players[playerId];
          
          if (winningOption.favors.includes(player.country)) {
            gameState.scores[player.country] += 10;
          }
          
          if (winningOption.opposes.includes(player.country)) {
            gameState.scores[player.country] -= 5;
          }
        });
        
        // Store round result
        gameState.roundHistory.push({
          round: gameState.currentRound,
          issue: currentIssue.title,
          winningOption: winningOption.text,
          votes: voteCounts
        });
      }
    }
  }
  
  // Advance round or end game
  if (gameState.currentRound < issues.length) {
    gameState.currentRound += 1;
    gameState.readyPlayers = [];
    gameState.gamePhase = 'voting';
  } else {
    gameState.gamePhase = 'complete';
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   Bretton Woods Multiplayer Server                   ║
║   Server running on http://localhost:65002          ║
║                                                       ║
║   Students can connect by opening:                   ║
║   http://[YOUR-IP]:65002                            ║
║                                                       ║
║   Press Ctrl+C to stop                               ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nSaving game state and shutting down...');
  saveGameState();
  process.exit(0);
});
