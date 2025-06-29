const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Deploying AdvancedPricePredictionDApp to ${network.name}...`);
  
  // Deploy mock aggregators for local testing with more assets
  console.log("Deploying mock price feeds...");
  
  const DECIMALS = 8;
  const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
  
  // Deploy multiple mock price feeds
  const mockFeeds = [];
  const assets = [
    { name: "ETH/USD", initialPrice: 2000 },
    { name: "BTC/USD", initialPrice: 30000 },
    { name: "LINK/USD", initialPrice: 15 },
    { name: "MATIC/USD", initialPrice: 1 },
    { name: "ADA/USD", initialPrice: 0.5 },
    { name: "DOT/USD", initialPrice: 8 },
    { name: "AVAX/USD", initialPrice: 25 },
    { name: "ATOM/USD", initialPrice: 12 },
    { name: "SOL/USD", initialPrice: 100 },
    { name: "UNI/USD", initialPrice: 7 }
  ];
  
  for (const asset of assets) {
    const initialPrice = Math.floor(asset.initialPrice * 10**8);
    const mockFeed = await MockV3AggregatorFactory.deploy(DECIMALS, initialPrice);
    await mockFeed.waitForDeployment();
    mockFeeds.push({
      name: asset.name,
      address: mockFeed.target,
      contract: mockFeed
    });
    console.log(`${asset.name} MockV3Aggregator deployed to: ${mockFeed.target}`);
  }
  
  // Deploy the advanced contract
  const AdvancedPricePredictionDApp = await ethers.getContractFactory("AdvancedPricePredictionDApp");
  const pricePredictionDApp = await AdvancedPricePredictionDApp.deploy();
  await pricePredictionDApp.waitForDeployment();
  
  console.log(`AdvancedPricePredictionDApp deployed to: ${pricePredictionDApp.target}`);
  
  // Initialize the contract with price feeds
  console.log("Initializing contract with price feeds...");
  
  for (const feed of mockFeeds) {
    const addAssetTx = await pricePredictionDApp.addAsset(
      feed.name,
      feed.address,
      DECIMALS
    );
    await addAssetTx.wait();
    console.log(`Added ${feed.name} price feed`);
  }
  
  // Add time windows with different multipliers
  const timeWindows = [
    { name: "30 sec", duration: 30, multiplier: 15000 }, // 1.5x multiplier
    { name: "1 min", duration: 60, multiplier: 16000 },  // 1.6x multiplier
    { name: "2 min", duration: 120, multiplier: 17000 }, // 1.7x multiplier
    { name: "5 min", duration: 300, multiplier: 18000 }, // 1.8x multiplier
    { name: "10 min", duration: 600, multiplier: 19000 }, // 1.9x multiplier
    { name: "15 min", duration: 900, multiplier: 20000 }, // 2.0x multiplier
    { name: "30 min", duration: 1800, multiplier: 22000 }, // 2.2x multiplier
    { name: "1 hour", duration: 3600, multiplier: 25000 } // 2.5x multiplier
  ];
  
  for (const window of timeWindows) {
    const addWindowTx = await pricePredictionDApp.addTimeWindow(
      window.name,
      window.duration,
      window.multiplier
    );
    await addWindowTx.wait();
    console.log(`Added ${window.name} time window with ${window.multiplier/10000}x multiplier`);
  }
  
  // Add different prediction types
  const predictionTypes = [
    {
      name: "Basic Up/Down",
      minBet: ethers.parseEther("0.001"),
      maxBet: ethers.parseEther("1"),
      rewardMultiplier: 18000 // 1.8x
    },
    {
      name: "Target Price",
      minBet: ethers.parseEther("0.002"),
      maxBet: ethers.parseEther("0.5"),
      rewardMultiplier: 25000 // 2.5x
    },
    {
      name: "Percentage Change",
      minBet: ethers.parseEther("0.001"),
      maxBet: ethers.parseEther("0.8"),
      rewardMultiplier: 22000 // 2.2x
    },
    {
      name: "High Risk",
      minBet: ethers.parseEther("0.005"),
      maxBet: ethers.parseEther("0.1"),
      rewardMultiplier: 30000 // 3.0x
    },
    {
      name: "Conservative",
      minBet: ethers.parseEther("0.0005"),
      maxBet: ethers.parseEther("2"),
      rewardMultiplier: 15000 // 1.5x
    }
  ];
  
  for (const predType of predictionTypes) {
    const addTypeTx = await pricePredictionDApp.addPredictionType(
      predType.name,
      predType.minBet,
      predType.maxBet,
      predType.rewardMultiplier
    );
    await addTypeTx.wait();
    console.log(`Added ${predType.name} prediction type with ${predType.rewardMultiplier/10000}x reward multiplier`);
  }
  
  // Set max active predictions to 10
  const setMaxTx = await pricePredictionDApp.setMaxActivePredictions(10);
  await setMaxTx.wait();
  console.log("Set max active predictions to 10");
  
  // Add some price volatility for testing
  console.log("Adding price volatility for testing...");
  for (let i = 0; i < mockFeeds.length; i++) {
    const feed = mockFeeds[i];
    const randomChange = Math.floor(Math.random() * 200) - 100; // -100 to +100
    const currentPrice = assets[i].initialPrice * 10**8;
    const newPrice = Math.floor(currentPrice * (1 + randomChange / 1000));
    
    try {
      await feed.contract.updateAnswer(newPrice);
      console.log(`Updated ${feed.name} price with ${randomChange/10}% change`);
    } catch (error) {
      console.log(`Could not update ${feed.name} price: ${error.message}`);
    }
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractName: "AdvancedPricePredictionDApp",
    network: network.name,
    chainId: network.config.chainId ? network.config.chainId.toString() : "unknown",
    contractAddress: pricePredictionDApp.target,
    mockFeeds: mockFeeds.map(feed => ({
      name: feed.name,
      address: feed.address
    })),
    deployedAt: new Date().toISOString(),
    features: [
      "Multiple assets (10 different crypto pairs)",
      "Multiple time windows (8 different durations)",
      "Multiple prediction types (5 different types)",
      "Batch predictions (up to 10 at once)",
      "Leaderboard system",
      "User statistics tracking",
      "Auto-resolution system",
      "Enhanced reward multipliers"
    ]
  };
  
  const deploymentPath = path.join(__dirname, "..", "advanced-deployment-local.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment information saved to ${deploymentPath}`);
  console.log("=== Deployment Summary ===");
  console.log(`Contract: ${pricePredictionDApp.target}`);
  console.log(`Assets: ${assets.length} different crypto pairs`);
  console.log(`Time Windows: ${timeWindows.length} different durations`);
  console.log(`Prediction Types: ${predictionTypes.length} different types`);
  console.log(`Max Active Predictions: 10 per user`);
  console.log("Advanced deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
