# Bretton Woods Conference Simulation - Database Version

A multiplayer educational simulation of the 1944 Bretton Woods Conference, now with MySQL database backend for persistent game state.

## Features

- **User Authentication**: Login/register system for students and teachers
- **Persistent Game State**: All game data stored in MySQL database
- **Real-time Updates**: Automatic polling for game state changes
- **Multiplayer Lobby**: Join games with simple 6-character codes
- **5 Playable Nations**: USA, UK, USSR, France, China
- **6 Historical Issues**: Negotiate the post-war economic order
- **Score Tracking**: Points based on national interests
- **Game Management**: Host controls, ready system, game reset

## Requirements

- Node.js (v14 or higher)
- MySQL 5.7+ or MariaDB 10.3+
- Web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Database Setup

First, import the database schema:

```bash
mysql -h 86.38.202.154 -u u585377912_keynes -p u585377912_bretton < bretton_woods_schema.sql
```

**IMPORTANT**: Change the database password in both:
- The database itself (ALTER USER command)
- `server.js` (line 19)

### 2. Backend Setup

Install dependencies:

```bash
cd bretton-woods-server
npm install
```

Dependencies include:
- express (web server)
- mysql2 (database driver)
- cors (cross-origin requests)
- bcrypt (password hashing)
- express-session (session management)
- express-mysql-session (session storage)

Start the server:

```bash
npm start
```

Server will run on `http://localhost:3000`

For development with auto-restart:

```bash
npm run dev
```

### 3. Frontend Setup

The React component can be integrated into your existing React app, or you can use the standalone HTML file included.

For standalone use:

1. Open `index.html` in a web browser
2. Make sure the backend server is running
3. You may need to serve the HTML file through a local server (like `python -m http.server`) if you encounter CORS issues

## Configuration

### Backend Configuration (server.js)

```javascript
// Database connection (line 18-26)
const pool = mysql.createPool({
    host: 'YOUR_HOST',
    user: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD',  // CHANGE THIS!
    database: 'YOUR_DATABASE',
    // ... other settings
});

// Server port (line 11)
const PORT = process.env.PORT || 3000;
```

### Frontend Configuration (BrettonWoodsGame.jsx)

```javascript
// API endpoint (line 5)
const API_BASE_URL = 'http://localhost:3000/api';
```

If deploying to production, update this to your server's URL.

## Usage

### For Teachers

1. **Create Account**: Register with `isTeacher` flag set to true
2. **Create Game**: Click "Create New Game" to generate a game code
3. **Share Code**: Give the 6-character code to students
4. **Wait for Players**: Students join and select countries
5. **Start Game**: Once all players are ready, click "Start Conference"
6. **Monitor Progress**: Watch as students negotiate
7. **Review Results**: See final scores and who succeeded
8. **Play Again**: Reset the game to play with different strategies

### For Students

1. **Create Account**: Register as a student
2. **Join Game**: Enter the game code provided by teacher
3. **Select Country**: Choose from available nations
4. **Mark Ready**: Indicate you're ready to start
5. **Vote on Issues**: For each issue, support or oppose the options
   - Green border = Favors your country (+10 if it wins)
   - Red border = Opposes your country (-5 if it wins)
6. **Watch Scores**: See how your decisions affect your standing
7. **See Results**: Review final rankings and outcomes

## Game Flow

### Phase 1: The Conference (6 Rounds)

Each round presents one historical issue from Bretton Woods:

1. **Exchange Rate System**: How should currencies be valued?
2. **International Monetary Fund**: What powers should the IMF have?
3. **World Bank Structure**: Who controls reconstruction financing?
4. **Capital Controls**: Should countries restrict capital flows?
5. **Soviet Participation**: How much should USSR be included?
6. **Sterling Area**: What happens to Britain's currency bloc?

For each issue:
- Players see 3 options (A, B, C)
- Options favor some countries and oppose others
- Players vote support or oppose
- Winning option (most support votes) determines scoring
- Favored countries get +10 points
- Opposed countries lose -5 points

### Phase 2: Economic Management (Future Enhancement)

Currently displays final results. Future versions may include:
- Post-war economic simulation
- Policy implementation
- Crisis management
- Additional scoring based on economic performance

## Database Structure

### Key Tables

- `users`: Student and teacher accounts
- `countries`: The 5 Bretton Woods powers with economic data
- `issues`: The 6 conference topics
- `issue_options`: 3 voting choices per issue
- `games`: Individual game sessions
- `players`: Links users to countries in specific games
- `votes`: Individual player votes
- `game_results`: Final scores and statistics

### Stored Procedures

- `sp_create_game`: Creates new game with unique code
- `sp_join_game`: Adds player to game with validation
- `sp_calculate_round_scores`: Awards points based on vote results

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check current session

### Game Management
- `POST /api/games/create` - Create new game
- `POST /api/games/join` - Join existing game
- `GET /api/games/:gameCode/lobby` - Get lobby info
- `POST /api/games/:gameCode/ready` - Mark player ready
- `POST /api/games/:gameCode/start` - Start game
- `GET /api/games/:gameCode/state` - Get current game state
- `POST /api/games/:gameCode/vote` - Submit vote
- `POST /api/games/:gameCode/next-round` - Advance to next round
- `GET /api/games/:gameCode/results` - Get final results
- `POST /api/games/:gameCode/reset` - Reset game

### Utilities
- `GET /api/countries` - Get all countries
- `GET /api/issues` - Get all issues
- `GET /api/health` - Health check

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Verify database credentials in `server.js`
- Check that MySQL server is running
- Confirm database exists and schema is imported
- Test connection: `mysql -h HOST -u USER -p DATABASE`

**"Game not found"**
- Check that game code is correct (case-sensitive)
- Verify game wasn't deleted
- Try creating a new game

**"Not all players are ready"**
- Each player must click "Mark Ready" before host can start
- Check lobby to see who hasn't marked ready

**"Failed to submit vote"**
- Ensure you're still connected to the server
- Check that it's your turn to vote
- Verify game hasn't ended

**CORS errors**
- Make sure backend server is running
- Check that `API_BASE_URL` in frontend matches server address
- Verify CORS is enabled in `server.js`

### Database Issues

**Reset a stuck game:**
```sql
UPDATE games SET game_status = 'lobby', current_round = 0 WHERE game_code = 'ABC123';
DELETE FROM votes WHERE game_issue_id IN (SELECT game_issue_id FROM game_issues WHERE game_id = X);
```

**View active games:**
```sql
SELECT * FROM vw_game_lobby WHERE game_status != 'completed';
```

**See player standings:**
```sql
SELECT * FROM vw_player_standings WHERE game_id = X;
```

## Security Notes

**Before deploying to production:**

1. **Change database password** (currently exposed in code)
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** for secure connections
4. **Implement rate limiting** to prevent abuse
5. **Add CSRF protection**
6. **Validate all user inputs** server-side
7. **Use strong session secrets**
8. **Set secure cookie options**

Example .env file:
```
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
SESSION_SECRET=your_random_secret_key
PORT=3000
```

## Educational Value

### Learning Objectives

Students will:
- Understand competing national interests at Bretton Woods
- Learn about post-WWII economic institutions (IMF, World Bank)
- Practice negotiation and strategic decision-making
- Experience how international agreements form through compromise
- Analyze historical economic policies and their effects

### Discussion Questions

- Why did the US dominate the real conference?
- How did countries' economic positions influence their objectives?
- What trade-offs did nations face between sovereignty and stability?
- How do the Bretton Woods institutions affect the world today?
- What would have happened if different options had won?

### Extensions

- Research your nation's actual position at Bretton Woods
- Compare simulation outcomes to historical results
- Debate: Was the Bretton Woods system fair?
- Analyze: How did the system eventually collapse (1971)?
- Connect: How does this relate to modern economic issues?

## Credits

Based on the historical Bretton Woods Conference of July 1944.

Educational simulation designed for college-level courses in:
- Economic History
- International Relations
- Political Economy
- American History
- World History

## License

MIT License - Feel free to use and modify for educational purposes.

## Support

For questions or issues:
1. Check this README
2. Review the code comments
3. Check database schema documentation
4. Test with sample data provided

## Version History

**v2.0 (Current)** - Database-backed version
- MySQL database for persistent state
- User authentication system
- Real-time game updates
- Multi-game support
- Session management

**v1.0** - Original React-only version
- Single-game simulation
- Local state management
- No persistence

## Future Enhancements

- [ ] Phase 2: Economic management gameplay
- [ ] Teacher dashboard to monitor all games
- [ ] Detailed analytics and reports
- [ ] Historical accuracy mode with actual outcomes
- [ ] Chat/negotiation features
- [ ] Mobile app version
- [ ] Additional historical scenarios
- [ ] AI opponents for solo practice
