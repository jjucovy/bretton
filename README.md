# Bretton Woods Multiplayer - Server Version

**TRUE multiplayer with server-side state storage!** 🎮🌐

## 🌟 Key Features

✅ **Real Server** - Game state stored on server, not browser  
✅ **True Multiplayer** - Students connect from different computers  
✅ **Auto-Sync** - Updates in real-time via WebSockets  
✅ **Persistent State** - Game state saved to file  
✅ **No Manual Refresh** - Changes appear instantly  
✅ **Connection Status** - See if connected to server  
✅ **Robust** - Handles disconnects gracefully  

## 📁 File Structure

```
bretton-woods-server/
├── server.js           # Node.js server with Socket.io
├── index.html          # Client interface
├── styles.css          # Styling
├── game-data.json      # Countries, issues, economic data
├── game-state.json     # Current game state (auto-generated)
├── package.json        # Node dependencies
└── README.md           # This file
```

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Node.js
If you don't have Node.js installed:
- Download from: https://nodejs.org/
- Install the LTS version (recommended)
- Verify: Open terminal and type `node --version`

### Step 2: Install Dependencies
```bash
cd bretton-woods-server
npm install
```

This installs:
- `express` - Web server
- `socket.io` - Real-time communication

### Step 3: Start the Server
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║   Bretton Woods Multiplayer Server                   ║
║   Server running on http://localhost:65002          ║
║                                                       ║
║   Students can connect by opening:                   ║
║   http://[YOUR-IP]:65002                            ║
║                                                       ║
║   Press Ctrl+C to stop                               ║
╚═══════════════════════════════════════════════════════╝
```

### Step 4: Find Your IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active connection (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" under your active connection (e.g., 192.168.1.100)

### Step 5: Students Connect
Students open their browsers and go to:
```
http://[YOUR-IP]:65002
```
Example: `http://192.168.1.100:65002`

That's it! Everyone is now connected to the same game server! 🎉

## 🎮 How to Play

### Teacher Setup:
1. Start server on teacher computer
2. Share IP address with students
3. Monitor game progress (teacher can also play)

### Student Steps:
1. Open browser to `http://[TEACHER-IP]:65002`
2. Wait for green "🟢 Connected" indicator
3. Select a country
4. Click "Mark Ready"
5. Start playing!

## 💾 Server Features

### Persistent State
- Game state automatically saves to `game-state.json`
- If server restarts, game resumes where it left off
- Delete `game-state.json` to start completely fresh

### Real-Time Updates
- All players see changes instantly
- No need to refresh
- Uses WebSocket technology
- < 100ms latency

### Disconnect Handling
- Players who disconnect are removed
- Reconnecting players can rejoin
- Game continues with remaining players

## 🔧 Advanced Options

### Change Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;  // Change 3000 to your port
```

Or set environment variable:
```bash
PORT=8080 npm start
```

### Development Mode (Auto-Reload)
```bash
npm run dev
```
Server automatically restarts when you edit files

### View Game State
```bash
cat game-state.json
```
See current game state in JSON format

### Reset Game Manually
Delete the state file:
```bash
rm game-state.json
```
Or use the in-game "Reset" button

## 🌐 Network Setup

### Same Room (LAN):
- All devices on same WiFi
- Use local IP (192.168.x.x)
- No firewall configuration needed usually

### Different Locations (Internet):
You'll need:
1. **Port forwarding** on router (port 65002)
2. **Your public IP** (google "what is my ip")
3. **Dynamic DNS** (optional, for changing IPs)

**Security Note:** Only expose to internet if needed. Use strong network security.

### Firewall Issues:
**Windows:**
```
Windows Defender Firewall → Allow an app → Add Node.js
```

**Mac:**
```
System Preferences → Security & Privacy → Firewall → Firewall Options → Add node
```

## 🐛 Troubleshooting

### "Cannot connect to server"
- ✅ Is server running? (Check terminal)
- ✅ Correct IP address?
- ✅ Same network?
- ✅ Firewall blocking port 65002?

### "🔴 Disconnected" indicator
- ✅ Server crashed? Check terminal
- ✅ Network issue?
- ✅ Try refreshing page

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::65002
```
**Solution:** Change port or kill process:
```bash
# Find process using port 65002
lsof -i :65002  # Mac/Linux
netstat -ano | findstr :65002  # Windows

# Kill it and restart
```

