import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Trophy, Users, Clock, RefreshCw, LogOut } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

const BrettonWoodsGame = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Game state
  const [gameCode, setGameCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [myVotes, setMyVotes] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Screens: 'auth', 'menu', 'lobby', 'playing', 'results'
  const [screen, setScreen] = useState('auth');

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Poll game state when in lobby or playing
  useEffect(() => {
    if (gameCode && (screen === 'lobby' || screen === 'playing')) {
      const interval = setInterval(() => {
        if (screen === 'lobby') {
          fetchLobby();
        } else if (screen === 'playing') {
          fetchGameState();
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [gameCode, screen]);

  // ============================================================
  // API FUNCTIONS
  // ============================================================

  const api = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  const checkSession = async () => {
    try {
      const data = await api('/auth/session');
      if (data.authenticated) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setScreen('menu');
      }
    } catch (err) {
      // Not authenticated, stay on auth screen
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      setIsAuthenticated(true);
      setCurrentUser(data);
      setScreen('menu');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          username, 
          password, 
          email: email || null,
          displayName: displayName || username
        })
      });
      
      setIsAuthenticated(true);
      setCurrentUser(data);
      setScreen('menu');
      setPassword('');
      setEmail('');
      setDisplayName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setCurrentUser(null);
      setScreen('auth');
      setGameCode('');
      setGameState(null);
      setLobbyData(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const createGame = async () => {
    setError('');
    setLoading(true);
    
    try {
      const data = await api('/games/create', { method: 'POST' });
      setGameCode(data.gameCode);
      setScreen('lobby');
      fetchLobby(data.gameCode);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (code) => {
    setError('');
    setLoading(true);
    
    try {
      const data = await api(`/games/${code}/lobby`);
      setGameCode(code);
      setLobbyData(data);
      setScreen('lobby');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLobby = async (code = gameCode) => {
    try {
      const data = await api(`/games/${code}/lobby`);
      setLobbyData(data);
      
      // If game started, switch to playing screen
      if (data.game.game_status === 'phase1_active') {
        setScreen('playing');
        fetchGameState();
      } else if (data.game.game_status === 'phase1_complete') {
        setScreen('results');
      }
    } catch (err) {
      console.error('Fetch lobby error:', err);
    }
  };

  const selectCountry = async (countryCode) => {
    setError('');
    
    try {
      await api(`/games/${gameCode}/join`, {
        method: 'POST',
        body: JSON.stringify({ gameCode, countryCode })
      });
      
      setSelectedCountry(countryCode);
      fetchLobby();
    } catch (err) {
      setError(err.message);
    }
  };

  const markReady = async () => {
    try {
      await api(`/games/${gameCode}/ready`, { method: 'POST' });
      fetchLobby();
    } catch (err) {
      setError(err.message);
    }
  };

  const startGame = async () => {
    setError('');
    
    try {
      await api(`/games/${gameCode}/start`, { method: 'POST' });
      setScreen('playing');
      fetchGameState();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchGameState = async () => {
    try {
      const data = await api(`/games/${gameCode}/state`);
      setGameState(data);
      
      // If game completed, go to results
      if (data.game.game_status === 'phase1_complete') {
        setScreen('results');
      }
    } catch (err) {
      console.error('Fetch game state error:', err);
    }
  };

  const submitVote = async (optionId, value) => {
    try {
      await api(`/games/${gameCode}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId, voteValue: value })
      });
      
      setMyVotes({ ...myVotes, [optionId]: value });
      fetchGameState();
    } catch (err) {
      setError(err.message);
    }
  };

  const nextRound = async () => {
    setError('');
    
    try {
      await api(`/games/${gameCode}/next-round`, { method: 'POST' });
      fetchGameState();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetGame = async () => {
    try {
      await api(`/games/${gameCode}/reset`, { method: 'POST' });
      setScreen('lobby');
      setMyVotes({});
      fetchLobby();
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getMyPlayer = () => {
    if (!gameState || !currentUser) return null;
    return gameState.players.find(p => p.user_id === currentUser.userId);
  };

  const hasVotedOnOption = (optionId) => {
    if (!gameState) return false;
    const myPlayer = getMyPlayer();
    if (!myPlayer) return false;
    
    return gameState.votes.some(v => 
      v.player_id === myPlayer.player_id && v.option_id === optionId
    );
  };

  const getMyVoteOnOption = (optionId) => {
    if (!gameState) return null;
    const myPlayer = getMyPlayer();
    if (!myPlayer) return null;
    
    const vote = gameState.votes.find(v => 
      v.player_id === myPlayer.player_id && v.option_id === optionId
    );
    
    return vote ? vote.vote_value : null;
  };

  const allPlayersVoted = () => {
    if (!gameState) return false;
    
    const totalPlayers = gameState.players.length;
    const votedPlayers = new Set(gameState.votes.map(v => v.player_id)).size;
    
    return totalPlayers === votedPlayers;
  };

  // ============================================================
  // RENDER SCREENS
  // ============================================================

  // AUTH SCREEN
  if (screen === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-amber-100 text-center mb-2">
            Bretton Woods Conference
          </h1>
          <p className="text-amber-200 text-center mb-8">July 1944 • New Hampshire</p>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded transition ${
                authMode === 'login'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/20 text-amber-100'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded transition ${
                authMode === 'register'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/20 text-amber-100'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded bg-white/20 text-white placeholder-amber-200 border border-amber-300/30"
                required
              />
              
              {authMode === 'register' && (
                <>
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded bg-white/20 text-white placeholder-amber-200 border border-amber-300/30"
                  />
                  <input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded bg-white/20 text-white placeholder-amber-200 border border-amber-300/30"
                  />
                </>
              )}
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded bg-white/20 text-white placeholder-amber-200 border border-amber-300/30"
                required
              />
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded transition disabled:opacity-50"
              >
                {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-100 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MENU SCREEN
  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-amber-100">Bretton Woods Conference</h1>
              <p className="text-amber-200">Welcome, {currentUser?.display_name || currentUser?.username}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={createGame}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 text-lg"
            >
              {loading ? 'Creating...' : 'Create New Game'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-300/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-amber-200">or</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded bg-white/20 text-white placeholder-amber-200 border border-amber-300/30 uppercase"
                maxLength={6}
              />
              <button
                onClick={() => joinGame(gameCode)}
                disabled={!gameCode || loading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-100 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 p-6 bg-white/5 rounded-lg">
            <h3 className="text-xl font-bold text-amber-100 mb-3">About This Simulation</h3>
            <p className="text-amber-200 text-sm leading-relaxed">
              Step into history and negotiate the post-World War II international economic order. 
              Represent one of five major powers at the 1944 Bretton Woods Conference. Balance your 
              national interests with the need for global cooperation. Your decisions will shape the 
              institutions that govern international finance for decades to come.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOBBY SCREEN
  if (screen === 'lobby' && lobbyData) {
    const myPlayer = lobbyData.players.find(p => p.user_id === currentUser?.userId);
    const allReady = lobbyData.players.every(p => p.is_ready);
    const isHost = lobbyData.game.host_user_id === currentUser?.userId;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-amber-100">Game Lobby</h1>
                <p className="text-2xl text-amber-200 font-mono mt-2">Code: {gameCode}</p>
              </div>
              <button
                onClick={() => {
                  setScreen('menu');
                  setGameCode('');
                  setLobbyData(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Leave Game
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-100 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Players */}
              <div className="bg-white/5 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-amber-100 mb-4 flex items-center gap-2">
                  <Users size={24} />
                  Players ({lobbyData.players.length}/5)
                </h2>
                <div className="space-y-3">
                  {lobbyData.players.map(player => (
                    <div
                      key={player.player_id}
                      className="flex items-center justify-between p-3 bg-white/10 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{player.flag_emoji}</span>
                        <div>
                          <div className="text-white font-bold">{player.display_name}</div>
                          <div className="text-amber-200 text-sm">{player.country_name}</div>
                        </div>
                      </div>
                      {player.is_ready && (
                        <Check className="text-green-400" size={24} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div className="bg-white/5 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-amber-100 mb-4">
                  {myPlayer ? 'Your Country' : 'Select Country'}
                </h2>
                
                {myPlayer ? (
                  <div className="p-4 bg-green-600/20 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{myPlayer.flag_emoji}</span>
                      <div>
                        <div className="text-white font-bold text-xl">{myPlayer.country_name}</div>
                        <div className="text-green-200">Ready to negotiate!</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lobbyData.availableCountries.map(country => (
                      <button
                        key={country.country_id}
                        onClick={() => selectCountry(country.country_code)}
                        className="w-full p-3 bg-white/10 hover:bg-white/20 rounded flex items-center gap-3 transition"
                      >
                        <span className="text-2xl">{country.flag_emoji}</span>
                        <span className="text-white font-bold">{country.country_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              {myPlayer && !myPlayer.is_ready && (
                <button
                  onClick={markReady}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                >
                  Mark Ready
                </button>
              )}
              
              {isHost && allReady && lobbyData.players.length > 0 && (
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-lg"
                >
                  Start Conference
                </button>
              )}
            </div>

            {isHost && !allReady && (
              <p className="text-center text-amber-200 mt-4">
                Waiting for all players to be ready...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PLAYING SCREEN
  if (screen === 'playing' && gameState) {
    const myPlayer = getMyPlayer();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-amber-100">Bretton Woods Conference</h1>
                <p className="text-amber-200">
                  Round {gameState.game.current_round} of 6
                </p>
              </div>
              {myPlayer && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-amber-100">
                    <span className="text-2xl">{myPlayer.flag_emoji}</span>
                    <span className="font-bold">{myPlayer.country_name}</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-100">
                    Score: {myPlayer.phase1_score}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-4">
            <h2 className="text-xl font-bold text-amber-100 mb-3">Current Standings</h2>
            <div className="grid grid-cols-5 gap-2">
              {gameState.players.map((player, idx) => (
                <div
                  key={player.player_id}
                  className={`p-3 rounded text-center ${
                    player.user_id === currentUser?.userId
                      ? 'bg-amber-600/40 border-2 border-amber-300'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="text-2xl mb-1">{player.flag_emoji}</div>
                  <div className="text-white font-bold text-sm">{player.country_code}</div>
                  <div className="text-amber-100 text-xl font-bold">{player.phase1_score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Issue */}
          {gameState.currentIssue && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-2xl font-bold text-amber-100 mb-2">
                {gameState.currentIssue.title}
              </h2>
              <p className="text-amber-200 mb-4">
                {gameState.currentIssue.description}
              </p>
              <div className="bg-blue-900/30 border border-blue-400 rounded p-4 mb-6">
                <p className="text-blue-100 text-sm">
                  <strong>Historical Context:</strong> {gameState.currentIssue.historical_context}
                </p>
              </div>

              {/* Voting Options */}
              <div className="space-y-3 mb-6">
                {gameState.currentOptions.map(option => {
                  const myVote = getMyVoteOnOption(option.option_id);
                  const favorsMe = myPlayer && option.favors_countries?.includes(myPlayer.country_code);
                  const opposesMe = myPlayer && option.opposes_countries?.includes(myPlayer.country_code);
                  
                  return (
                    <div
                      key={option.option_id}
                      className={`p-4 rounded-lg border-2 ${
                        favorsMe
                          ? 'bg-green-900/30 border-green-400'
                          : opposesMe
                          ? 'bg-red-900/30 border-red-400'
                          : 'bg-white/5 border-amber-300/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <span className="text-xl font-bold text-amber-100">
                            Option {option.option_letter}
                          </span>
                          {favorsMe && (
                            <span className="ml-3 text-sm text-green-300">+10 if passed</span>
                          )}
                          {opposesMe && (
                            <span className="ml-3 text-sm text-red-300">-5 if passed</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitVote(option.option_id, true)}
                            disabled={myVote !== null}
                            className={`px-4 py-2 rounded transition ${
                              myVote === true
                                ? 'bg-green-600 ring-2 ring-white'
                                : myVote === null
                                ? 'bg-white/20 hover:bg-green-600/50'
                                : 'bg-white/10 opacity-50'
                            }`}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => submitVote(option.option_id, false)}
                            disabled={myVote !== null}
                            className={`px-4 py-2 rounded transition ${
                              myVote === false
                                ? 'bg-red-600 ring-2 ring-white'
                                : myVote === null
                                ? 'bg-white/20 hover:bg-red-600/50'
                                : 'bg-white/10 opacity-50'
                            }`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-amber-200">{option.option_text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Next Round Button */}
              {allPlayersVoted() && (
                <button
                  onClick={nextRound}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition text-lg"
                >
                  {gameState.game.current_round >= 6 ? 'See Final Results' : 'Next Round'}
                </button>
              )}
              
              {!allPlayersVoted() && (
                <div className="text-center text-amber-200">
                  Waiting for all players to vote...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (screen === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
            <h1 className="text-4xl font-bold text-amber-100 text-center mb-8">
              <Trophy className="inline mr-3" size={40} />
              Conference Results
            </h1>

            <div className="space-y-3 mb-8">
              {gameState?.players
                .sort((a, b) => b.total_score - a.total_score)
                .map((player, idx) => (
                  <div
                    key={player.player_id}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      idx === 0
                        ? 'bg-amber-600 border-2 border-yellow-300'
                        : 'bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-amber-100">#{idx + 1}</span>
                      <span className="text-3xl">{player.flag_emoji}</span>
                      <div>
                        <div className="text-xl font-bold text-white">
                          {player.country_name}
                        </div>
                        <div className="text-amber-200">
                          {player.display_name || player.username}
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {player.total_score}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition"
              >
                <RefreshCw className="inline mr-2" size={18} />
                Play Again
              </button>
              <button
                onClick={() => {
                  setScreen('menu');
                  setGameCode('');
                  setGameState(null);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BrettonWoodsGame;
