# Bretton Woods Server - Quick Start

## 🚀 5-Minute Setup

### 1. Install Node.js (if needed)
Download from: https://nodejs.org/
(Choose LTS version)

### 2. Extract Files
Unzip `bretton-woods-SERVER.zip` to a folder

### 3. Install Dependencies
Open terminal/command prompt in the folder:
```bash
npm install
```

### 4. Start Server
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

### 5. Find Your IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" (e.g., 192.168.1.100)

### 6. Students Connect
Students open browsers to:
```
http://YOUR-IP:65002
```

Example: `http://192.168.1.100:65002`

## ✅ That's It!

Everyone should see:
- 🟢 "Connected" indicator (top right)
- Game lobby with country selection
- Real-time player updates

## 🐛 Troubleshooting

### "Port 65002 already in use"
Another program is using this port. Either:
- Stop that program
- Or edit `server.js` and change `65002` to another number (like `65003`)

### Can't connect from other computers
- ✅ Check firewall settings
- ✅ Make sure all computers on same network
- ✅ Server is running (check terminal)
- ✅ Using correct IP address

### "Cannot find module"
Run `npm install` again in the server folder

## 📚 Full Documentation
See `README.md` for complete guide

## 🎮 Ready to Play!
Start server and enjoy true multiplayer! 🌍
