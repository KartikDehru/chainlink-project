# Advanced Chainlink Price Prediction DApp - Usage Guide

## 🚀 Features Summary

Your DApp now supports:

### Multiple Assets (10 Cryptocurrencies)
- ETH/USD, BTC/USD, LINK/USD, MATIC/USD, ADA/USD
- DOT/USD, AVAX/USD, ATOM/USD, SOL/USD, UNI/USD

### Multiple Time Windows (8 Options)
- 30 seconds (1.5x multiplier)
- 1 minute (1.6x multiplier)
- 2 minutes (1.7x multiplier)
- 5 minutes (1.8x multiplier)
- 10 minutes (1.9x multiplier)
- 15 minutes (2.0x multiplier)
- 30 minutes (2.2x multiplier)
- 1 hour (2.5x multiplier)

### Multiple Prediction Types (5 Options)
1. **Basic Up/Down** (1.8x reward) - Predict if price goes up or down
2. **Target Price** (2.5x reward) - Predict if price reaches a specific target
3. **Percentage Change** (2.2x reward) - Predict if price changes by 5% or more
4. **High Risk** (3.0x reward) - Higher risk, higher reward predictions
5. **Conservative** (1.5x reward) - Lower risk, steady rewards

### Advanced Features
- **Batch Predictions**: Make up to 10 predictions at once
- **Multiple Active Predictions**: Up to 10 active predictions per user
- **Real-time Price Updates**: Live Chainlink price feeds
- **User Statistics**: Track wins, losses, streaks, and performance
- **Leaderboard**: Compete with other users
- **Auto-resolution**: Automatic prediction resolution system

## 🎮 How to Use

### 1. Connect Your Wallet
- Click "Connect MetaMask" 
- Ensure you're on the correct network (localhost for testing)
- Have some test ETH for making predictions

### 2. Making Single Predictions
- Go to the "Make Predictions" tab
- Select "Single Prediction" mode
- Choose your asset, time window, and prediction type
- Set your bet amount (within the allowed range)
- Choose UP or DOWN direction
- For "Target Price" predictions, enter your target price
- Click "Make Prediction"

### 3. Making Batch Predictions
- Go to the "Make Predictions" tab
- Select "Batch Predictions" mode
- Configure up to 10 different predictions
- Each prediction can have different:
  - Asset
  - Time window
  - Prediction type
  - Bet amount
  - Direction
- Click "Make X Predictions" to submit all at once

### 4. Managing Active Predictions
- Go to the "Active" tab to see your current predictions
- View prediction details: start price, current price, end time
- Resolve predictions manually when they expire
- Track countdown timers for each prediction

### 5. Viewing History
- Go to the "History" tab to see resolved predictions
- See wins (green) and losses (red)
- Review your past performance
- Learn from successful prediction patterns

### 6. Stats & Leaderboard
- Go to the "Stats & Leaderboard" tab
- View your personal statistics:
  - Total predictions made
  - Win count and win rate
  - Total bet and total won
  - Current and maximum win streak
  - Net profit/loss
- Check the leaderboard to see top performers
- Your position is highlighted when you're in the top 10

## 💰 Reward Structure

### Base Rewards
- Each prediction type has a base reward multiplier
- Time windows have additional multipliers
- Final reward = Bet × Prediction Type Multiplier × Time Window Multiplier

### Example Calculations
- Basic Up/Down, 5 min window: 1.8x × 1.8x = 3.24x potential return
- Target Price, 1 hour window: 2.5x × 2.5x = 6.25x potential return
- High Risk, 30 sec window: 3.0x × 1.5x = 4.5x potential return

## 🎯 Strategy Tips

### For Beginners
- Start with "Conservative" prediction type
- Use shorter time windows (30 sec - 2 min) for faster results
- Make smaller bets (0.001-0.01 ETH) while learning
- Focus on assets you understand (ETH, BTC)

### For Advanced Users
- Use batch predictions to diversify across multiple assets
- Combine different prediction types for varied risk/reward
- Monitor market volatility and adjust time windows accordingly
- Track your statistics to identify winning patterns

### Risk Management
- Maximum 10 active predictions at once
- Don't bet more than you can afford to lose
- Diversify across different assets and time windows
- Use the leaderboard to learn from successful users

## 🔧 Technical Details

### Contract Features
- Built on Ethereum with Chainlink price feeds
- Real-time price updates every 10 seconds
- Automatic prediction resolution
- Gas-optimized batch operations
- Comprehensive event logging

### Security
- Owner-controlled asset and time window management
- Maximum bet limits per prediction type
- House edge protection (10% default)
- Emergency withdrawal functions

### Chainlink Integration
- Multiple price feed oracles
- Reliable price data with 8 decimal precision
- Fail-safes for invalid price data
- Real-time market data updates

## 🚀 Future Enhancements

Planned features include:
- **Chainlink VRF Integration**: Random bonus rewards
- **Chainlink Automation**: Automatic prediction resolution
- **More Assets**: Additional cryptocurrency pairs
- **Advanced Analytics**: Detailed performance metrics
- **Social Features**: User profiles and achievements
- **Mobile App**: React Native mobile version

## 🎉 Ready to Play!

Your advanced Chainlink Price Prediction DApp is now ready with:
- ✅ 10 different cryptocurrency assets
- ✅ 8 time window options  
- ✅ 5 prediction types
- ✅ Batch prediction support
- ✅ Up to 10 simultaneous active predictions
- ✅ Real-time leaderboard
- ✅ Comprehensive user statistics
- ✅ Advanced reward multipliers

Start making predictions and climb the leaderboard! 🏆

## 🌐 Global Deployment

To make your DApp available to users anywhere in the world, you can deploy it for free using Vercel or Netlify.

### Vercel Deployment (Recommended)

1. **Push your project to GitHub**:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/chainlink-price-prediction-dapp.git
   git push -u origin main
   ```

2. **Deploy using Vercel CLI**:
   ```
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy to Vercel
   npm run deploy:vercel
   ```

3. **Alternatively, deploy through Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in
   - Click "New Project"
   - Import your GitHub repository
   - Configure your project settings (defaults should work)
   - Click "Deploy"

### Netlify Deployment (Alternative)

1. **Deploy using Netlify CLI**:
   ```
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy to Netlify
   npm run deploy:netlify
   ```

2. **Alternatively, deploy through Netlify Dashboard**:
   - Go to [netlify.com](https://netlify.com)
   - Sign up or log in
   - Click "New site from Git"
   - Connect to your GitHub repository
   - Configure your build settings (Build command: `npm run build`, Publish directory: `build`)
   - Click "Deploy site"

### Important Deployment Notes

- Make sure your contract is deployed to Sepolia testnet or another public network before deploying the frontend
- Update your contract address in the deployment files if needed
- Test your deployed application to ensure everything works correctly
