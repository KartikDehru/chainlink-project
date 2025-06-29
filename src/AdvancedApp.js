import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import advancedContractABI from './advancedContractABI.json';
import './AdvancedApp.css';

// Use the deployed contract address on Sepolia
const CONTRACT_ADDRESS = "0x78F01c2aE96F13c67FA13c0CDAA280CDD8d82341"; // Enhanced contract on Sepolia

function AdvancedApp() {
  // Core state
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Contract data
  const [assets, setAssets] = useState([]);
  const [timeWindows, setTimeWindows] = useState([]);
  const [predictionTypes, setPredictionTypes] = useState([]);
  const [prices, setPrices] = useState({});
  const [userStats, setUserStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Active predictions
  const [activePredictions, setActivePredictions] = useState([]);
  const [resolvedPredictions, setResolvedPredictions] = useState([]);
  const [maxActivePredictions, setMaxActivePredictions] = useState(10);
  
  // UI state
  const [activeTab, setActiveTab] = useState('predict');
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Single prediction form
  const [selectedAsset, setSelectedAsset] = useState(0);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(0);
  const [selectedPredictionType, setSelectedPredictionType] = useState(0);
  const [betAmount, setBetAmount] = useState('0.001');
  const [direction, setDirection] = useState(true); // true = up, false = down
  const [targetPrice, setTargetPrice] = useState('');
  
  // Batch prediction form
  const [batchPredictions, setBatchPredictions] = useState([
    { asset: 0, timeWindow: 0, predictionType: 0, amount: '0.001', direction: true, targetPrice: '' }
  ]);
  
  // Initialize wallet connection
  useEffect(() => {
    checkIfWalletIsConnected();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  // Auto-refresh data
  useEffect(() => {
    if (autoRefresh && contract) {
      const interval = setInterval(() => {
        loadContractData();
        updatePrices();
        loadUserPredictions();
      }, 10000); // Update every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, contract]);
  
  // Load initial data when contract is available
  useEffect(() => {
    if (contract) {
      loadContractData();
      loadUserPredictions();
      loadUserStats();
      loadLeaderboard();
    }
  }, [contract]);
  
  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await initializeContract();
      }
    } catch (error) {
      setError('Error connecting to wallet: ' + error.message);
    }
  };
  
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await initializeContract();
      setError('');
    } catch (error) {
      setError('Error connecting wallet: ' + error.message);
    }
  };
  
  const initializeContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, advancedContractABI, signer);
      setContract(contract);
      setProvider(provider);
    } catch (error) {
      setError('Error initializing contract: ' + error.message);
    }
  };
  
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount('');
      setContract(null);
    } else {
      setAccount(accounts[0]);
      initializeContract();
    }
  };
  
  const loadContractData = async () => {
    if (!contract) return;
    
    try {
      // Load assets
      const assetCount = await contract.assetCount();
      const assetsData = [];
      for (let i = 0; i < assetCount; i++) {
        const asset = await contract.assets(i);
        assetsData.push({
          id: i,
          symbol: asset[0],
          priceFeed: asset[1],
          decimals: asset[2],
          isActive: asset[3],
          totalPredictions: asset[4].toString(),
          totalVolume: ethers.formatEther(asset[5])
        });
      }
      setAssets(assetsData);
      
      // Load time windows
      const timeWindowCount = await contract.timeWindowCount();
      const timeWindowsData = [];
      for (let i = 0; i < timeWindowCount; i++) {
        const timeWindow = await contract.timeWindows(i);
        timeWindowsData.push({
          id: i,
          name: timeWindow[0],
          duration: timeWindow[1].toString(),
          isActive: timeWindow[2],
          multiplier: (Number(timeWindow[3]) / 10000).toFixed(2)
        });
      }
      setTimeWindows(timeWindowsData);
      
      // Load prediction types
      const predictionTypeCount = await contract.predictionTypeCount();
      const predictionTypesData = [];
      for (let i = 0; i < predictionTypeCount; i++) {
        const predType = await contract.predictionTypes(i);
        predictionTypesData.push({
          id: i,
          name: predType[0],
          isActive: predType[1],
          minBet: ethers.formatEther(predType[2]),
          maxBet: ethers.formatEther(predType[3]),
          rewardMultiplier: (Number(predType[4]) / 10000).toFixed(2)
        });
      }
      setPredictionTypes(predictionTypesData);
      
      // Load max active predictions
      const maxActive = await contract.maxActivePredictions();        setMaxActivePredictions(Number(maxActive));
      
      // Update prices
      await updatePrices();
      
    } catch (error) {
      console.error('Error loading contract data:', error);
      setError('Error loading contract data: ' + error.message);
    }
  };
  
  const updatePrices = async () => {
    if (!contract || assets.length === 0) return;
    
    try {
      const pricesData = {};        for (const asset of assets) {
          if (asset.isActive) {
            const price = await contract.getCurrentPrice(asset.id);
            pricesData[asset.id] = {
              current: (Number(price) / Math.pow(10, asset.decimals)).toFixed(4),
              timestamp: Date.now()
            };
          }
        }
      setPrices(pricesData);
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };
  
  const loadUserPredictions = async () => {
    if (!contract || !account) return;
    
    try {
      const activePredIds = await contract.getActivePredictions(account);
      const allUserPredIds = await contract.getUserPredictions(account);
      
      const activePreds = [];
      const resolvedPreds = [];
      
      for (const predId of allUserPredIds) {
        const prediction = await contract.predictions(predId);
        const predData = {
          id: predId.toString(),
          user: prediction[0],
          assetId: prediction[1],
          timeWindowId: prediction[2],
          predictionTypeId: prediction[3],
          amount: ethers.formatEther(prediction[4]),
          startPrice: (prediction[5] / (10n ** BigInt(8))).toString(),
          targetPrice: prediction[6] !== 0n ? (prediction[6] / (10n ** BigInt(8))).toString() : null,
          isUp: prediction[7],
          timestamp: new Date(Number(prediction[8]) * 1000),
          endTime: new Date(Number(prediction[9]) * 1000),
          resolved: prediction[10],
          won: prediction[11],
          reward: ethers.formatEther(prediction[12])
        };
        
        if (predData.resolved) {
          resolvedPreds.push(predData);
        } else {
          activePreds.push(predData);
        }
      }
      
      setActivePredictions(activePreds);
      setResolvedPredictions(resolvedPreds);
    } catch (error) {
      console.error('Error loading user predictions:', error);
    }
  };
  
  const loadUserStats = async () => {
    if (!contract || !account) return;
    
    try {
      const stats = await contract.userStats(account);
      setUserStats({
        totalPredictions: stats[0].toString(),
        winCount: stats[1].toString(),
        totalBet: ethers.formatEther(stats[2]),
        totalWon: ethers.formatEther(stats[3]),
        winStreak: stats[4].toString(),
        maxWinStreak: stats[5].toString(),
        winRate: Number(stats[0]) > 0 ? ((Number(stats[1]) / Number(stats[0])) * 100).toFixed(1) : '0.0'
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };
  
  const loadLeaderboard = async () => {
    if (!contract) return;
    
    try {
      const leaders = await contract.getLeaderboard();
      const leaderboardData = [];
      
      for (let i = 0; i < leaders.length; i++) {
        if (leaders[i] !== ethers.ZeroAddress) {
          const stats = await contract.userStats(leaders[i]);
          leaderboardData.push({
            rank: i + 1,
            address: leaders[i],
            totalWon: ethers.formatEther(stats[3]),
            winCount: stats[1].toString(),
            winRate: Number(stats[0]) > 0 ? ((Number(stats[1]) / Number(stats[0])) * 100).toFixed(1) : '0.0'
          });
        }
      }
      
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };
  
  const makeSinglePrediction = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setError('');
      
      const asset = assets[selectedAsset];
      const predType = predictionTypes[selectedPredictionType];
      const amount = ethers.parseEther(betAmount);
      
      // Validate bet amount
      const minBet = ethers.parseEther(predType.minBet);
      const maxBet = ethers.parseEther(predType.maxBet);
      
      if (amount.lt(minBet) || amount.gt(maxBet)) {
        throw new Error(`Bet amount must be between ${predType.minBet} and ${predType.maxBet} ETH`);
      }
      
      // Check if user has too many active predictions
      if (activePredictions.length >= maxActivePredictions) {
        throw new Error(`You can only have ${maxActivePredictions} active predictions at once`);
      }
      
      const targetPriceWei = targetPrice ? 
        BigInt(Math.floor(parseFloat(targetPrice) * Math.pow(10, asset.decimals))) : 
        0n;
      
      const tx = await contract.makePrediction(
        selectedAsset,
        selectedTimeWindow,
        selectedPredictionType,
        direction,
        targetPriceWei,
        { value: amount }
      );
      
      await tx.wait();
      setSuccess('Prediction made successfully!');
      
      // Reset form
      setBetAmount('0.001');
      setTargetPrice('');
      
      // Reload data
      await loadUserPredictions();
      await loadUserStats();
      
    } catch (error) {
      setError('Error making prediction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const makeBatchPredictions = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setError('');
      
      const assetIds = batchPredictions.map(p => p.asset);
      const timeWindowIds = batchPredictions.map(p => p.timeWindow);
      const predictionTypeIds = batchPredictions.map(p => p.predictionType);
      const directions = batchPredictions.map(p => p.direction);
      const amounts = batchPredictions.map(p => ethers.parseEther(p.amount));
      
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);
      
      const tx = await contract.makeBatchPredictions(
        assetIds,
        timeWindowIds,
        predictionTypeIds,
        directions,
        amounts,
        { value: totalAmount }
      );
      
      await tx.wait();
      setSuccess(`${batchPredictions.length} predictions made successfully!`);
      
      // Reset batch form
      setBatchPredictions([
        { asset: 0, timeWindow: 0, predictionType: 0, amount: '0.001', direction: true, targetPrice: '' }
      ]);
      
      // Reload data
      await loadUserPredictions();
      await loadUserStats();
      
    } catch (error) {
      setError('Error making batch predictions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resolvePrediction = async (predictionId) => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const tx = await contract.resolvePrediction(predictionId);
      await tx.wait();
      setSuccess('Prediction resolved!');
      
      await loadUserPredictions();
      await loadUserStats();
      await loadLeaderboard();
    } catch (error) {
      setError('Error resolving prediction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const addBatchPrediction = () => {
    if (batchPredictions.length < 10) {
      setBatchPredictions([
        ...batchPredictions,
        { asset: 0, timeWindow: 0, predictionType: 0, amount: '0.001', direction: true, targetPrice: '' }
      ]);
    }
  };
  
  const removeBatchPrediction = (index) => {
    setBatchPredictions(batchPredictions.filter((_, i) => i !== index));
  };
  
  const updateBatchPrediction = (index, field, value) => {
    const updated = [...batchPredictions];
    updated[index][field] = value;
    setBatchPredictions(updated);
  };
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  
  if (!account) {
    return (
      <div className="advanced-app">
        <div className="connect-wallet-container">
          <h1>🔮 Advanced Chainlink Price Prediction DApp</h1>
          <p>Connect your wallet to start making predictions on multiple crypto assets!</p>
          <button onClick={connectWallet} className="connect-button">
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="advanced-app">
      <header className="app-header">
        <h1>🔮 Advanced Price Prediction DApp</h1>
        <div className="header-info">
          <span className="account">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <label className="auto-refresh">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <nav className="app-nav">
        <button 
          className={activeTab === 'predict' ? 'active' : ''} 
          onClick={() => setActiveTab('predict')}
        >
          Make Predictions
        </button>
        <button 
          className={activeTab === 'active' ? 'active' : ''} 
          onClick={() => setActiveTab('active')}
        >
          Active ({activePredictions.length}/{maxActivePredictions})
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          History ({resolvedPredictions.length})
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''} 
          onClick={() => setActiveTab('stats')}
        >
          Stats & Leaderboard
        </button>
      </nav>
      
      <main className="app-main">
        {activeTab === 'predict' && (
          <div className="predict-section">
            <div className="prediction-mode">
              <button 
                className={!showBatchMode ? 'active' : ''} 
                onClick={() => setShowBatchMode(false)}
              >
                Single Prediction
              </button>
              <button 
                className={showBatchMode ? 'active' : ''} 
                onClick={() => setShowBatchMode(true)}
              >
                Batch Predictions (up to 10)
              </button>
            </div>
            
            {/* Market Overview */}
            <div className="market-overview">
              <h3>📊 Live Market Prices</h3>
              <div className="price-grid">
                {assets.map(asset => (
                  <div key={asset.id} className="price-card">
                    <div className="asset-symbol">{asset.symbol}</div>
                    <div className="asset-price">
                      ${prices[asset.id]?.current || 'Loading...'}
                    </div>
                    <div className="asset-stats">
                      {asset.totalPredictions} predictions
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {!showBatchMode ? (
              // Single Prediction Form
              <div className="single-prediction-form">
                <h3>🎯 Make a Single Prediction</h3>
                
                <div className="form-group">
                  <label>Asset:</label>
                  <select value={selectedAsset} onChange={(e) => setSelectedAsset(parseInt(e.target.value))}>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.symbol} (${prices[asset.id]?.current || 'Loading...'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Time Window:</label>
                  <select value={selectedTimeWindow} onChange={(e) => setSelectedTimeWindow(parseInt(e.target.value))}>
                    {timeWindows.map(window => (
                      <option key={window.id} value={window.id}>
                        {window.name} ({window.multiplier}x multiplier)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Prediction Type:</label>
                  <select value={selectedPredictionType} onChange={(e) => setSelectedPredictionType(parseInt(e.target.value))}>
                    {predictionTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.rewardMultiplier}x reward, {type.minBet}-{type.maxBet} ETH)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Bet Amount (ETH):</label>
                  <input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(e.target.value)}
                    min={predictionTypes[selectedPredictionType]?.minBet || '0.001'}
                    max={predictionTypes[selectedPredictionType]?.maxBet || '1'}
                    step="0.001"
                  />
                </div>
                
                <div className="form-group">
                  <label>Direction:</label>
                  <div className="direction-buttons">
                    <button 
                      className={direction ? 'active up' : 'up'} 
                      onClick={() => setDirection(true)}
                    >
                      📈 UP
                    </button>
                    <button 
                      className={!direction ? 'active down' : 'down'} 
                      onClick={() => setDirection(false)}
                    >
                      📉 DOWN
                    </button>
                  </div>
                </div>
                
                {predictionTypes[selectedPredictionType]?.name === 'Target Price' && (
                  <div className="form-group">
                    <label>Target Price ($):</label>
                    <input 
                      type="number" 
                      value={targetPrice} 
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="Enter target price"
                      step="0.01"
                    />
                  </div>
                )}
                
                <button 
                  onClick={makeSinglePrediction} 
                  disabled={loading || activePredictions.length >= maxActivePredictions}
                  className="make-prediction-button"
                >
                  {loading ? 'Processing...' : `Make Prediction (${betAmount} ETH)`}
                </button>
              </div>
            ) : (
              // Batch Prediction Form
              <div className="batch-prediction-form">
                <h3>⚡ Make Batch Predictions</h3>
                
                {batchPredictions.map((pred, index) => (
                  <div key={index} className="batch-prediction-item">
                    <div className="batch-header">
                      <h4>Prediction #{index + 1}</h4>
                      {batchPredictions.length > 1 && (
                        <button onClick={() => removeBatchPrediction(index)} className="remove-button">
                          ❌
                        </button>
                      )}
                    </div>
                    
                    <div className="batch-form-row">
                      <select 
                        value={pred.asset} 
                        onChange={(e) => updateBatchPrediction(index, 'asset', parseInt(e.target.value))}
                      >
                        {assets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.symbol}
                          </option>
                        ))}
                      </select>
                      
                      <select 
                        value={pred.timeWindow} 
                        onChange={(e) => updateBatchPrediction(index, 'timeWindow', parseInt(e.target.value))}
                      >
                        {timeWindows.map(window => (
                          <option key={window.id} value={window.id}>
                            {window.name}
                          </option>
                        ))}
                      </select>
                      
                      <select 
                        value={pred.predictionType} 
                        onChange={(e) => updateBatchPrediction(index, 'predictionType', parseInt(e.target.value))}
                      >
                        {predictionTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        value={pred.amount} 
                        onChange={(e) => updateBatchPrediction(index, 'amount', e.target.value)}
                        min="0.001"
                        step="0.001"
                        placeholder="Amount"
                      />
                      
                      <div className="batch-direction">
                        <button 
                          className={pred.direction ? 'active up' : 'up'} 
                          onClick={() => updateBatchPrediction(index, 'direction', true)}
                        >
                          UP
                        </button>
                        <button 
                          className={!pred.direction ? 'active down' : 'down'} 
                          onClick={() => updateBatchPrediction(index, 'direction', false)}
                        >
                          DOWN
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="batch-actions">
                  <button 
                    onClick={addBatchPrediction} 
                    disabled={batchPredictions.length >= 10}
                    className="add-prediction-button"
                  >
                    ➕ Add Prediction
                  </button>
                  
                  <button 
                    onClick={makeBatchPredictions} 
                    disabled={loading}
                    className="make-batch-button"
                  >
                    {loading ? 'Processing...' : 
                      `Make ${batchPredictions.length} Predictions (${batchPredictions.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(3)} ETH)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'active' && (
          <div className="active-predictions-section">
            <h3>⏳ Active Predictions ({activePredictions.length}/{maxActivePredictions})</h3>
            
            {activePredictions.length === 0 ? (
              <p>No active predictions. Make some predictions to see them here!</p>
            ) : (
              <div className="predictions-grid">
                {activePredictions.map(pred => (
                  <div key={pred.id} className="prediction-card active">
                    <div className="prediction-header">
                      <span className="asset">{assets[pred.assetId]?.symbol}</span>
                      <span className={`direction ${pred.isUp ? 'up' : 'down'}`}>
                        {pred.isUp ? '📈 UP' : '📉 DOWN'}
                      </span>
                    </div>
                    
                    <div className="prediction-details">
                      <div>Amount: {pred.amount} ETH</div>
                      <div>Start: ${pred.startPrice}</div>
                      <div>Current: ${prices[pred.assetId]?.current || 'Loading...'}</div>
                      {pred.targetPrice && <div>Target: ${pred.targetPrice}</div>}
                      <div>Ends: {pred.endTime.toLocaleString()}</div>
                      <div>Type: {predictionTypes[pred.predictionTypeId]?.name}</div>
                    </div>
                    
                    <div className="prediction-actions">
                      {new Date() >= pred.endTime && (
                        <button onClick={() => resolvePrediction(pred.id)} className="resolve-button">
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="history-section">
            <h3>📜 Prediction History ({resolvedPredictions.length})</h3>
            
            {resolvedPredictions.length === 0 ? (
              <p>No resolved predictions yet.</p>
            ) : (
              <div className="predictions-grid">
                {resolvedPredictions.slice(-20).reverse().map(pred => (
                  <div key={pred.id} className={`prediction-card ${pred.won ? 'won' : 'lost'}`}>
                    <div className="prediction-header">
                      <span className="asset">{assets[pred.assetId]?.symbol}</span>
                      <span className={`direction ${pred.isUp ? 'up' : 'down'}`}>
                        {pred.isUp ? '📈 UP' : '📉 DOWN'}
                      </span>
                      <span className={`result ${pred.won ? 'won' : 'lost'}`}>
                        {pred.won ? '✅ WON' : '❌ LOST'}
                      </span>
                    </div>
                    
                    <div className="prediction-details">
                      <div>Bet: {pred.amount} ETH</div>
                      {pred.won && <div>Won: {pred.reward} ETH</div>}
                      <div>Start: ${pred.startPrice}</div>
                      {pred.targetPrice && <div>Target: ${pred.targetPrice}</div>}
                      <div>Ended: {pred.endTime.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="stats-section">
            <div className="user-stats">
              <h3>📊 Your Stats</h3>
              {userStats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{userStats.totalPredictions}</div>
                    <div className="stat-label">Total Predictions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.winCount}</div>
                    <div className="stat-label">Wins</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.winRate}%</div>
                    <div className="stat-label">Win Rate</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{parseFloat(userStats.totalBet).toFixed(4)}</div>
                    <div className="stat-label">Total Bet (ETH)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{parseFloat(userStats.totalWon).toFixed(4)}</div>
                    <div className="stat-label">Total Won (ETH)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.winStreak}</div>
                    <div className="stat-label">Current Streak</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.maxWinStreak}</div>
                    <div className="stat-label">Best Streak</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {(parseFloat(userStats.totalWon) - parseFloat(userStats.totalBet)).toFixed(4)}
                    </div>
                    <div className="stat-label">Net P&L (ETH)</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="leaderboard">
              <h3>🏆 Leaderboard</h3>
              {leaderboard.length === 0 ? (
                <p>No leaderboard data yet.</p>
              ) : (
                <div className="leaderboard-table">
                  <div className="leaderboard-header">
                    <div>Rank</div>
                    <div>Address</div>
                    <div>Total Won</div>
                    <div>Wins</div>
                    <div>Win Rate</div>
                  </div>
                  {leaderboard.map(leader => (
                    <div key={leader.address} className={`leaderboard-row ${leader.address === account ? 'current-user' : ''}`}>
                      <div className="rank">#{leader.rank}</div>
                      <div className="address">
                        {leader.address.slice(0, 8)}...{leader.address.slice(-6)}
                      </div>
                      <div className="total-won">{parseFloat(leader.totalWon).toFixed(4)} ETH</div>
                      <div className="wins">{leader.winCount}</div>
                      <div className="win-rate">{leader.winRate}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdvancedApp;
