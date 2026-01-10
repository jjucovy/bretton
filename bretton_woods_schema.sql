-- Bretton Woods Conference Simulation Database Schema
-- Created for educational simulation game
-- Database: u585377912_bretton

-- ============================================================
-- DROP EXISTING TABLES (if recreating)
-- ============================================================
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS player_readiness;
DROP TABLE IF EXISTS game_results;
DROP TABLE IF EXISTS game_issues;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS issue_options;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS users;

-- ============================================================
-- USER ACCOUNTS TABLE
-- ============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_teacher BOOLEAN DEFAULT FALSE,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COUNTRIES TABLE (The 5 Bretton Woods Powers)
-- ============================================================
CREATE TABLE countries (
    country_id INT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(3) NOT NULL UNIQUE,
    country_name VARCHAR(50) NOT NULL,
    flag_emoji VARCHAR(10),
    color_hex VARCHAR(7),
    gold_reserves INT,
    trade_balance INT,
    gdp BIGINT,
    war_debt BIGINT,
    currency_rate DECIMAL(10,5),
    industrial_output INT,
    objectives TEXT,
    economic_position TEXT,
    INDEX idx_country_code (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert the 5 Bretton Woods countries
INSERT INTO countries (country_code, country_name, flag_emoji, color_hex, gold_reserves, trade_balance, gdp, war_debt, currency_rate, industrial_output, objectives, economic_position) VALUES
('USA', 'United States', '🇺🇸', '#1e40af', 20000, 6800, 210000, 250000, 1.00000, 100, 
    'Establish dollar as primary reserve currency; Create stable exchange rates tied to gold', 
    'Economic superpower with 60% of world gold reserves'),
('UK', 'United Kingdom', '🇬🇧', '#dc2626', 1800, -2000, 61000, 120000, 4.03000, 35,
    'Maintain sterling area influence; Maximize access to American credit',
    'Heavily indebted but determined to preserve global influence'),
('USSR', 'Soviet Union', '🇷🇺', '#dc2626', 2500, -1000, 126000, 50000, 5.30000, 60,
    'Maximize reconstruction aid; Maintain economic sovereignty',
    'Powerful but war-devastated, skeptical of capitalist institutions'),
('FRA', 'France', '🇫🇷', '#2563eb', 500, -1500, 37000, 45000, 0.02000, 15,
    'Secure reconstruction funds; Restore French economic prestige',
    'Devastated by occupation, seeking to reclaim great power status'),
('CHN', 'China', '🇨🇳', '#dc2626', 300, -800, 45000, 35000, 0.00016, 8,
    'Gain international recognition; Access to development capital',
    'War-torn and impoverished, emerging from Japanese occupation');

-- ============================================================
-- ISSUES TABLE (Conference Discussion Topics)
-- ============================================================
CREATE TABLE issues (
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    historical_context TEXT,
    round_order INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_round_order (round_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert the 6 conference issues
INSERT INTO issues (issue_number, title, description, historical_context, round_order) VALUES
(1, 'Exchange Rate System', 
    'How should currencies be valued against each other?',
    'The gold standard collapsed in the 1930s, causing competitive devaluations. A new system is needed.',
    1),
(2, 'International Monetary Fund',
    'What powers should the IMF have?',
    'A new institution to provide emergency loans and monitor exchange rates is proposed.',
    2),
(3, 'World Bank Structure',
    'How should reconstruction and development be financed?',
    'Europe needs massive rebuilding. The question is who controls the funds and how they are distributed.',
    3),
(4, 'Capital Controls',
    'Should countries be allowed to restrict international capital flows?',
    'Free capital movement can cause instability, but controls limit economic freedom.',
    4),
(5, 'Soviet Participation',
    'How much should the USSR be included in the new system?',
    'The Soviet Union wants aid but is suspicious of capitalist institutions.',
    5),
(6, 'Sterling Area',
    'What happens to Britain\'s currency bloc?',
    'The UK maintains a trading area using the pound sterling. Should this continue?',
    6);

-- ============================================================
-- ISSUE OPTIONS TABLE (Voting Choices for Each Issue)
-- ============================================================
CREATE TABLE issue_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    option_letter CHAR(1) NOT NULL,
    option_text VARCHAR(500) NOT NULL,
    favors_countries VARCHAR(50), -- Comma-separated country codes
    opposes_countries VARCHAR(50), -- Comma-separated country codes
    historical_outcome BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    INDEX idx_issue_option (issue_id, option_letter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert options for Issue 1: Exchange Rate System
INSERT INTO issue_options (issue_id, option_letter, option_text, favors_countries, opposes_countries, historical_outcome) VALUES
(1, 'A', 'Fixed rates pegged to gold-backed dollar', 'USA', 'UK,USSR', TRUE),
(1, 'B', 'Flexible rates with wider bands', 'UK', 'USA,FRA', FALSE),
(1, 'C', 'Return to pre-war gold standard', 'FRA', 'USA,UK,USSR', FALSE);

-- Insert options for Issue 2: IMF Powers
INSERT INTO issue_options (issue_id, option_letter, option_text, favors_countries, opposes_countries, historical_outcome) VALUES
(2, 'A', 'Strong IMF with enforcement powers', 'USA', 'USSR,UK', TRUE),
(2, 'B', 'Advisory role only', 'USSR,UK', 'USA', FALSE),
(2, 'C', 'Regional institutions instead', 'USSR', 'USA,UK', FALSE);

-- Insert options for Issue 3: World Bank
INSERT INTO issue_options (issue_id, option_letter, option_text, favors_countries, opposes_countries, historical_outcome) VALUES
(3, 'A', 'US-led with voting by contribution', 'USA', 'USSR,CHN', TRUE),
(3, 'B', 'Equal voting for all members', 'USSR,CHN', 'USA', FALSE),
(3, 'C', 'European-controlled reconstruction', 'UK,FRA', 'USA,USSR', FALSE);

-- Insert options for Issue 4: Capital Controls
INSERT INTO issue_options (issue_id, option_letter, option_text, favors_countries, opposes_countries, historical_outcome) VALUES
(4, 'A', 'Free capital movement', 'USA', 'UK,USSR', FALSE),
(4, 'B', 'Temporary controls allowed', 'UK,USSR', 'USA', TRUE),
(4, 'C', 'Permanent state control', 'USSR', 'USA,UK', FALSE);

-- Insert options for Issue 5: Soviet Participation
INSERT INTO issue_options (issue_id, option_letter, option_text, favors_countries, opposes_countries, historical_outcome) VALUES
(5, 'A', 'Full USSR membership and voting', 'USSR', 'USA', FALSE),
(5, 'B', 'Limited participation', 'USA,UK', 'USSR', FALSE),
(5, 'C', 'No Soviet involvement', 'USA', 'USSR', FALSE);

-- Insert options for Issue 6: Sterling Area
INSERT INTO issue_options (issue_id, option_letter, option_text, favors_countries, opposes_countries, historical_outcome) VALUES
(6, 'A', 'Maintain sterling bloc', 'UK', 'USA', TRUE),
(6, 'B', 'Gradual dissolution', 'USA', 'UK', FALSE),
(6, 'C', 'Immediate dismantling', 'USA', 'UK,FRA', FALSE);

-- ============================================================
-- GAMES TABLE (Individual Game Sessions)
-- ============================================================
CREATE TABLE games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(6) UNIQUE NOT NULL, -- Simple join code like "ABC123"
    host_user_id INT,
    game_status ENUM('lobby', 'phase1_active', 'phase1_complete', 'phase2_active', 'completed') DEFAULT 'lobby',
    current_round INT DEFAULT 0,
    phase1_complete_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    max_players INT DEFAULT 5,
    FOREIGN KEY (host_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_game_code (game_code),
    INDEX idx_game_status (game_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAYERS TABLE (Users in Specific Games)
-- ============================================================
CREATE TABLE players (
    player_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    country_id INT NOT NULL,
    phase1_score INT DEFAULT 0,
    phase2_score INT DEFAULT 0,
    total_score INT GENERATED ALWAYS AS (phase1_score + phase2_score) STORED,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(country_id),
    UNIQUE KEY unique_game_country (game_id, country_id),
    INDEX idx_game_user (game_id, user_id),
    INDEX idx_country (country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GAME ISSUES TABLE (Tracks which issues are in which games)
-- ============================================================
CREATE TABLE game_issues (
    game_issue_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    issue_id INT NOT NULL,
    round_number INT NOT NULL,
    winning_option_id INT NULL,
    votes_for INT DEFAULT 0,
    votes_against INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
    FOREIGN KEY (winning_option_id) REFERENCES issue_options(option_id),
    INDEX idx_game_round (game_id, round_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VOTES TABLE (Individual Player Votes)
-- ============================================================
CREATE TABLE votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    game_issue_id INT NOT NULL,
    player_id INT NOT NULL,
    option_id INT NOT NULL,
    vote_value BOOLEAN NOT NULL, -- TRUE = support, FALSE = oppose
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_issue_id) REFERENCES game_issues(game_issue_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES issue_options(option_id),
    UNIQUE KEY unique_vote (game_issue_id, player_id, option_id),
    INDEX idx_game_issue (game_issue_id),
    INDEX idx_player (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAYER READINESS TABLE (Tracks ready status between rounds)
-- ============================================================
CREATE TABLE player_readiness (
    readiness_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    round_number INT NOT NULL,
    is_ready BOOLEAN DEFAULT FALSE,
    marked_ready_at TIMESTAMP NULL,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    UNIQUE KEY unique_readiness (game_id, player_id, round_number),
    INDEX idx_game_round_readiness (game_id, round_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GAME RESULTS TABLE (Final Scores and Statistics)
-- ============================================================
CREATE TABLE game_results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    final_rank INT,
    phase1_score INT,
    phase2_score INT,
    total_score INT,
    agreements_favored INT DEFAULT 0,
    agreements_opposed INT DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    INDEX idx_game_results (game_id),
    INDEX idx_player_results (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View for current game state with player count
CREATE VIEW vw_game_lobby AS
SELECT 
    g.game_id,
    g.game_code,
    g.game_status,
    g.current_round,
    g.created_at,
    COUNT(p.player_id) as player_count,
    u.username as host_username
FROM games g
LEFT JOIN players p ON g.game_id = p.game_id
LEFT JOIN users u ON g.host_user_id = u.user_id
GROUP BY g.game_id;

-- View for player standings in a game
CREATE VIEW vw_player_standings AS
SELECT 
    p.game_id,
    p.player_id,
    u.username,
    u.display_name,
    c.country_name,
    c.flag_emoji,
    p.phase1_score,
    p.phase2_score,
    p.total_score,
    p.is_ready
FROM players p
JOIN users u ON p.user_id = u.user_id
JOIN countries c ON p.country_id = c.country_id
ORDER BY p.total_score DESC;

-- View for voting results
CREATE VIEW vw_voting_results AS
SELECT 
    gi.game_id,
    gi.round_number,
    i.title as issue_title,
    io.option_letter,
    io.option_text,
    COUNT(CASE WHEN v.vote_value = TRUE THEN 1 END) as votes_for,
    COUNT(CASE WHEN v.vote_value = FALSE THEN 1 END) as votes_against
FROM game_issues gi
JOIN issues i ON gi.issue_id = i.issue_id
JOIN issue_options io ON i.issue_id = io.issue_id
LEFT JOIN votes v ON gi.game_issue_id = v.game_issue_id AND io.option_id = v.option_id
GROUP BY gi.game_issue_id, io.option_id;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //

-- Procedure to create a new game
CREATE PROCEDURE sp_create_game(
    IN p_host_user_id INT,
    OUT p_game_id INT,
    OUT p_game_code VARCHAR(6)
)
BEGIN
    -- Generate random 6-character game code
    SET p_game_code = UPPER(SUBSTRING(MD5(RAND()), 1, 6));
    
    -- Insert new game
    INSERT INTO games (game_code, host_user_id, game_status)
    VALUES (p_game_code, p_host_user_id, 'lobby');
    
    SET p_game_id = LAST_INSERT_ID();
    
    -- Initialize game issues
    INSERT INTO game_issues (game_id, issue_id, round_number)
    SELECT p_game_id, issue_id, round_order
    FROM issues
    WHERE is_active = TRUE
    ORDER BY round_order;
END //

-- Procedure to join a game
CREATE PROCEDURE sp_join_game(
    IN p_game_code VARCHAR(6),
    IN p_user_id INT,
    IN p_country_code VARCHAR(3),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(200)
)
BEGIN
    DECLARE v_game_id INT;
    DECLARE v_country_id INT;
    DECLARE v_player_count INT;
    DECLARE v_game_status VARCHAR(20);
    
    -- Get game info
    SELECT game_id, game_status INTO v_game_id, v_game_status
    FROM games WHERE game_code = p_game_code;
    
    IF v_game_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Game not found';
    ELSEIF v_game_status != 'lobby' THEN
        SET p_success = FALSE;
        SET p_message = 'Game already started';
    ELSE
        -- Get country ID
        SELECT country_id INTO v_country_id
        FROM countries WHERE country_code = p_country_code;
        
        -- Check if country already taken
        SELECT COUNT(*) INTO v_player_count
        FROM players
        WHERE game_id = v_game_id AND country_id = v_country_id;
        
        IF v_player_count > 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Country already taken';
        ELSE
            -- Join game
            INSERT INTO players (game_id, user_id, country_id)
            VALUES (v_game_id, p_user_id, v_country_id);
            
            SET p_success = TRUE;
            SET p_message = 'Successfully joined game';
        END IF;
    END IF;
END //

-- Procedure to calculate scores after a round
CREATE PROCEDURE sp_calculate_round_scores(
    IN p_game_id INT,
    IN p_round_number INT
)
BEGIN
    DECLARE v_game_issue_id INT;
    DECLARE v_winning_option_id INT;
    DECLARE v_favors VARCHAR(50);
    DECLARE v_opposes VARCHAR(50);
    
    -- Get the game issue
    SELECT game_issue_id INTO v_game_issue_id
    FROM game_issues
    WHERE game_id = p_game_id AND round_number = p_round_number;
    
    -- Determine winning option (most support votes)
    SELECT option_id INTO v_winning_option_id
    FROM votes
    WHERE game_issue_id = v_game_issue_id
    GROUP BY option_id
    ORDER BY SUM(CASE WHEN vote_value = TRUE THEN 1 ELSE 0 END) DESC
    LIMIT 1;
    
    -- Update game_issues with winner
    UPDATE game_issues
    SET winning_option_id = v_winning_option_id,
        completed_at = CURRENT_TIMESTAMP
    WHERE game_issue_id = v_game_issue_id;
    
    -- Get favors and opposes from winning option
    SELECT favors_countries, opposes_countries
    INTO v_favors, v_opposes
    FROM issue_options
    WHERE option_id = v_winning_option_id;
    
    -- Award points to favored countries
    UPDATE players p
    JOIN countries c ON p.country_id = c.country_id
    SET p.phase1_score = p.phase1_score + 10
    WHERE p.game_id = p_game_id
    AND FIND_IN_SET(c.country_code, v_favors) > 0;
    
    -- Deduct points from opposed countries
    UPDATE players p
    JOIN countries c ON p.country_id = c.country_id
    SET p.phase1_score = p.phase1_score - 5
    WHERE p.game_id = p_game_id
    AND FIND_IN_SET(c.country_code, v_opposes) > 0;
END //

DELIMITER ;

-- ============================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================

-- Create a test teacher account
INSERT INTO users (username, email, password_hash, display_name, is_teacher)
VALUES ('teacher_demo', 'teacher@example.com', '$2y$10$dummyhashfordemopurposes', 'Demo Teacher', TRUE);

-- Create some test students
INSERT INTO users (username, email, password_hash, display_name)
VALUES 
    ('student_alice', 'alice@example.com', '$2y$10$dummyhashfordemopurposes', 'Alice'),
    ('student_bob', 'bob@example.com', '$2y$10$dummyhashfordemopurposes', 'Bob'),
    ('student_carol', 'carol@example.com', '$2y$10$dummyhashfordemopurposes', 'Carol'),
    ('student_dave', 'dave@example.com', '$2y$10$dummyhashfordemopurposes', 'Dave'),
    ('student_eve', 'eve@example.com', '$2y$10$dummyhashfordemopurposes', 'Eve');

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional indexes for common queries
CREATE INDEX idx_user_last_login ON users(last_login);
CREATE INDEX idx_game_started ON games(started_at);
CREATE INDEX idx_player_scores ON players(total_score DESC);
CREATE INDEX idx_votes_timestamp ON votes(voted_at);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