### Game state corrupted
Delete state file and restart:
```bash
rm game-state.json
npm start
```

## 📊 Monitoring

### Server Console Shows:
- Player connections/disconnections
- Country selections
- Votes cast
- Round advances
- Game resets

### Example Output:
```
Client connected: abc123
Player player_xyz joined as USA
Player player_xyz voted for option a on issue 1
All players ready, advancing to round 2
Game reset
```

## 🎓 Educational Benefits

### vs. localStorage version:
| Feature | localStorage | Server |
|---------|-------------|--------|
| True multiplayer | ❌ Same computer only | ✅ Different computers |
| State reliability | ❌ Browser dependent | ✅ Server storage |
| Real-time sync | ⚠️ Polling (1s delay) | ✅ WebSocket (instant) |
| Disconnect handling | ❌ State lost | ✅ Graceful |
| Monitoring | ❌ None | ✅ Server logs |

### Teaching Opportunities:
- Demonstrate client-server architecture
- Show real-time communication (WebSockets)
- Discuss network protocols
- Explain state management
- Introduce backend development

## 🔐 Security Notes

### For Classroom Use:
- ✅ Local network only (safe)
- ✅ No sensitive data transmitted
- ✅ No user authentication (game only)

### For Public Deployment:
- Add HTTPS (use Let's Encrypt)
- Add authentication
- Add rate limiting
- Use environment variables for config
- Deploy to cloud (Heroku, Railway, etc.)

## 📦 Deployment

### Deploy to Cloud (Optional):

**Heroku:**
```bash
# Install Heroku CLI
heroku create bretton-woods-game
git push heroku main
```

**Railway:**
1. Connect GitHub repo
2. Deploy automatically
3. Get public URL

**Render:**
1. New Web Service
2. Connect repo
3. Build: `npm install`
4. Start: `npm start`

## 🛠️ Customization

### Add More Countries:
Edit `game-data.json`:
```json
"Brazil": {
  "name": "Brazil",
  "color": "bg-teal-600",
  ...
}
```

### Add More Issues:
Edit `game-data.json` → `issues` array

### Change Scoring:
Edit `server.js` → `calculateScoresAndAdvance()` function

### Modify UI:
Edit `index.html` and `styles.css`

## 📚 Technical Stack

- **Backend:** Node.js + Express + Socket.io
- **Frontend:** React + Babel (in-browser JSX)
- **Storage:** JSON file (file system)
- **Communication:** WebSocket
- **Styling:** CSS3

## 🎯 Comparison with Browser Version

| Aspect | Browser (localStorage) | Server Version |
|--------|----------------------|----------------|
| Setup | Easy (just open HTML) | Moderate (install Node) |
| Multiplayer | Same computer/network | Any computer |
| Reliability | Medium | High |
| State persistence | Browser only | Server file |
| Real-time | Polling | WebSocket |
| Best for | Quick demo, testing | Actual classroom use |

## 💡 Pro Tips

1. **Test first**: Run server on your computer, open multiple browser tabs
2. **Share screen**: Project teacher view on screen during game
3. **Backup state**: Copy `game-state.json` to save interesting games
4. **Monitor console**: Watch server terminal for player activity
5. **Use dev mode**: `npm run dev` for development/customization

## 📞 Support

Having issues? Check:
1. Node.js version: `node --version` (should be 14+)
2. Server running: Check terminal for errors
3. Network: All devices on same WiFi
4. Firewall: Allow Node.js through firewall
5. Browser: Use Chrome, Firefox, or Edge (not IE)

## 🎉 You're Ready!

Start the server and enjoy true multiplayer Bretton Woods simulation!

```bash
npm start
```

Happy negotiating! 🌍💼
