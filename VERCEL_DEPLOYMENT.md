# Vercel Deployment Guide

This guide helps you deploy your Chainlink Price Prediction DApp to Vercel.

## Prerequisites

1. Install Vercel CLI globally:
```
npm install -g vercel
```

2. Create a Vercel account: https://vercel.com/signup

3. Login to Vercel from your terminal:
```
vercel login
```

## Deployment Options

### Option 1: Using our deployment script

1. Run the deployment script:
```
npm run deploy:vercel
```

2. Follow the prompts from Vercel CLI to complete the deployment.

### Option 2: Dry run to test configuration

1. Run the dry run script to check configuration:
```
npm run deploy:vercel:dry
```

### Option 3: Manual deployment through Vercel Dashboard

1. Push your code to GitHub:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/chainlink-price-prediction-dapp.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in.

3. Click "New Project".

4. Import your GitHub repository.

5. Configure settings (the defaults should work fine).

6. Click "Deploy".

## Troubleshooting

If you encounter issues during deployment:

1. Check that you're logged in to Vercel: `vercel login`

2. Make sure your build is successful: `npm run build`

3. Verify your contract address is correct in `src/AdvancedApp.js`

4. Ensure your Vercel.json configuration is correct

5. Try running with `--dry-run` flag to debug: `npm run deploy:vercel:dry`

## After Deployment

1. Vercel will provide a URL for your deployed application.

2. Test your application on the provided URL to ensure everything works correctly.

3. Make sure users can connect with MetaMask to the Sepolia testnet.

4. Verify price feeds are working correctly.

5. Test making a prediction to ensure the contract interactions work.
