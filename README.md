# Chainlink Multi-Asset Price Prediction DApp

A decentralized application (DApp) that uses Chainlink Price Feeds to create an advanced price prediction platform where users can bet on multiple cryptocurrency price movements.

## Features

- 🔗 **Chainlink Integration**: Real-time price feeds for multiple assets (ETH/USD, BTC/USD)
- 💰 **Multi-Asset Predictions**: Bet on different cryptocurrency price movements
- ⏱️ **Flexible Time Windows**: Choose between different prediction time frames
- 🎮 **Gamified Experience**: Prediction windows with rewards
- 📱 **Responsive UI**: Beautiful, modern interface
- 🔐 **MetaMask Integration**: Secure wallet connection
- 📊 **Prediction History**: Track your wins and losses across different assets
- 🔄 **Dynamic Updates**: Real-time price updates from Chainlink oracles

## How It Works

1. **Connect Wallet**: Connect your MetaMask wallet to the Sepolia testnet
2. **Select Asset**: Choose from available assets (ETH, BTC)
3. **Select Time Window**: Choose your prediction timeframe
4. **View Current Price**: See real-time prices from Chainlink
5. **Make Prediction**: Choose UP or DOWN and set your bet amount (minimum 0.001 ETH)
6. **Wait**: Predictions resolve after the selected time window
7. **Win Rewards**: Winners get 1.8x their bet amount (10% house edge)

## Quick Setup (5 minutes)

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Git (for deployment)

## Deployment Options

### Local Deployment

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chainlink-price-prediction-dapp.git
   cd chainlink-price-prediction-dapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the local development server:
   ```
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

### Vercel Deployment

1. Push your project to GitHub:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/chainlink-price-prediction-dapp.git
   git push -u origin main
   ```

2. Sign up for a free Vercel account: https://vercel.com/signup

3. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

4. Login to Vercel:
   ```
   vercel login
   ```

5. Deploy to Vercel:
   ```
   npm run deploy:vercel
   ```
   
   Alternatively, you can connect your GitHub repository directly in the Vercel dashboard for automatic deployments.

### Netlify Deployment

1. Sign up for a free Netlify account: https://app.netlify.com/signup

2. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

3. Login to Netlify:
   ```
   netlify login
   ```

4. Deploy to Netlify:
   ```
   npm run deploy:netlify
   ```
- Some test ETH (for Sepolia testnet)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Compile Smart Contract**
   ```bash
   npx hardhat compile
   ```

3. **Deploy to Sepolia Testnet**
   - Get Sepolia ETH from a faucet
   - Update `hardhat.config.js` with your Infura API key and private key
   - Deploy the enhanced contract:
   ```bash
   npx hardhat run scripts/deploy-enhanced.js --network sepolia
   ```

4. **Update Contract Address**
   - The deployed contract address is stored in `enhanced-deployment.json`
   - The frontend reads this address automatically

5. **Start the Frontend**
   ```bash
   npm start
   ```

## Local Development

1. **Start Local Hardhat Node**
   ```bash
   npx hardhat node
   ```

2. **Deploy to Local Network**
   ```bash
   npx hardhat run scripts/deploy-enhanced-local.js --network localhost
   ```

3. **Start React Frontend**
   ```bash
   npm start
   ```

## Contract Details

The `EnhancedPricePredictionDApp.sol` contract features:

- Multiple asset support (ETH/USD, BTC/USD via Chainlink)
- Multiple time windows for predictions
- Owner-configurable settings
- Withdraw functionality for contract owner
- Comprehensive event logging

## Technology Stack

- **Frontend**: React.js
- **Smart Contract**: Solidity
- **Development Framework**: Hardhat
- **Price Oracles**: Chainlink Price Feeds
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Web3 Integration**: ethers.js
- **Wallet**: MetaMask

## Future Enhancements

- Add more Chainlink price feeds (additional assets)
- Implement Chainlink VRF for randomized rewards
- Add Chainlink Automation for automatic prediction resolution
- Create leaderboard using Chainlink Functions

## License

MIT
   - Update `CONTRACT_ADDRESS` in `src/App.js`

5. **Start the Application**
   ```bash
   npm start
   ```

## Local Development

For local testing with Hardhat network:

1. **Start Local Blockchain**
   ```bash
   npx hardhat node
   ```

2. **Deploy Locally**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Add Local Network to MetaMask**
   - Network Name: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

## Project Structure

```
chainlink-project/
├── contracts/              # Smart contracts
│   └── PricePredictionDApp.sol
├── scripts/                 # Deployment scripts
│   └── deploy.js
├── src/                     # React frontend
│   ├── App.js              # Main app component
│   ├── contractABI.json    # Contract ABI
│   └── index.css           # Styles
├── public/                  # Static files
├── hardhat.config.js       # Hardhat configuration
└── package.json            # Dependencies
```

## Smart Contract Details

### PricePredictionDApp.sol
- **Price Feed**: Uses Chainlink ETH/USD price feed
- **Prediction Duration**: 5 minutes (300 seconds)
- **Minimum Bet**: 0.001 ETH
- **Payout**: 1.8x bet amount for winners
- **House Edge**: 10%

### Key Functions
- `getLatestPrice()`: Get current ETH/USD price
- `makePrediction(bool _isHigher)`: Make a price prediction
- `resolvePrediction(uint256 _predictionId)`: Resolve a prediction
- `getUserPredictions(address _user)`: Get user's predictions

## Security Features

- ✅ OpenZeppelin Ownable for access control
- ✅ Minimum bet requirements
- ✅ Time-based prediction resolution
- ✅ Reentrancy protection through proper state management
- ✅ Input validation and error handling

## Testnet Information

- **Network**: Sepolia Testnet
- **Chainlink Price Feed**: ETH/USD (0x694AA1769357215DE4FAC081bf1f309aDC325306)
- **Get Test ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)

## Customization

You can easily customize:
- **Prediction Duration**: Change `PREDICTION_DURATION` in contract
- **Minimum Bet**: Modify `MIN_BET` constant
- **Payout Ratio**: Adjust multiplier in `resolvePrediction`
- **Price Feed**: Use different Chainlink price feeds
- **UI Theme**: Modify CSS variables and colors

## Troubleshooting

### Common Issues

1. **"Price feed not available"**
   - Make sure you're on Sepolia testnet
   - Check Chainlink price feed is working

2. **Transaction Fails**
   - Ensure sufficient ETH balance
   - Check gas fees
   - Verify contract address is correct

3. **MetaMask Not Connecting**
   - Refresh page
   - Check network in MetaMask
   - Try disconnecting and reconnecting

### Support

If you encounter issues:
1. Check browser console for errors
2. Verify network and contract address
3. Ensure MetaMask is properly configured

## Future Enhancements

- 📈 Multiple cryptocurrency pairs
- 🏆 Leaderboards and achievements
- 💎 NFT rewards for top predictors
- 📊 Advanced analytics and charts
- 🎯 Different prediction durations
- 🤝 Social features and competitions

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Chainlink, React, and Hardhat
