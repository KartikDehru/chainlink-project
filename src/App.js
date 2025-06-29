import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from './contractABI.json';

const CONTRACT_ADDRESS = "0x8ec0D1FF87bBA7a2d85a52DfF981869563224139"; // Deployed contract address on Sepolia

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [currentPrice, setCurrentPrice] = useState('0');
  const [betAmount, setBetAmount] = useState('0.001');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkIfWalletIsConnected();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', (chainId) => {
        console.log("Chain changed to:", chainId);
        // If we're not on Sepolia, show an error
        if (chainId !== '0xaa36a7') {
          setError('Please switch to Sepolia testnet');
          setContract(null);
        } else {
          setError('');
          // Reinitialize contract when chain is correct
          initializeContract();
        }
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (contract) {
      fetchCurrentPrice();
      fetchUserPredictions();
      const interval = setInterval(() => {
        fetchCurrentPrice();
        fetchUserPredictions();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [contract, account]);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask to use this application');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await initializeContract();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setError('Failed to connect to wallet');
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await initializeContract();
    } else {
      setAccount('');
      setContract(null);
      setProvider(null);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask to use this application');
        return;
      }

      console.log("Attempting to connect wallet...");
      setError("Connecting to MetaMask...");

      // Request accounts with explicit network switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia's chainId in hex
      }).catch(async (switchError) => {
        // If Sepolia is not added to MetaMask, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/65ca614781bb4ba9a321595b3647ac25'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io/']
                },
              ],
            });
          } catch (addError) {
            console.error("Error adding Sepolia network:", addError);
            setError("Failed to add Sepolia network to MetaMask");
            return;
          }
        } else {
          console.error("Error switching to Sepolia:", switchError);
          setError("Failed to switch to Sepolia network. Please manually switch networks in MetaMask.");
          return;
        }
      });

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await initializeContract();
        setError('');
        console.log("Wallet connected:", accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    }
  };

  const initializeContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      try {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
        
        // Make sure we're on Sepolia
        if (network.chainId !== 11155111n) {
          setError(`Please switch to Sepolia testnet in MetaMask. Current network: ${network.name}`);
          return;
        }
        
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
        
        setProvider(provider);
        setContract(contractInstance);
        console.log("Contract initialized");
      } catch (signerError) {
        console.error("Error getting signer:", signerError);
        setError('Failed to get signer. Please make sure MetaMask is unlocked and connected to Sepolia testnet.');
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      setError('Failed to initialize contract');
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      if (!contract) return;
      
      const price = await contract.getLatestPrice();
      const formattedPrice = ethers.formatUnits(price, 8);
      setCurrentPrice(parseFloat(formattedPrice).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const fetchUserPredictions = async () => {
    try {
      if (!contract || !account) return;
      
      console.log("Fetching predictions for account:", account);
      const predictionIds = await contract.getUserPredictions(account);
      console.log("Prediction IDs:", predictionIds);
      
      if (!predictionIds || predictionIds.length === 0) {
        setPredictions([]);
        return;
      }
      
      const predictionPromises = predictionIds.map(async (id) => {
        try {
          console.log("Fetching prediction details for ID:", id.toString());
          const prediction = await contract.getPrediction(id);
          const canResolve = await contract.canResolve(id);
          
          // Validate that we have all required fields
          if (!prediction) {
            console.error("Empty prediction returned for ID:", id.toString());
            return null;
          }
          
          return {
            id: id.toString(),
            user: prediction.user || ethers.ZeroAddress,
            predictedPrice: prediction.predictedPrice || BigInt(0),
            timestamp: prediction.timestamp || BigInt(0),
            targetTimestamp: prediction.targetTimestamp || BigInt(0),
            betAmount: prediction.betAmount || BigInt(0),
            isHigher: prediction.isHigher || false,
            resolved: prediction.resolved || false,
            won: prediction.won || false,
            canResolve
          };
        } catch (err) {
          console.error("Error fetching prediction details for ID:", id.toString(), err);
          return null;
        }
      });
      
      const userPredictions = await Promise.all(predictionPromises);
      // Filter out any null values from failed prediction fetches
      const validPredictions = userPredictions.filter(pred => pred !== null);
      setPredictions(validPredictions.reverse()); // Show newest first
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    }
  };

  const makePrediction = async (isHigher) => {
    try {
      if (!contract) {
        setError('Contract not initialized. Please connect your wallet.');
        return;
      }
      
      if (!betAmount || parseFloat(betAmount) <= 0) {
        setError('Please enter a valid bet amount (minimum 0.001 ETH)');
        return;
      }
      
      // Validate minimum bet
      if (parseFloat(betAmount) < 0.001) {
        setError('Minimum bet amount is 0.001 ETH');
        return;
      }
      
      setLoading(true);
      setError('Sending transaction, please confirm in MetaMask...');
      
      console.log("Making prediction:", isHigher ? "UP" : "DOWN", "with", betAmount, "ETH");
      
      try {
        const valueInWei = ethers.parseEther(betAmount);
        console.log("Value in wei:", valueInWei.toString());
        
        const tx = await contract.makePrediction(isHigher, {
          value: valueInWei
        });
        
        setError('Transaction submitted. Waiting for confirmation...');
        console.log("Transaction submitted:", tx.hash);
        
        await tx.wait();
        console.log("Transaction confirmed!");
        
        setError('');
        alert('Prediction made successfully! It will resolve in 5 minutes.');
        
        // Refresh predictions
        await fetchUserPredictions();
      } catch (txError) {
        console.error("Transaction error:", txError);
        if (txError.message.includes("user rejected")) {
          setError('Transaction rejected in MetaMask');
        } else if (txError.message.includes("insufficient funds")) {
          setError('Insufficient funds for this transaction');
        } else {
          setError(`Transaction failed: ${txError.message.split('(')[0]}`);
        }
      }
    } catch (error) {
      console.error('Error making prediction:', error);
      setError('Failed to make prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resolvePrediction = async (predictionId) => {
    try {
      setLoading(true);
      const tx = await contract.resolvePrediction(predictionId);
      await tx.wait();
      await fetchUserPredictions();
    } catch (error) {
      console.error('Error resolving prediction:', error);
      setError('Failed to resolve prediction');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'Unknown';
    try {
      return new Date(Number(timestamp) * 1000).toLocaleString();
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">🔗 Chainlink Price Prediction</div>
        <button 
          className="connect-button" 
          onClick={connectWallet}
          disabled={loading}
        >
          {account ? formatAddress(account) : 'Connect Wallet'}
        </button>
      </header>

      <main className="main-content">
        {error && <div className="error">{error}</div>}
        
        {/* Debug Info Panel - Toggle with button */}
        <div className="debug-panel">
          <button 
            onClick={() => document.getElementById('debug-info').style.display = 
                document.getElementById('debug-info').style.display === 'none' ? 'block' : 'none'}
            className="debug-button"
          >
            Show Debug Info
          </button>
          <div id="debug-info" style={{display: 'none'}} className="debug-info">
            <p><strong>Contract Address:</strong> {CONTRACT_ADDRESS}</p>
            <p><strong>Wallet Connected:</strong> {account ? 'Yes' : 'No'}</p>
            <p><strong>Account:</strong> {account || 'Not connected'}</p>
            <p><strong>Network:</strong> Sepolia Testnet (ChainID: 11155111)</p>
            <p><strong>ETH Balance:</strong> <button onClick={async () => {
              if (provider && account) {
                try {
                  const balance = await provider.getBalance(account);
                  alert(`Balance: ${ethers.formatEther(balance)} ETH`);
                } catch (e) {
                  alert(`Error getting balance: ${e.message}`);
                }
              } else {
                alert('Wallet not connected');
              }
            }} className="small-button">Check Balance</button></p>
          </div>
        </div>
        
        <div className="price-display">
          <div className="price-label">Current ETH/USD Price</div>
          <div className="price-value">${currentPrice}</div>
          <div className="price-info">
            <div className="price-info-item">Powered by Chainlink Price Feeds</div>
            <div className="price-info-item">Updated every 10 seconds</div>
          </div>
        </div>

        {account && (
          <div className="prediction-section">
            <h2 className="section-title">Make a Prediction</h2>
            <div className="prediction-form">
              <input
                type="number"
                placeholder="Bet Amount (ETH)"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bet-input"
                min="0.001"
                step="0.001"
              />
              <div className="prediction-buttons">
                <button
                  className="prediction-button higher"
                  onClick={() => makePrediction(true)}
                  disabled={loading || !betAmount}
                >
                  📈 Price will go UP
                </button>
                <button
                  className="prediction-button lower"
                  onClick={() => makePrediction(false)}
                  disabled={loading || !betAmount}
                >
                  📉 Price will go DOWN
                </button>
              </div>
            </div>
          </div>
        )}

        {account && (
          <div className="predictions-history">
            <h2 className="section-title">Your Predictions</h2>
            {loading && <div className="loading">Loading...</div>}
            {predictions.length === 0 && !loading ? (
              <div className="no-predictions">
                No predictions yet. Make your first prediction above!
              </div>
            ) : (
              <div className="predictions-list">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="prediction-item">
                    <div className="prediction-info">
                      <div>
                        <strong>
                          {prediction.isHigher ? '📈 UP' : '📉 DOWN'} 
                        </strong> - {prediction.betAmount && typeof prediction.betAmount !== 'undefined' 
                            ? ethers.formatEther(prediction.betAmount) 
                            : '0.00'} ETH
                      </div>
                      <div>
                        Initial Price: ${prediction.predictedPrice && typeof prediction.predictedPrice !== 'undefined'
                            ? ethers.formatUnits(prediction.predictedPrice, 8)
                            : '0.00'}
                      </div>
                      <div>
                        Made: {formatTimestamp(prediction.timestamp || 0)}
                      </div>
                      <div>
                        Resolves: {formatTimestamp(prediction.targetTimestamp || 0)}
                      </div>
                    </div>
                    <div>
                      {!prediction.resolved && prediction.canResolve && (
                        <button
                          className="resolve-button"
                          onClick={() => resolvePrediction(prediction.id)}
                          disabled={loading}
                        >
                          Resolve
                        </button>
                      )}
                      <div 
                        className={`prediction-status ${
                          !prediction.resolved 
                            ? 'pending' 
                            : prediction.won 
                            ? 'won' 
                            : 'lost'
                        }`}
                      >
                        {!prediction.resolved 
                          ? 'Pending' 
                          : prediction.won 
                          ? 'Won!' 
                          : 'Lost'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!account && (
          <div className="prediction-section">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p style={{color: 'rgba(255,255,255,0.8)', textAlign: 'center'}}>
              Connect your MetaMask wallet to start making price predictions and earn rewards!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
