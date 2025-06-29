const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Deploying EnhancedPricePredictionDApp to ${network.name}...`);
  
  // First deploy mock aggregators for local testing
  console.log("Deploying mock price feeds...");
  
  // Deploy mock for ETH/USD
  const DECIMALS = 8;
  const INITIAL_PRICE_ETH = 2000 * 10**8; // $2000 with 8 decimals
  const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
  const ethUsdPriceFeed = await MockV3AggregatorFactory.deploy(DECIMALS, INITIAL_PRICE_ETH);
  await ethUsdPriceFeed.deployed();
  console.log(`ETH/USD MockV3Aggregator deployed to: ${ethUsdPriceFeed.address}`);
  
  // Deploy mock for BTC/USD
  const INITIAL_PRICE_BTC = 30000 * 10**8; // $30000 with 8 decimals
  const btcUsdPriceFeed = await MockV3AggregatorFactory.deploy(DECIMALS, INITIAL_PRICE_BTC);
  await btcUsdPriceFeed.deployed();
  console.log(`BTC/USD MockV3Aggregator deployed to: ${btcUsdPriceFeed.address}`);
  
  // Now deploy the main contract
  const EnhancedPricePredictionDApp = await ethers.getContractFactory("EnhancedPricePredictionDApp");
  const pricePredictionDApp = await EnhancedPricePredictionDApp.deploy();
  await pricePredictionDApp.deployed();
  
  console.log(`EnhancedPricePredictionDApp deployed to: ${pricePredictionDApp.address}`);
  
  // Initialize the contract with our mock price feeds
  console.log("Initializing contract with price feeds...");
  
  // Add ETH/USD price feed
  const addEthFeedTx = await pricePredictionDApp.addAsset(
    "ETH/USD",
    ethUsdPriceFeed.address,
    DECIMALS
  );
  await addEthFeedTx.wait();
  console.log("Added ETH/USD price feed");
  
  // Add BTC/USD price feed
  const addBtcFeedTx = await pricePredictionDApp.addAsset(
    "BTC/USD",
    btcUsdPriceFeed.address,
    DECIMALS
  );
  await addBtcFeedTx.wait();
  console.log("Added BTC/USD price feed");
  
  // Add time windows (in seconds)
  const timeWindows = [
    { minutes: 1, seconds: 60 },
    { minutes: 5, seconds: 300 },
    { minutes: 15, seconds: 900 }
  ];
  
  for (const window of timeWindows) {
    const addWindowTx = await pricePredictionDApp.addTimeWindow(
      `${window.minutes} min`,
      window.seconds
    );
    await addWindowTx.wait();
    console.log(`Added ${window.minutes} minute time window`);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractName: "EnhancedPricePredictionDApp",
    network: network.name,
    chainId: network.config.chainId.toString(),
    contractAddress: pricePredictionDApp.address,
    mockEthUsdAddress: ethUsdPriceFeed.address,
    mockBtcUsdAddress: btcUsdPriceFeed.address,
    deployedAt: new Date().toISOString(),
  };
  
  const deploymentPath = path.join(__dirname, "..", "enhanced-deployment-local.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment information saved to ${deploymentPath}`);
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });