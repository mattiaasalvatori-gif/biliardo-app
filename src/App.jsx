import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, Trophy, Target, TrendingUp, Award, BarChart3 } from 'lucide-react';

const BiliardoApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedMode, setSelectedMode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [globalStats, setGlobalStats] = useState({});
  const [trackedPlayers, setTrackedPlayers] = useState([]);
  const [showMatchStats, setShowMatchStats] = useState(false);
  const [ballType, setBallType] = useState(null);
  const [remainingBalls, setRemainingBalls] = useState({
    solid: [1, 2, 3, 4, 5, 6, 7],
    striped: [9, 10, 11, 12, 13, 14, 15]
  });
  const [ball9Remaining, setBall9Remaining] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [gameTime, setGameTime] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);

  useEffect(() => {
    const savedStats = localStorage.getItem('globalPlayerStats');
    if (savedStats) {
      setGlobalStats(JSON.parse(savedStats));
    }
  }, []);

  // Timer di gioco
  useEffect(() => {
    let interval;
    if (gameState && !gameState.isFinished) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(gameState.startTime).getTime()) / 1000);
        setGameTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const saveGlobalStats = (stats) => {
    localStorage.setItem('globalPlayerStats', JSON.stringify(stats));
    setGlobalStats(stats);
  };

  const modes = {
    duo: { name: 'Duo', playerCount: 2, fixed: true },
    'duo-ball9': { name: 'Duo - Palla 9', playerCount: 2, fixed: true },
    trio: { name: 'Trio', playerCount: 3, fixed: true },
    'trio-ffa': { name: 'Trio - Tutti contro tutti', playerCount: 3, fixed: true },
    'trio-ball9': { name: 'Trio - Palla 9', playerCount: 3, fixed: true },
    quartetto: { name: 'Quartetto', playerCount: 4, fixed: true },
    torneo: { name: 'Torneo', playerCount: 4, fixed: false }
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    
    // Se è Duo o Trio, mostra le sotto-modalità
    if (mode === 'duo') {
      setCurrentPage('duo-submodes');
    } else if (mode === 'trio') {
      setCurrentPage('trio-submodes');
    } else {
      const initialPlayers = Array(modes[mode].playerCount).fill('');
      setPlayers(initialPlayers);
      setTrackedPlayers(Array(modes[mode].playerCount).fill(false));
      setCurrentPage('players');
    }
  };

  const handleTrioSubmodeSelect = (submode) => {
    setSelectedMode(submode); // 'trio-ffa' o 'trio-ball9'
    const initialPlayers = Array(3).fill('');
    setPlayers(initialPlayers);
    setTrackedPlayers(Array(3).fill(false));
    setCurrentPage('players');
  };

  const handleDuoSubmodeSelect = (submode) => {
    setSelectedMode(submode); // 'duo' o 'duo-ball9'
    const initialPlayers = Array(2).fill('');
    setPlayers(initialPlayers);
    setTrackedPlayers(Array(2).fill(false));
    setCurrentPage('players');
  };

  const handlePlayerNameChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (selectedMode === 'torneo') {
      setPlayers([...players, '']);
      setTrackedPlayers([...trackedPlayers, false]);
    }
  };

  const removePlayer = (index) => {
    if (selectedMode === 'torneo' && players.length > 4) {
      const newPlayers = players.filter((_, i) => i !== index);
      const newTracked = trackedPlayers.filter((_, i) => i !== index);
      setPlayers(newPlayers);
      setTrackedPlayers(newTracked);
    }
  };

  const toggleTracking = (index) => {
    const newTracked = [...trackedPlayers];
    newTracked[index] = !newTracked[index];
    setTrackedPlayers(newTracked);
  };

  const startGame = () => {
    const filledPlayers = players.filter(p => p.trim() !== '');
    if (filledPlayers.length === players.length) {
      const initialGameState = {
        mode: selectedMode,
        players: players.map(name => ({
          name: name,
          shots: 0,
          pocketed: 0,
          currentTurn: false
        })),
        startTime: new Date().toISOString(),
        isFinished: false
      };
      initialGameState.players[0].currentTurn = true;
      setGameState(initialGameState);
      setCurrentPlayerIndex(0);
      
      // Per Trio FFA, inizia mostrando tutte le palle (non serve selezione tipo)
      if (selectedMode === 'trio-ffa') {
        setBallType('all');
      } else if (selectedMode === 'trio-ball9' || selectedMode === 'duo-ball9') {
        // Per Palla 9, non serve selezione tipo, mostra subito le palle
        setBallType('ball9');
        setBall9Remaining([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      } else {
        setBallType(null); // Selezione normale per altre modalità
      }
      
      setRemainingBalls({
        solid: [1, 2, 3, 4, 5, 6, 7],
        striped: [9, 10, 11, 12, 13, 14, 15]
      });
      setGameTime(0);
      setActionHistory([]);
      setCurrentPage('game');
    } else {
      alert('Per favore, inserisci tutti i nomi dei giocatori prima di iniziare!');
    }
  };

  const pocketBall = (ballNumber) => {
    if (!gameState || gameState.isFinished) return;

    // Salva lo stato prima dell'azione
    const snapshot = {
      type: 'pocketBall',
      ballNumber,
      gameState: JSON.parse(JSON.stringify(gameState)),
      currentPlayerIndex,
      ballType,
      remainingBalls: JSON.parse(JSON.stringify(remainingBalls)),
      ball9Remaining: [...ball9Remaining]
    };

    const newGameState = { ...gameState };
    newGameState.players[currentPlayerIndex].shots += 1;
    newGameState.players[currentPlayerIndex].pocketed += 1;
    setGameState(newGameState);

    // Per Palla 9
    if (selectedMode === 'trio-ball9' || selectedMode === 'duo-ball9') {
      // Se imbuca la palla 9, vince immediatamente
      if (ballNumber === 9) {
        setActionHistory([...actionHistory, snapshot]);
        endGame(currentPlayerIndex);
        return;
      }
      
      // Rimuovi la palla imbucata
      const newBall9Remaining = ball9Remaining.filter(b => b !== ballNumber);
      setBall9Remaining(newBall9Remaining);
      setActionHistory([...actionHistory, snapshot]);
      return;
    }

    // Per altre modalità (Duo, Trio FFA, ecc.)
    const newRemainingBalls = { ...remainingBalls };
    if (ballNumber <= 7) {
      newRemainingBalls.solid = newRemainingBalls.solid.filter(b => b !== ballNumber);
    } else {
      newRemainingBalls.striped = newRemainingBalls.striped.filter(b => b !== ballNumber);
    }
    setRemainingBalls(newRemainingBalls);
    setActionHistory([...actionHistory, snapshot]);
  };

  const pocket8Ball = () => {
    if (!gameState || gameState.isFinished) return;
    endGame(currentPlayerIndex);
  };

  const foul8Ball = () => {
    if (!gameState || gameState.isFinished) return;
    const winnerIndex = (currentPlayerIndex + 1) % gameState.players.length;
    endGame(winnerIndex);
  };

  const nextPlayer = () => {
    if (!gameState || gameState.isFinished) return;

    // Salva lo stato prima dell'azione
    const snapshot = {
      type: 'nextPlayer',
      gameState: JSON.parse(JSON.stringify(gameState)),
      currentPlayerIndex,
      ballType
    };

    const newGameState = { ...gameState };
    newGameState.players[currentPlayerIndex].shots += 1;
    newGameState.players[currentPlayerIndex].currentTurn = false;
    
    const nextIndex = (currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.players[nextIndex].currentTurn = true;
    
    setCurrentPlayerIndex(nextIndex);
    setGameState(newGameState);
    
    // Alterna il tipo di palle solo se è stato già selezionato un tipo E se NON è modalità quartetto o trio-ffa o trio-ball9 o duo-ball9
    if (ballType !== null && selectedMode !== 'quartetto' && selectedMode !== 'trio-ffa' && selectedMode !== 'trio-ball9' && selectedMode !== 'duo-ball9') {
      setBallType(ballType === 'solid' ? 'striped' : 'solid');
    }

    setActionHistory([...actionHistory, snapshot]);
  };

  const undoLastAction = () => {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory[actionHistory.length - 1];
    
    // Ripristina lo stato
    setGameState(lastAction.gameState);
    setCurrentPlayerIndex(lastAction.currentPlayerIndex);
    setBallType(lastAction.ballType);
    
    if (lastAction.type === 'pocketBall') {
      setRemainingBalls(lastAction.remainingBalls);
      setBall9Remaining(lastAction.ball9Remaining);
    }
    
    // Rimuovi l'ultima azione dall'history
    setActionHistory(actionHistory.slice(0, -1));
  };

  const endGame = (winnerIndex) => {
    if (!gameState || gameState.isFinished) return;

    const newGameState = { ...gameState };
    newGameState.isFinished = true;
    newGameState.winner = newGameState.players[winnerIndex].name;
    newGameState.endTime = new Date().toISOString();
    const gameDuration = Math.floor((new Date(newGameState.endTime) - new Date(newGameState.startTime)) / 1000);
    newGameState.duration = gameDuration;

    const newGlobalStats = { ...globalStats };
    
    newGameState.players.forEach((player, index) => {
      if (trackedPlayers[index]) {
        if (!newGlobalStats[player.name]) {
          newGlobalStats[player.name] = {
            totalShots: 0,
            totalPocketed: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalGameTime: 0
          };
        }
        
        newGlobalStats[player.name].totalShots += player.shots;
        newGlobalStats[player.name].totalPocketed += player.pocketed;
        newGlobalStats[player.name].gamesPlayed += 1;
        newGlobalStats[player.name].totalGameTime += gameDuration;
        
        if (index === winnerIndex) {
          newGlobalStats[player.name].gamesWon += 1;
        }
      }
    });

    saveGlobalStats(newGlobalStats);
    setGameState(newGameState);
    setShowMatchStats(false);
    
    const completedGames = JSON.parse(localStorage.getItem('completedGames') || '[]');
    completedGames.push(newGameState);
    localStorage.setItem('completedGames', JSON.stringify(completedGames));
    
    setCurrentPage('results');
  };

  const calculateStats = (player) => {
    const accuracy = player.shots > 0 ? ((player.pocketed / player.shots) * 100).toFixed(1) : 0;
    return { accuracy };
  };

  const calculateGlobalStats = (playerName) => {
    const stats = globalStats[playerName];
    if (!stats) return null;
    
    const accuracy = stats.totalShots > 0 
      ? ((stats.totalPocketed / stats.totalShots) * 100).toFixed(1) 
      : 0;
    const winRate = stats.gamesPlayed > 0 
      ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) 
      : 0;
    
    return { ...stats, accuracy, winRate };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const resetAllStats = () => {
    // Cancella dal localStorage
    localStorage.removeItem('globalPlayerStats');
    localStorage.removeItem('completedGames');
    
    // Resetta tutti gli stati React
    setGlobalStats({});
    setShowResetModal(false);
    setCurrentPage('home');
    setGameState(null);
    setPlayers([]);
    setSelectedMode(null);
    setTrackedPlayers([]);
    setShowMatchStats(false);
    setBallType(null);
    setRemainingBalls({
      solid: [1, 2, 3, 4, 5, 6, 7],
      striped: [9, 10, 11, 12, 13, 14, 15]
    });
    setGameTime(0);
    setCurrentPlayerIndex(0);
  };

  const downloadStatsPDF = () => {
    const sortedPlayers = Object.entries(globalStats)
      .map(([name, stats]) => {
        const accuracy = stats.totalShots > 0 ? ((stats.totalPocketed / stats.totalShots) * 100).toFixed(1) : 0;
        const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : 0;
        return { name, ...stats, accuracy, winRate };
      })
      .sort((a, b) => b.gamesWon - a.gamesWon);

    const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statistiche Biliardo</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm;
        height: 297mm;
      }
      
      body {
        margin: 0;
        padding: 15mm;
        background: white !important;
      }
      
      .page-break { 
        page-break-before: always; 
      }
      
      .no-print { 
        display: none !important; 
      }
      
      .container {
        box-shadow: none !important;
        page-break-inside: avoid;
      }
      
      .player-card {
        page-break-inside: avoid;
        transform: none !important;
      }
      
      .header::before {
        opacity: 0.05 !important;
      }
    }
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1e4620 0%, #2d5016 100%);
      padding: 30px;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #2d5016 0%, #1e4620 100%);
      color: white;
      padding: 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '🎱';
      position: absolute;
      font-size: 200px;
      opacity: 0.1;
      top: -50px;
      right: -50px;
    }
    
    .header h1 {
      font-size: 42px;
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
    }
    
    .header .subtitle {
      font-size: 18px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    .header .date {
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.8;
      position: relative;
      z-index: 1;
    }
    
    .summary {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      padding: 30px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    
    .summary-item {
      text-align: center;
      color: #333;
    }
    
    .summary-item .value {
      font-size: 36px;
      font-weight: bold;
      color: #1e4620;
    }
    
    .summary-item .label {
      font-size: 14px;
      margin-top: 5px;
      font-weight: 600;
    }
    
    .content {
      padding: 40px;
    }
    
    .player-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 25px;
      border-left: 6px solid #2d5016;
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
      position: relative;
      transition: transform 0.2s;
    }
    
    .player-card:hover {
      transform: translateX(5px);
    }
    
    .player-card.top-1 {
      border-left-color: #FFD700;
      background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%);
    }
    
    .player-card.top-2 {
      border-left-color: #C0C0C0;
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
    }
    
    .player-card.top-3 {
      border-left-color: #CD7F32;
      background: linear-gradient(135deg, #fff4e6 0%, #ffe6cc 100%);
    }
    
    .medal {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 40px;
    }
    
    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-right: 60px;
    }
    
    .player-name {
      font-size: 28px;
      font-weight: bold;
      color: #1e4620;
    }
    
    .player-rank {
      font-size: 18px;
      color: #666;
      font-weight: 600;
    }
    
    .player-victories {
      font-size: 20px;
      color: #2d5016;
      font-weight: bold;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .stat-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    
    .stat-label {
      font-size: 11px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2d5016;
    }
    
    .stat-box.highlight {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    }
    
    .stat-box.highlight .stat-value {
      color: white;
    }
    
    .stat-box.highlight .stat-label {
      color: rgba(255,255,255,0.9);
    }
    
    .footer {
      background: #f8f9fa;
      padding: 25px;
      text-align: center;
      color: #666;
      font-size: 13px;
      border-top: 3px solid #2d5016;
    }
    
    .footer strong {
      color: #2d5016;
    }
    
    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #999;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎱 Statistiche Giocatori Biliardo</h1>
      <div class="subtitle">Report Completo delle Performance</div>
      <div class="date">Generato il ${new Date().toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} alle ${new Date().toLocaleTimeString('it-IT')}</div>
    </div>
    
    <div class="summary">
      <div class="summary-item">
        <div class="value">${sortedPlayers.length}</div>
        <div class="label">Giocatori Registrati</div>
      </div>
      <div class="summary-item">
        <div class="value">${Object.values(globalStats).reduce((sum, p) => sum + p.gamesPlayed, 0)}</div>
        <div class="label">Partite Totali</div>
      </div>
      <div class="summary-item">
        <div class="value">${Object.values(globalStats).reduce((sum, p) => sum + p.totalShots, 0)}</div>
        <div class="label">Tiri Eseguiti</div>
      </div>
      <div class="summary-item">
        <div class="value">${Object.values(globalStats).reduce((sum, p) => sum + p.totalPocketed, 0)}</div>
        <div class="label">Palle Imbucate</div>
      </div>
    </div>
    
    <div class="content">
      ${sortedPlayers.length === 0 ? `
        <div class="no-data">
          <p>📊 Nessuna statistica disponibile</p>
          <p style="font-size: 14px; margin-top: 10px;">Gioca la tua prima partita per vedere i dati qui!</p>
        </div>
      ` : sortedPlayers.map((player, index) => `
        <div class="player-card ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}">
          <div class="medal">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}</div>
          
          <div class="player-header">
            <div>
              <div class="player-rank">#${index + 1}</div>
              <div class="player-name">${player.name}</div>
            </div>
            <div class="player-victories">${player.gamesWon} / ${player.gamesPlayed} Vittorie</div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Tiri Eseguiti</div>
              <div class="stat-value">${player.totalShots}</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-label">Palle Imbucate</div>
              <div class="stat-value">${player.totalPocketed}</div>
            </div>
            
            <div class="stat-box ${index < 3 ? 'highlight' : ''}">
              <div class="stat-label">Precisione</div>
              <div class="stat-value">${player.accuracy}%</div>
            </div>
            
            <div class="stat-box ${index < 3 ? 'highlight' : ''}">
              <div class="stat-label">Win Rate</div>
              <div class="stat-value">${player.winRate}%</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-label">Partite Giocate</div>
              <div class="stat-value">${player.gamesPlayed}</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-label">Tempo di Gioco</div>
              <div class="stat-value">${formatTime(player.totalGameTime || 0)}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p><strong>🎱 Sfida Biliardo</strong> - Sistema di Gestione Partite e Statistiche</p>
      <p style="margin-top: 8px;">Report generato automaticamente • Mantieni questo documento per i tuoi record</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statistiche_Biliardo_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (currentPage === 'home') {
    // Calcola il miglior giocatore in base a vittorie e precisione
    let bestPlayer = null;
    const playersWithStats = Object.entries(globalStats).map(([name, stats]) => {
      const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
      const accuracy = stats.totalShots > 0 ? (stats.totalPocketed / stats.totalShots) * 100 : 0;
      // Punteggio combinato: 70% winRate + 30% accuracy
      const score = (winRate * 0.7) + (accuracy * 0.3);
      return { name, ...stats, winRate, accuracy, score };
    });
    
    if (playersWithStats.length > 0) {
      bestPlayer = playersWithStats.sort((a, b) => b.score - a.score)[0];
    }

    // Recupera l'ultima partita giocata
    const completedGames = JSON.parse(localStorage.getItem('completedGames') || '[]');
    const lastGame = completedGames.length > 0 ? completedGames[completedGames.length - 1] : null;
    
    // Crea podio ultima partita (ordinato per palle imbucate)
    let lastGamePodium = [];
    if (lastGame) {
      lastGamePodium = [...lastGame.players]
        .sort((a, b) => b.pocketed - a.pocketed)
        .slice(0, 3);
    }

    const topPlayers = Object.entries(globalStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        winRate: stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.gamesWon - a.gamesWon)
      .slice(0, 3);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        {/* Modal Conferma Azzeramento */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">ATTENZIONE</h3>
                <p className="text-gray-700">
                  Questa azione eliminerà <strong>TUTTE</strong> le statistiche e partite salvate.
                </p>
                <p className="text-gray-700 mt-2">
                  Sei sicuro di voler continuare?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
                >
                  Annulla
                </button>
                <button
                  onClick={resetAllStats}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-white">🎱 Sfida Biliardo</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <button 
                  onClick={() => setCurrentPage('statistics')}
                  className="text-gray-200 hover:text-white transition"
                >
                  Statistiche
                </button>
                <button 
                  onClick={() => setCurrentPage('rules')}
                  className="text-gray-200 hover:text-white transition"
                >
                  Regole
                </button>
              </div>
              <button 
                onClick={() => setCurrentPage('modes')}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-2 rounded-lg transition transform hover:scale-105"
              >
                Nuova Partita
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Sfida i tuoi amici!
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">
              Inserisci i nomi dei giocatori per iniziare una epica battaglia sul panno verde. 
              Preparati a dimostrare chi è il vero maestro del biliardo!
            </p>
            <button 
              onClick={() => setCurrentPage('modes')}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-lg px-10 py-4 rounded-lg transition transform hover:scale-105 shadow-xl"
            >
              Inizia Ora
            </button>
          </div>

          {/* Miglior Giocatore */}
          {bestPlayer && (
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-8 shadow-2xl transform hover:scale-105 transition">
                <div className="text-center">
                  <div className="text-5xl mb-4">👑</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Miglior Giocatore</h2>
                  <div className="text-4xl font-bold text-white mb-6">{bestPlayer.name}</div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <div className="text-sm text-gray-900 font-semibold mb-1">Win Rate</div>
                      <div className="text-3xl font-bold text-white">{bestPlayer.winRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-800 mt-1">
                        {bestPlayer.gamesWon}/{bestPlayer.gamesPlayed} partite
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <div className="text-sm text-gray-900 font-semibold mb-1">Precisione</div>
                      <div className="text-3xl font-bold text-white">{bestPlayer.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-gray-800 mt-1">
                        {bestPlayer.totalPocketed}/{bestPlayer.totalShots} tiri
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Podio Ultima Partita */}
          {lastGamePodium.length > 0 && (
            <div className="mt-12 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white text-center mb-8">
                📊 Podio Ultima Partita
              </h2>
              <div className={`grid grid-cols-1 ${lastGamePodium.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                {lastGamePodium.map((player, index) => {
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                  const bgColor = index === 0 
                    ? 'from-yellow-500 to-yellow-600' 
                    : index === 1 
                      ? 'from-gray-300 to-gray-400' 
                      : 'from-orange-600 to-orange-700';
                  
                  return (
                    <div 
                      key={player.name}
                      className={`bg-gradient-to-br ${bgColor} rounded-xl p-6 shadow-xl ${
                        index === 0 ? 'transform scale-110' : ''
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-5xl mb-3">{medal}</div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">{player.name}</div>
                        <div className="text-4xl font-bold text-white mb-1">#{index + 1}</div>
                        <div className="text-sm text-gray-800">
                          {player.pocketed} palle imbucate
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top 3 Giocatori Storici */}
          {topPlayers.length > 0 && (
            <div className="mt-20">
              <h2 className="text-3xl font-bold text-white text-center mb-8">🏆 Top 3 Giocatori</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topPlayers.map((player, index) => (
                  <div 
                    key={player.name}
                    className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center transform hover:scale-105 transition"
                  >
                    <div className="text-5xl mb-3">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">{player.name}</div>
                    <div className="text-yellow-400 text-xl font-semibold mb-3">
                      {player.gamesWon} vittorie
                    </div>
                    <div className="text-gray-200 text-sm space-y-1">
                      <div>Partite: {player.gamesPlayed}</div>
                      <div>Win Rate: {player.winRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistiche Rapide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-opacity-20 transition">
              <div className="text-4xl mb-3">⏱️</div>
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                {completedGames.length > 0
                  ? formatTime(Math.floor(completedGames.reduce((sum, g) => sum + (g.duration || 0), 0) / completedGames.length))
                  : '--'}
              </div>
              <div className="text-gray-200">Durata Media Partita</div>
              <div className="text-xs text-gray-400 mt-2">
                Su {completedGames.length} partite totali
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-opacity-20 transition">
              <div className="text-4xl mb-3">🔥</div>
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                {lastGame && lastGame.winner ? lastGame.winner : '--'}
              </div>
              <div className="text-gray-200">Ultimo Vincitore</div>
              <div className="text-xs text-gray-400 mt-2">
                {lastGame ? modes[lastGame.mode].name : 'Nessuna partita'}
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-opacity-20 transition">
              <div className="text-4xl mb-3">🎲</div>
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                {completedGames.length > 0
                  ? Object.entries(
                      completedGames.reduce((acc, game) => {
                        acc[game.mode] = (acc[game.mode] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1] - a[1])[0]?.[0] 
                    ? modes[Object.entries(
                        completedGames.reduce((acc, game) => {
                          acc[game.mode] = (acc[game.mode] || 0) + 1;
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1])[0][0]].name
                    : '--'
                  : '--'}
              </div>
              <div className="text-gray-200">Modalità Più Giocata</div>
              <div className="text-xs text-gray-400 mt-2">
                Preferita dal gruppo
              </div>
            </div>
          </div>

          {/* Pulsante Azione */}
          <div className="max-w-md mx-auto mt-16 mb-8">
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 shadow-xl"
            >
              🗑️ Azzera Statistiche
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'statistics') {
    const sortedPlayers = Object.entries(globalStats)
      .map(([name, stats]) => {
        const accuracy = stats.totalShots > 0 ? ((stats.totalPocketed / stats.totalShots) * 100).toFixed(1) : 0;
        const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : 0;
        return { name, ...stats, accuracy, winRate };
      })
      .sort((a, b) => b.gamesWon - a.gamesWon);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        {/* Modal Conferma Azzeramento */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">ATTENZIONE</h3>
                <p className="text-gray-700">
                  Questa azione eliminerà <strong>TUTTE</strong> le statistiche e partite salvate.
                </p>
                <p className="text-gray-700 mt-2">
                  Sei sicuro di voler continuare?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
                >
                  Annulla
                </button>
                <button
                  onClick={resetAllStats}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-2xl font-bold text-white hover:text-yellow-400 transition"
              >
                🎱 Sfida Biliardo
              </button>
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-gray-200 hover:text-white transition"
              >
                ← Indietro
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <BarChart3 className="w-12 h-12" />
              Statistiche Giocatori
            </h2>
            <p className="text-xl text-gray-200">
              Tutti i dati dei giocatori registrati
            </p>
          </div>

          {sortedPlayers.length === 0 ? (
            <div className="text-center text-white text-xl py-20">
              Nessuna statistica disponibile. Gioca la tua prima partita!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPlayers.map((player) => (
                <div 
                  key={player.name}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition"
                >
                                      <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-white mb-2">{player.name}</div>
                    <div className="text-yellow-400 text-lg font-semibold">
                      {player.gamesWon} / {player.gamesPlayed} Vittorie
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-gray-200">
                    <div className="flex justify-between items-center">
                      <span>Tiri eseguiti:</span>
                      <span className="font-bold text-white">{player.totalShots}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Palle imbucate:</span>
                      <span className="font-bold text-white">{player.totalPocketed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Precisione:</span>
                      <span className="font-bold text-yellow-400">{player.accuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Win Rate:</span>
                      <span className="font-bold text-yellow-400">{player.winRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tempo di gioco totale:</span>
                      <span className="font-bold text-white">{formatTime(player.totalGameTime || 0)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div className="text-center">
                        <div className="font-bold text-white">{player.gamesPlayed}</div>
                        <div>Partite</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white">{player.gamesWon}</div>
                        <div>Vinte</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pulsanti Azione */}
        <div className="max-w-2xl mx-auto mt-12 mb-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={downloadStatsPDF}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              <BarChart3 size={24} />
              Scarica PDF
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 shadow-xl"
            >
              🗑️ Azzera Statistiche
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'rules') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-2xl font-bold text-white hover:text-yellow-400 transition"
              >
                🎱 Sfida Biliardo
              </button>
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-gray-200 hover:text-white transition"
              >
                ← Indietro
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">📖 Regole del Biliardo</h1>
            <p className="text-xl text-gray-200">Palla 8 - Le basi che devi conoscere</p>
          </div>

          {/* Obiettivo */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-8 mb-8 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🎯</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Obiettivo del Gioco</h2>
                <p className="text-gray-800 text-lg mt-2">
                  Imbuca tutte le tue palle (intere o spezzate) e poi la palla 8 nera per vincere!
                </p>
              </div>
            </div>
          </div>

          {/* Setup */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">🔺</div>
              <h2 className="text-3xl font-bold text-white">Setup Iniziale</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">Le Palle</h3>
                <div className="space-y-2 text-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚫</span>
                    <span><strong>Palle Intere (1-7):</strong> completamente colorate</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚪</span>
                    <span><strong>Palle Spezzate (9-15):</strong> striscia centrale colorata</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎱</span>
                    <span><strong>Palla 8:</strong> completamente nera (obiettivo finale)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚪</span>
                    <span><strong>Palla bianca:</strong> battente (colpita con la stecca)</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">Disposizione</h3>
                <div className="text-gray-200 space-y-2">
                  <p>• Le 15 palle colorate vanno disposte <strong>a triangolo</strong></p>
                  <p>• La <strong>palla 8</strong> deve stare <strong>al centro</strong> del triangolo</p>
                  <p>• Il triangolo va posizionato nella metà opposta del tavolo</p>
                  <p>• La palla bianca si posiziona dove vuoi nella tua metà</p>
                </div>
              </div>
            </div>
          </div>

          {/* Regole Base */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">📋</div>
              <h2 className="text-3xl font-bold text-white">Regole Fondamentali</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">✅</span>
                  <h3 className="text-2xl font-bold text-white">Cosa FARE</h3>
                </div>
                <ul className="space-y-3 text-white">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">1.</span>
                    <span>Colpisci sempre <strong>prima</strong> le tue palle con la bianca</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">2.</span>
                    <span>Se imbuchi una tua palla, continui a tirare</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">3.</span>
                    <span>Finisci TUTTE le tue palle prima di imbucare la 8</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">4.</span>
                    <span>La palla 8 va imbucata per ULTIMA per vincere</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">❌</span>
                  <h3 className="text-2xl font-bold text-white">Cosa NON FARE (Falli)</h3>
                </div>
                <ul className="space-y-3 text-white">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">1.</span>
                    <span><strong>Non</strong> imbucare la palla bianca (passa il turno)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">2.</span>
                    <span><strong>Non</strong> colpire prima le palle dell'avversario</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">3.</span>
                    <span><strong>Non</strong> far cadere palle fuori dal tavolo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold">4.</span>
                    <span><strong>PERDI</strong> se imbuchi la 8 prima del tempo!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Come si Gioca */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">🎮</div>
              <h2 className="text-3xl font-bold text-white">Come si Gioca</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-yellow-500 text-gray-900 font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl">1</div>
                  <h3 className="text-xl font-bold text-yellow-400">Tiro di Apertura (Break)</h3>
                </div>
                <p className="text-gray-200 ml-13">
                  Il primo giocatore colpisce il triangolo con forza. Se imbuca una palla, continua a giocare. 
                  La prima palla imbucata determina se giochi con le <strong>intere</strong> o le <strong>spezzate</strong>.
                </p>
              </div>

              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-yellow-500 text-gray-900 font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl">2</div>
                  <h3 className="text-xl font-bold text-yellow-400">Turni Successivi</h3>
                </div>
                <p className="text-gray-200 ml-13">
                  Ogni giocatore cerca di imbucare le sue palle. Se ci riesci, continui a tirare. 
                  Se sbagli o fai fallo, <strong>passa il turno</strong> all'avversario.
                </p>
              </div>

              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-yellow-500 text-gray-900 font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl">3</div>
                  <h3 className="text-xl font-bold text-yellow-400">Vittoria</h3>
                </div>
                <p className="text-gray-200 ml-13">
                  Quando hai imbucato tutte le tue palle (1-7 o 9-15), puoi finalmente imbucare la <strong>palla 8 nera</strong>. 
                  Se ci riesci <strong>VINCI</strong> la partita! 🏆
                </p>
              </div>
            </div>
          </div>

          {/* Casi Speciali */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">⚠️</div>
              <h2 className="text-3xl font-bold text-white">Attenzione alla Palla 8!</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-600 bg-opacity-30 border-2 border-green-400 rounded-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-5xl">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-green-400 text-center mb-3">VINCI se...</h3>
                <ul className="space-y-2 text-gray-200">
                  <li>✓ Hai finito tutte le tue palle (1-7 o 9-15)</li>
                  <li>✓ Imbuchi correttamente la palla 8</li>
                  <li>✓ L'avversario fa fallo sulla palla 8</li>
                </ul>
              </div>

              <div className="bg-red-600 bg-opacity-30 border-2 border-red-400 rounded-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-5xl">💀</span>
                </div>
                <h3 className="text-xl font-bold text-red-400 text-center mb-3">PERDI se...</h3>
                <ul className="space-y-2 text-gray-200">
                  <li>✗ Imbuchi la palla 8 prima di finire le tue</li>
                  <li>✗ Imbuchi la palla 8 e contemporaneamente la bianca</li>
                  <li>✗ Fai cadere la palla 8 fuori dal tavolo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">💡</div>
              <h2 className="text-3xl font-bold text-white">Consigli Utili</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <p className="font-semibold">Mira con calma e precisione</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🧠</div>
                <p className="font-semibold">Pensa al posizionamento della bianca</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⏰</div>
                <p className="font-semibold">Non avere fretta, gioca strategico</p>
              </div>
            </div>
          </div>

          {/* Pulsante Torna Indietro */}
          <div className="text-center">
            <button
              onClick={() => setCurrentPage('home')}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-lg px-10 py-4 rounded-lg transition transform hover:scale-105 shadow-xl"
            >
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'trio-submodes') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-2xl font-bold text-white hover:text-yellow-400 transition"
              >
                🎱 Sfida Biliardo
              </button>
              <button 
                onClick={() => setCurrentPage('modes')}
                className="text-gray-200 hover:text-white transition"
              >
                ← Indietro
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Modalità Trio</h2>
            <p className="text-xl text-gray-200">
              Scegli la variante per 3 giocatori
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tutti contro tutti */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-3xl font-bold text-yellow-400 mb-2">Tutti contro tutti</h3>
                <p className="text-gray-300 text-lg mb-1">3 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-3">
                <li>• Partita a punti</li>
                <li>• Palla imbucata = 1 punto</li>
                <li>• Ultima buca → palla 8</li>
                <li>• Classifica diretta</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleTrioSubmodeSelect('trio-ffa')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>

            {/* Palla 9 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎱</div>
                <h3 className="text-3xl font-bold text-yellow-400 mb-2">Palla 9</h3>
                <p className="text-gray-300 text-lg mb-1">3 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-3">
                <li>• Modalità "Palla 9"</li>
                <li>• Imbuca dal numero più basso alla palla 9</li>
                <li>• Vince chi imbuca per primo la palla 9</li>
                <li>• Classifica diretta</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleTrioSubmodeSelect('trio-ball9')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'duo-submodes') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-2xl font-bold text-white hover:text-yellow-400 transition"
              >
                🎱 Sfida Biliardo
              </button>
              <button 
                onClick={() => setCurrentPage('modes')}
                className="text-gray-200 hover:text-white transition"
              >
                ← Indietro
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Modalità Duo</h2>
            <p className="text-xl text-gray-200">
              Scegli la variante per 2 giocatori
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Standard */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-3xl font-bold text-yellow-400 mb-2">Standard</h3>
                <p className="text-gray-300 text-lg mb-1">2 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-3">
                <li>• Sfida 1 vs 1 classica</li>
                <li>• Scegli intere o spezzate</li>
                <li>• Imbuca tutte le tue palle</li>
                <li>• Vince chi imbuca la palla 8</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleDuoSubmodeSelect('duo')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>

            {/* Palla 9 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎱</div>
                <h3 className="text-3xl font-bold text-yellow-400 mb-2">Palla 9</h3>
                <p className="text-gray-300 text-lg mb-1">2 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-3">
                <li>• Modalità "Palla 9"</li>
                <li>• Imbuca dal numero più basso alla palla 9</li>
                <li>• Vince chi imbuca per primo la palla 9</li>
                <li>• Classifica diretta</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleDuoSubmodeSelect('duo-ball9')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'modes') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-2xl font-bold text-white hover:text-yellow-400 transition"
              >
                🎱 Sfida Biliardo
              </button>
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-gray-200 hover:text-white transition"
              >
                ← Indietro
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Modalità</h2>
            <p className="text-xl text-gray-200">
              Scegli il numero di giocatori per la tua partita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-yellow-400 mb-2">Duo</div>
                <p className="text-gray-300 mb-1">2 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-2">
                <li>• Sfida 1 vs 1</li>
                <li>• Sfida "Palla 9"</li>
                <li>• Classifica diretta</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleModeSelect('duo')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-yellow-400 mb-2">Trio</div>
                <p className="text-gray-300 mb-1">3 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-2">
                <li>• Sfida tutti contro tutti</li>
                <li>• Sfida "Palla 9"</li>
                <li>• Classifica diretta</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleModeSelect('trio')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-yellow-400 mb-2">Quartetto</div>
                <p className="text-gray-300 mb-1">4 Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-2">
                <li>• Sfida a squadre da 2</li>
                <li>• Classifica a squadre</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleModeSelect('quartetto')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 hover:bg-opacity-20 transition">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-yellow-400 mb-2">Torneo</div>
                <p className="text-gray-300 mb-1">4+ Giocatori</p>
              </div>
              <ul className="text-gray-200 mb-6 space-y-2">
                <li>• Sfida a più giocatori</li>
                <li>• Classifica diretta</li>
                <li>• Statistiche individuali</li>
              </ul>
              <button 
                onClick={() => handleModeSelect('torneo')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                Seleziona Modalità
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'players') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-2xl font-bold text-white hover:text-yellow-400 transition"
              >
                🎱 Sfida Biliardo
              </button>
              <button 
                onClick={() => setCurrentPage('modes')}
                className="text-gray-200 hover:text-white transition"
              >
                ← Indietro
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Inserisci i Giocatori
            </h2>
            <p className="text-xl text-gray-200">
              Modalità: <span className="text-yellow-400 font-bold">{modes[selectedMode].name}</span>
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
            <div className="mb-6 bg-white bg-opacity-10 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 text-center">Legenda</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold text-white text-xs">
                    1
                  </div>
                  <span className="text-gray-200">Giocatore tracciato - Le statistiche verranno salvate</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center font-bold text-white text-xs">
                    1
                  </div>
                  <span className="text-gray-200">Giocatore non tracciato - Statistiche solo di questa partita</span>
                </div>
              </div>
              <p className="text-yellow-400 text-xs mt-3 text-center">
                💡 Clicca sul numero per attivare/disattivare il tracciamento
              </p>
            </div>

            <div className="space-y-4">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTracking(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all transform hover:scale-110 ${
                      trackedPlayers[index] 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                        : 'bg-gray-400 text-white'
                    }`}
                    title={trackedPlayers[index] ? 'Tracciamento attivo' : 'Tracciamento disattivato'}
                  >
                    {index + 1}
                  </button>
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={`Nome Giocatore ${index + 1}`}
                    className="flex-1 bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:border-yellow-400 transition"
                  />
                  {selectedMode === 'torneo' && players.length > 4 && (
                    <button
                      onClick={() => removePlayer(index)}
                      className="flex-shrink-0 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-lg text-white font-bold transition"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selectedMode === 'torneo' && (
              <button
                onClick={addPlayer}
                className="w-full mt-6 bg-white bg-opacity-20 hover:bg-opacity-30 border-2 border-dashed border-white border-opacity-50 rounded-lg py-3 text-white font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus size={20} />
                + Aggiungi giocatore
              </button>
            )}

            <button
              onClick={startGame}
              className="w-full mt-8 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-xl py-4 rounded-lg transition transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              Inizia!
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'game' && gameState && !gameState.isFinished) {
    const currentPlayer = gameState.players[currentPlayerIndex];
    const stats = calculateStats(currentPlayer);
    
    const allBallsPocketed = remainingBalls.solid.length === 0 && remainingBalls.striped.length === 0;
    
    // Per Trio FFA: controlla se il giocatore corrente ha imbucato tutte le 14 palle
    const currentPlayerCanPocket8 = selectedMode === 'trio-ffa' && allBallsPocketed;
    
    // Per Palla 9: trova la palla più bassa
    const lowestBall = (selectedMode === 'trio-ball9' || selectedMode === 'duo-ball9') ? Math.min(...ball9Remaining) : null;
    
    // Controlla se il giocatore corrente ha finito le sue palle (per modalità normali)
    const currentPlayerBallsFinished = ballType === 'solid' 
      ? remainingBalls.solid.length === 0 
      : ballType === 'striped' 
        ? remainingBalls.striped.length === 0 
        : false;

    const getBallColor = (number) => {
      const colors = {
        1: '#FFD700', 2: '#1E90FF', 3: '#DC143C', 4: '#9370DB',
        5: '#FF8C00', 6: '#228B22', 7: '#8B4513', 8: '#000000',
        9: '#FFD700', 10: '#1E90FF', 11: '#DC143C', 12: '#9370DB',
        13: '#FF8C00', 14: '#228B22', 15: '#8B4513'
      };
      return colors[number];
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="text-2xl font-bold text-white">🎱 Partita in Corso</span>
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 font-bold">⏱️ {formatTime(gameTime)}</span>
                <span className="text-gray-200">{modes[gameState.mode].name}</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="text-xl text-gray-200 mb-2">Turno di:</div>
            <div className="text-5xl font-bold text-yellow-400 mb-4">{currentPlayer.name}</div>
            <div className="text-gray-200">
              Tiri: {currentPlayer.shots} | Imbucate: {currentPlayer.pocketed} | Precisione: {stats.accuracy}%
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-8">
            {(selectedMode === 'trio-ball9' || selectedMode === 'duo-ball9') ? (
              // Modalità Palla 9 - Mostra palle dall'1 alla 9
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white text-center mb-4">
                  Palle dall'1 alla 9
                </h3>
                <div className="bg-yellow-500 bg-opacity-20 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 text-center font-bold">
                    ⚠️ Colpisci SOLO la palla più bassa: <span className="text-3xl">{lowestBall}</span>
                  </p>
                  <p className="text-gray-200 text-center text-sm mt-2">
                    Se imbuchi la palla 9 (anche per combinazione) VINCI la partita!
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4 justify-items-center">
                  {ball9Remaining.map(ball => (
                    <button
                      key={ball}
                      onClick={() => pocketBall(ball)}
                      className={`w-16 h-16 rounded-full font-bold text-2xl transition transform shadow-xl relative flex items-center justify-center overflow-hidden ${
                        ball === lowestBall 
                          ? 'hover:scale-125 ring-4 ring-yellow-400 animate-pulse' 
                          : ball === 9 
                            ? 'hover:scale-110 ring-2 ring-green-400'
                            : 'hover:scale-110 opacity-60'
                      }`}
                      style={{
                        backgroundColor: ball === 9 ? '#FFD700' : getBallColor(ball),
                        color: (ball >= 5 && ball <= 7 || ball === 8) ? 'white' : 'black',
                        border: '2px solid #333'
                      }}
                    >
                      <span className="relative z-10 font-bold">
                        {ball}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedMode === 'trio-ffa' ? (
              // Modalità Trio FFA - Mostra tutte le palle
              allBallsPocketed ? (
                // Mostra palla 8 quando tutte le altre sono finite
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-12">
                  <h3 className="text-3xl font-bold text-white text-center mb-8">
                    🏆 Imbuca la palla 8 per chiudere la partita!
                  </h3>
                  <div className="flex justify-center">
                    <button
                      onClick={pocket8Ball}
                      className="w-40 h-40 rounded-full font-bold text-6xl transition transform hover:scale-110 shadow-2xl bg-black text-white border-4 border-white"
                    >
                      8
                    </button>
                  </div>
                </div>
              ) : (
                // Mostra tutte le palle (intere e spezzate insieme)
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white text-center mb-6">
                    Tutte le Palle Disponibili
                  </h3>
                  
                  {/* Palle Intere */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-yellow-400 mb-3 text-center">Palle Intere</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 justify-items-center">
                      {remainingBalls.solid.map(ball => (
                        <button
                          key={ball}
                          onClick={() => pocketBall(ball)}
                          className="w-16 h-16 rounded-full font-bold text-2xl transition transform hover:scale-110 shadow-xl relative flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundColor: getBallColor(ball),
                            color: (ball >= 5 && ball <= 7 || ball === 8) ? 'white' : 'black',
                            border: '2px solid #333'
                          }}
                        >
                          <span className="relative z-10 font-bold">
                            {ball}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Palle Spezzate */}
                  <div>
                    <h4 className="text-lg font-bold text-blue-400 mb-3 text-center">Palle Spezzate</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 justify-items-center">
                      {remainingBalls.striped.map(ball => (
                        <button
                          key={ball}
                          onClick={() => pocketBall(ball)}
                          className="w-16 h-16 rounded-full font-bold text-2xl transition transform hover:scale-110 shadow-xl relative flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundColor: 'white',
                            border: '2px solid #333'
                          }}
                        >
                          <div 
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                              background: `linear-gradient(to bottom, 
                                white 0%, 
                                white 20%, 
                                ${getBallColor(ball)} 20%, 
                                ${getBallColor(ball)} 80%, 
                                white 80%, 
                                white 100%)`
                            }}
                          />
                          <span 
                            className="relative z-10 font-bold" 
                            style={{
                              textShadow: '0 0 3px white, 0 0 5px white',
                              color: '#000'
                            }}
                          >
                            {ball}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : ballType === null ? (
              // Selezione iniziale tipo di palle
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white text-center mb-6">
                  Seleziona il tipo di palle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setBallType('solid')}
                    className="bg-gradient-to-br from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white font-bold text-xl py-12 rounded-xl transition transform hover:scale-105 shadow-xl"
                  >
                    <div className="text-4xl mb-3">⚫</div>
                    <div>Palle Intere</div>
                    <div className="text-sm mt-2 opacity-90">(1-7)</div>
                  </button>
                  <button
                    onClick={() => setBallType('striped')}
                    className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-xl py-12 rounded-xl transition transform hover:scale-105 shadow-xl"
                  >
                    <div className="text-4xl mb-3">⚪</div>
                    <div>Palle Spezzate</div>
                    <div className="text-sm mt-2 opacity-90">(9-15)</div>
                  </button>
                </div>
                <p className="text-center text-gray-300 mt-6 text-sm">
                  💡 Oppure premi "Passa Turno" per passare senza scegliere
                </p>
              </div>
            ) : currentPlayerBallsFinished ? (
              // Mostra palla 8 quando il giocatore ha finito le sue palle
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-12">
                <h3 className="text-3xl font-bold text-white text-center mb-8">
                  🏆 Imbuca la palla 8 per vincere!
                </h3>
                <div className="flex justify-center">
                  <button
                    onClick={pocket8Ball}
                    className="w-40 h-40 rounded-full font-bold text-6xl transition transform hover:scale-110 shadow-2xl bg-black text-white border-4 border-white"
                  >
                    8
                  </button>
                </div>
              </div>
            ) : (
              // Visualizzazione palle da imbucare
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white text-center mb-6">
                  {ballType === 'solid' ? 'Palle Intere' : 'Palle Spezzate'}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
                  {(ballType === 'solid' ? remainingBalls.solid : remainingBalls.striped).map(ball => (
                    <button
                      key={ball}
                      onClick={() => pocketBall(ball)}
                      className="aspect-square rounded-full font-bold text-2xl transition transform hover:scale-110 shadow-xl relative flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: ballType === 'solid' ? getBallColor(ball) : 'white',
                        color: ballType === 'solid' && (ball >= 5 && ball <= 7 || ball === 8) ? 'white' : 'black',
                        border: '2px solid #333'
                      }}
                    >
                      {ballType === 'striped' && (
                        <>
                          {/* Striscia colorata centrale (60% altezza) */}
                          <div 
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                              background: `linear-gradient(to bottom, 
                                white 0%, 
                                white 20%, 
                                ${getBallColor(ball)} 20%, 
                                ${getBallColor(ball)} 80%, 
                                white 80%, 
                                white 100%)`
                            }}
                          >
                          </div>
                        </>
                      )}
                      <span className="relative z-10 font-bold" style={{
                        textShadow: ballType === 'striped' ? '0 0 3px white, 0 0 5px white' : 'none',
                        color: ballType === 'striped' ? '#000' : (ball >= 5 && ball <= 7 ? 'white' : 'black')
                      }}>
                        {ball}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <button
              onClick={nextPlayer}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-xl py-4 rounded-xl transition transform hover:scale-105 shadow-xl"
            >
              Passa Turno (Tiro Mancato)
            </button>
            
            {/* Mostra il pulsante Fallo solo se NON è modalità Palla 9 */}
            {selectedMode !== 'trio-ball9' && selectedMode !== 'duo-ball9' && (
              <button
                onClick={foul8Ball}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-4 rounded-xl transition transform hover:scale-105 shadow-xl border-2 border-red-400"
              >
                ⚠️ 8 in Buca (Fallo - Perdi la partita)
              </button>
            )}

            {/* Pulsante Indietro per Duo e Trio */}
            {(selectedMode === 'duo' || selectedMode === 'duo-ball9' || selectedMode === 'trio-ffa' || selectedMode === 'trio-ball9') && (
              <button
                onClick={undoLastAction}
                disabled={actionHistory.length === 0}
                className={`w-full font-bold text-xl py-4 rounded-xl transition transform shadow-xl border-2 ${
                  actionHistory.length === 0
                    ? 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400 hover:scale-105'
                }`}
              >
                ← Indietro ({actionHistory.length})
              </button>
            )}
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mt-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Classifica Live</h3>
            <div className="space-y-4">
              {gameState.players
                .map((p, idx) => ({ ...p, originalIndex: idx }))
                .sort((a, b) => b.pocketed - a.pocketed)
                .map((player, rank) => {
                  const playerStats = calculateStats(player);
                  return (
                    <div 
                      key={player.name}
                      className={`flex items-center justify-between p-4 rounded-lg transition ${
                        player.currentTurn 
                          ? 'bg-yellow-500 bg-opacity-30 border-2 border-yellow-400' 
                          : 'bg-white bg-opacity-5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-yellow-400">#{rank + 1}</div>
                        <div>
                          <div className="text-xl font-bold text-white">{player.name}</div>
                          <div className="text-sm text-gray-300">
                            Precisione: {playerStats.accuracy}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{player.pocketed}</div>
                        <div className="text-sm text-gray-300">{player.shots} tiri</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'results' && gameState && gameState.isFinished) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.pocketed - a.pocketed);

    if (showMatchStats) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
          <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <span className="text-2xl font-bold text-white">📊 Statistiche Partita</span>
                <button 
                  onClick={() => setShowMatchStats(false)}
                  className="text-gray-200 hover:text-white transition"
                >
                  ← Indietro ai Risultati
                </button>
              </div>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Statistiche Dettagliate
              </h2>
              <p className="text-xl text-gray-200">
                Modalità: <span className="text-yellow-400 font-bold">{modes[gameState.mode].name}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {gameState.players.map((player, index) => {
                const stats = calculateStats(player);
                const isTracked = trackedPlayers[index];
                return (
                  <div 
                    key={player.name}
                    className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 relative"
                  >
                    {isTracked && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <span>✓</span>
                          <span>Tracciato</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-3xl font-bold text-white mb-2">{player.name}</h3>
                      {player.name === gameState.winner && (
                        <div className="text-yellow-400 text-lg font-semibold">
                          🏆 Vincitore
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                        <div className="text-4xl font-bold text-yellow-400">{player.shots}</div>
                        <div className="text-sm text-gray-300 mt-1">Tiri Eseguiti</div>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                        <div className="text-4xl font-bold text-yellow-400">{player.pocketed}</div>
                        <div className="text-sm text-gray-300 mt-1">Palle Imbucate</div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
                      <div className="text-5xl font-bold text-white mb-1">{stats.accuracy}%</div>
                      <div className="text-sm text-gray-300">Precisione</div>
                      <div className="text-xs text-gray-400 mt-2">
                        (Palle imbucate / Tiri eseguiti)
                      </div>
                    </div>

                    {player.shots > 0 && (
                      <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                        <div className="text-sm text-gray-300 space-y-1">
                          <div className="flex justify-between">
                            <span>Tiri riusciti:</span>
                            <span className="text-green-400 font-semibold">{player.pocketed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tiri mancati:</span>
                            <span className="text-red-400 font-semibold">{player.shots - player.pocketed}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                Riepilogo Partita
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {gameState.players.reduce((sum, p) => sum + p.shots, 0)}
                  </div>
                  <div className="text-gray-300">Tiri Totali</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {gameState.players.reduce((sum, p) => sum + p.pocketed, 0)}
                  </div>
                  <div className="text-gray-300">Palle Imbucate Totali</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {gameState.players.reduce((sum, p) => sum + p.shots, 0) > 0
                      ? ((gameState.players.reduce((sum, p) => sum + p.pocketed, 0) / 
                         gameState.players.reduce((sum, p) => sum + p.shots, 0)) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-gray-300">Precisione Media Partita</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {formatTime(gameState.duration || 0)}
                  </div>
                  <div className="text-gray-300">Durata Partita</div>
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowMatchStats(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-4 rounded-lg transition"
              >
                ← Torna ai Risultati
              </button>
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setGameState(null);
                  setShowMatchStats(false);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 rounded-lg transition transform hover:scale-105"
              >
                Torna alla Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <nav className="bg-green-950 bg-opacity-50 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="text-2xl font-bold text-white">🎱 Risultati Partita</span>
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-gray-200 hover:text-white transition"
              >
                Home →
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-5xl font-bold text-yellow-400 mb-2">{gameState.winner}</h2>
            <p className="text-2xl text-white">Ha vinto la partita!</p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <h3 className="text-3xl font-bold text-white text-center mb-8">Classifica Finale</h3>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">🏆 Vincitore</div>
                  <div className="text-xl text-white mt-2">{gameState.winner}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-300">Tiri Totali</div>
                  <div className="text-2xl text-white mt-2">{gameState.players.reduce((sum, p) => sum + p.shots, 0)}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-300">Palle Imbucate</div>
                  <div className="text-2xl text-white mt-2">{gameState.players.reduce((sum, p) => sum + p.pocketed, 0)}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-300">Durata</div>
                  <div className="text-2xl text-white mt-2">⏱️ {formatTime(gameState.duration || 0)}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedPlayers.slice(0, 3).map((player, index) => {
                const stats = calculateStats(player);
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                return (
                  <div 
                    key={player.name}
                    className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center ${
                      index === 0 ? 'transform scale-110 bg-opacity-20' : ''
                    }`}
                  >
                    <div className="text-5xl mb-3">{medal}</div>
                    <div className="text-2xl font-bold text-white mb-4">{player.name}</div>
                    <div className="space-y-2 text-gray-200">
                      <div className="flex justify-between">
                        <span>Palle imbucate:</span>
                        <span className="font-bold text-yellow-400">{player.pocketed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiri totali:</span>
                        <span className="font-bold text-white">{player.shots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precisione:</span>
                        <span className="font-bold text-yellow-400">{stats.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <button
              onClick={() => setShowMatchStats(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <BarChart3 size={24} />
              Statistiche Partita
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setGameState(null);
                  setShowMatchStats(false);
                }}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-4 rounded-lg transition"
              >
                Torna alla Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage('modes');
                  setGameState(null);
                  setShowMatchStats(false);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 rounded-lg transition transform hover:scale-105"
              >
                Nuova Partita
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BiliardoApp;