// Bretton Woods Conference Simulation - Backend Server
// Connects to MySQL database and provides REST API

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: '86.38.202.154',
    user: 'u585377912_keynes',
    password: 'qKb&J8Wu#%',
    database: 'u585377912_bretton',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Session store
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000
}, pool);

// Session middleware
app.use(session({
    key: 'bretton_session',
    secret: 'bretton-woods-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: false // Set to true if using HTTPS
    }
}));

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, displayName, isTeacher } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, display_name, is_teacher) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, displayName || username, isTeacher || false]
        );
        
        req.session.userId = result.insertId;
        req.session.username = username;
        
        res.json({ 
            success: true, 
            userId: result.insertId,
            username: username,
            displayName: displayName || username
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [users] = await pool.execute(
            'SELECT user_id, username, password_hash, display_name, is_teacher FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await pool.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);
        
        req.session.userId = user.user_id;
        req.session.username = user.username;
        
        res.json({
            success: true,
            userId: user.user_id,
            username: user.username,
            displayName: user.display_name,
            isTeacher: user.is_teacher
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check session
app.get('/api/auth/session', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ authenticated: false });
    }
    
    try {
        const [users] = await pool.execute(
            'SELECT user_id, username, display_name, is_teacher FROM users WHERE user_id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.json({ authenticated: false });
        }
        
        res.json({
            authenticated: true,
            user: users[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'Session check failed' });
    }
});

// ============================================================
// GAME MANAGEMENT ROUTES
// ============================================================

// Create new game
app.post('/api/games/create', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        // Call stored procedure to create game
        const [result] = await pool.execute(
            'CALL sp_create_game(?, @game_id, @game_code)',
            [req.session.userId]
        );
        
        const [output] = await pool.execute('SELECT @game_id as gameId, @game_code as gameCode');
        
        res.json({
            success: true,
            gameId: output[0].gameId,
            gameCode: output[0].gameCode
        });
    } catch (error) {
        console.error('Create game error:', error);
        res.status(500).json({ error: 'Failed to create game' });
    }
});

// Join game
app.post('/api/games/join', async (req, res) => {
    const { gameCode, countryCode } = req.body;
    
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        // Call stored procedure to join game
        await pool.execute(
            'CALL sp_join_game(?, ?, ?, @success, @message)',
            [gameCode, req.session.userId, countryCode]
        );
        
        const [output] = await pool.execute('SELECT @success as success, @message as message');
        
        if (output[0].success) {
            res.json({ success: true, message: output[0].message });
        } else {
            res.status(400).json({ success: false, error: output[0].message });
        }
    } catch (error) {
        console.error('Join game error:', error);
        res.status(500).json({ error: 'Failed to join game' });
    }
});

// Get game lobby info
app.get('/api/games/:gameCode/lobby', async (req, res) => {
    const { gameCode } = req.params;
    
    try {
        // Get game info
        const [games] = await pool.execute(
            `SELECT g.game_id, g.game_code, g.game_status, g.current_round, g.created_at,
                    u.username as host_username
             FROM games g
             LEFT JOIN users u ON g.host_user_id = u.user_id
             WHERE g.game_code = ?`,
            [gameCode]
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = games[0];
        
        // Get players in lobby
        const [players] = await pool.execute(
            `SELECT p.player_id, p.user_id, u.username, u.display_name, 
                    c.country_code, c.country_name, c.flag_emoji, p.is_ready
             FROM players p
             JOIN users u ON p.user_id = u.user_id
             JOIN countries c ON p.country_id = c.country_id
             WHERE p.game_id = ?`,
            [game.game_id]
        );
        
        // Get available countries
        const [allCountries] = await pool.execute('SELECT * FROM countries');
        const takenCountries = players.map(p => p.country_code);
        const availableCountries = allCountries.filter(c => !takenCountries.includes(c.country_code));
        
        res.json({
            game: game,
            players: players,
            availableCountries: availableCountries
        });
    } catch (error) {
        console.error('Get lobby error:', error);
        res.status(500).json({ error: 'Failed to get lobby info' });
    }
});

// Mark player ready
app.post('/api/games/:gameCode/ready', async (req, res) => {
    const { gameCode } = req.params;
    
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        // Get game and player
        const [games] = await pool.execute('SELECT game_id FROM games WHERE game_code = ?', [gameCode]);
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const gameId = games[0].game_id;
        
        // Update player ready status
        await pool.execute(
            'UPDATE players SET is_ready = TRUE WHERE game_id = ? AND user_id = ?',
            [gameId, req.session.userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Mark ready error:', error);
        res.status(500).json({ error: 'Failed to mark ready' });
    }
});

// Start game
app.post('/api/games/:gameCode/start', async (req, res) => {
    const { gameCode } = req.params;
    
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const [games] = await pool.execute('SELECT game_id, host_user_id FROM games WHERE game_code = ?', [gameCode]);
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = games[0];
        
        // Check if user is host
        if (game.host_user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Only host can start game' });
        }
        
        // Check if all players are ready
        const [readyCheck] = await pool.execute(
            'SELECT COUNT(*) as total, SUM(is_ready) as ready FROM players WHERE game_id = ?',
            [game.game_id]
        );
        
        if (readyCheck[0].total !== readyCheck[0].ready) {
            return res.status(400).json({ error: 'Not all players are ready' });
        }
        
        // Start game
        await pool.execute(
            'UPDATE games SET game_status = ?, current_round = 1, started_at = CURRENT_TIMESTAMP WHERE game_id = ?',
            ['phase1_active', game.game_id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ error: 'Failed to start game' });
    }
});

// Get current game state
app.get('/api/games/:gameCode/state', async (req, res) => {
    const { gameCode } = req.params;
    
    try {
        // Get game
        const [games] = await pool.execute(
            'SELECT * FROM games WHERE game_code = ?',
            [gameCode]
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = games[0];
        
        // Get players with scores
        const [players] = await pool.execute(
            `SELECT p.player_id, p.user_id, u.username, u.display_name,
                    c.country_code, c.country_name, c.flag_emoji, c.color_hex,
                    p.phase1_score, p.phase2_score, p.total_score
             FROM players p
             JOIN users u ON p.user_id = u.user_id
             JOIN countries c ON p.country_id = c.country_id
             WHERE p.game_id = ?
             ORDER BY p.total_score DESC`,
            [game.game_id]
        );
        
        // Get current round issue if in play
        let currentIssue = null;
        let currentOptions = [];
        let votes = [];
        
        if (game.game_status === 'phase1_active' && game.current_round > 0) {
            const [gameIssues] = await pool.execute(
                `SELECT gi.game_issue_id, gi.issue_id, i.title, i.description, i.historical_context
                 FROM game_issues gi
                 JOIN issues i ON gi.issue_id = i.issue_id
                 WHERE gi.game_id = ? AND gi.round_number = ?`,
                [game.game_id, game.current_round]
            );
            
            if (gameIssues.length > 0) {
                currentIssue = gameIssues[0];
                
                // Get options for this issue
                const [options] = await pool.execute(
                    `SELECT * FROM issue_options WHERE issue_id = ? ORDER BY option_letter`,
                    [currentIssue.issue_id]
                );
                currentOptions = options;
                
                // Get votes for this round
                const [voteData] = await pool.execute(
                    `SELECT v.*, p.user_id, c.country_code
                     FROM votes v
                     JOIN players p ON v.player_id = p.player_id
                     JOIN countries c ON p.country_id = c.country_id
                     WHERE v.game_issue_id = ?`,
                    [currentIssue.game_issue_id]
                );
                votes = voteData;
            }
        }
        
        res.json({
            game: game,
            players: players,
            currentIssue: currentIssue,
            currentOptions: currentOptions,
            votes: votes
        });
    } catch (error) {
        console.error('Get game state error:', error);
        res.status(500).json({ error: 'Failed to get game state' });
    }
});

// Submit vote
app.post('/api/games/:gameCode/vote', async (req, res) => {
    const { gameCode } = req.params;
    const { optionId, voteValue } = req.body;
    
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        // Get game and verify it's active
        const [games] = await pool.execute(
            'SELECT game_id, current_round FROM games WHERE game_code = ? AND game_status = ?',
            [gameCode, 'phase1_active']
        );
        
        if (games.length === 0) {
            return res.status(400).json({ error: 'Game not active' });
        }
        
        const game = games[0];
        
        // Get player
        const [players] = await pool.execute(
            'SELECT player_id FROM players WHERE game_id = ? AND user_id = ?',
            [game.game_id, req.session.userId]
        );
        
        if (players.length === 0) {
            return res.status(400).json({ error: 'Not in this game' });
        }
        
        const playerId = players[0].player_id;
        
        // Get game_issue_id
        const [gameIssues] = await pool.execute(
            'SELECT game_issue_id FROM game_issues WHERE game_id = ? AND round_number = ?',
            [game.game_id, game.current_round]
        );
        
        if (gameIssues.length === 0) {
            return res.status(400).json({ error: 'No issue for this round' });
        }
        
        const gameIssueId = gameIssues[0].game_issue_id;
        
        // Insert or update vote
        await pool.execute(
            `INSERT INTO votes (game_issue_id, player_id, option_id, vote_value)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE vote_value = ?, voted_at = CURRENT_TIMESTAMP`,
            [gameIssueId, playerId, optionId, voteValue, voteValue]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Submit vote error:', error);
        res.status(500).json({ error: 'Failed to submit vote' });
    }
});

// Advance to next round
app.post('/api/games/:gameCode/next-round', async (req, res) => {
    const { gameCode } = req.params;
    
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const [games] = await pool.execute(
            'SELECT game_id, current_round, host_user_id FROM games WHERE game_code = ?',
            [gameCode]
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = games[0];
        
        // Verify all players have voted
        const [voteCheck] = await pool.execute(
            `SELECT 
                (SELECT COUNT(DISTINCT player_id) FROM players WHERE game_id = ?) as total_players,
                (SELECT COUNT(DISTINCT player_id) FROM votes v 
                 JOIN game_issues gi ON v.game_issue_id = gi.game_issue_id
                 WHERE gi.game_id = ? AND gi.round_number = ?) as voted_players`,
            [game.game_id, game.game_id, game.current_round]
        );
        
        if (voteCheck[0].total_players !== voteCheck[0].voted_players) {
            return res.status(400).json({ error: 'Not all players have voted' });
        }
        
        // Calculate scores for this round
        await pool.execute('CALL sp_calculate_round_scores(?, ?)', [game.game_id, game.current_round]);
        
        // Check if this was the last round
        const [issueCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM game_issues WHERE game_id = ?',
            [game.game_id]
        );
        
        if (game.current_round >= issueCount[0].count) {
            // Game complete
            await pool.execute(
                `UPDATE games SET game_status = ?, phase1_complete_time = CURRENT_TIMESTAMP 
                 WHERE game_id = ?`,
                ['phase1_complete', game.game_id]
            );
        } else {
            // Next round
            await pool.execute(
                'UPDATE games SET current_round = current_round + 1 WHERE game_id = ?',
                [game.game_id]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Next round error:', error);
        res.status(500).json({ error: 'Failed to advance round' });
    }
});

// Get final results
app.get('/api/games/:gameCode/results', async (req, res) => {
    const { gameCode } = req.params;
    
    try {
        const [games] = await pool.execute(
            'SELECT game_id FROM games WHERE game_code = ?',
            [gameCode]
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const gameId = games[0].game_id;
        
        // Get final standings
        const [standings] = await pool.execute(
            `SELECT p.player_id, u.username, u.display_name,
                    c.country_code, c.country_name, c.flag_emoji,
                    p.phase1_score, p.phase2_score, p.total_score,
                    (SELECT COUNT(*) FROM votes v
                     JOIN game_issues gi ON v.game_issue_id = gi.game_issue_id
                     JOIN issue_options io ON v.option_id = io.option_id
                     WHERE v.player_id = p.player_id 
                     AND gi.winning_option_id = v.option_id
                     AND FIND_IN_SET(c.country_code, io.favors_countries) > 0) as agreements_favored,
                    (SELECT COUNT(*) FROM votes v
                     JOIN game_issues gi ON v.game_issue_id = gi.game_issue_id
                     JOIN issue_options io ON v.option_id = io.option_id
                     WHERE v.player_id = p.player_id 
                     AND gi.winning_option_id = v.option_id
                     AND FIND_IN_SET(c.country_code, io.opposes_countries) > 0) as agreements_opposed
             FROM players p
             JOIN users u ON p.user_id = u.user_id
             JOIN countries c ON p.country_id = c.country_id
             WHERE p.game_id = ?
             ORDER BY p.total_score DESC`,
            [gameId]
        );
        
        // Get all round results
        const [roundResults] = await pool.execute(
            `SELECT gi.round_number, i.title as issue_title,
                    io.option_letter, io.option_text, io.favors_countries, io.opposes_countries
             FROM game_issues gi
             JOIN issues i ON gi.issue_id = i.issue_id
             JOIN issue_options io ON gi.winning_option_id = io.option_id
             WHERE gi.game_id = ?
             ORDER BY gi.round_number`,
            [gameId]
        );
        
        res.json({
            standings: standings,
            roundResults: roundResults
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to get results' });
    }
});

// Reset game (for playing again)
app.post('/api/games/:gameCode/reset', async (req, res) => {
    const { gameCode } = req.params;
    
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const [games] = await pool.execute(
            'SELECT game_id, host_user_id FROM games WHERE game_code = ?',
            [gameCode]
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = games[0];
        
        // Only host can reset
        if (game.host_user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Only host can reset game' });
        }
        
        // Delete votes
        await pool.execute(
            `DELETE v FROM votes v
             JOIN game_issues gi ON v.game_issue_id = gi.game_issue_id
             WHERE gi.game_id = ?`,
            [game.game_id]
        );
        
        // Reset game_issues
        await pool.execute(
            'UPDATE game_issues SET winning_option_id = NULL, completed_at = NULL WHERE game_id = ?',
            [game.game_id]
        );
        
        // Reset player scores and readiness
        await pool.execute(
            'UPDATE players SET phase1_score = 0, phase2_score = 0, is_ready = FALSE WHERE game_id = ?',
            [game.game_id]
        );
        
        // Reset game
        await pool.execute(
            'UPDATE games SET game_status = ?, current_round = 0, started_at = NULL WHERE game_id = ?',
            ['lobby', game.game_id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Reset game error:', error);
        res.status(500).json({ error: 'Failed to reset game' });
    }
});

// ============================================================
// UTILITY ROUTES
// ============================================================

// Get all countries
app.get('/api/countries', async (req, res) => {
    try {
        const [countries] = await pool.execute('SELECT * FROM countries ORDER BY country_code');
        res.json(countries);
    } catch (error) {
        console.error('Get countries error:', error);
        res.status(500).json({ error: 'Failed to get countries' });
    }
});

// Get all issues
app.get('/api/issues', async (req, res) => {
    try {
        const [issues] = await pool.execute(
            'SELECT * FROM issues ORDER BY round_order'
        );
        
        // Get options for each issue
        for (let issue of issues) {
            const [options] = await pool.execute(
                'SELECT * FROM issue_options WHERE issue_id = ? ORDER BY option_letter',
                [issue.issue_id]
            );
            issue.options = options;
        }
        
        res.json(issues);
    } catch (error) {
        console.error('Get issues error:', error);
        res.status(500).json({ error: 'Failed to get issues' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.execute('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`Bretton Woods server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});
