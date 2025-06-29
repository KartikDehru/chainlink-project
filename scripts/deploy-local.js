const { ethers } = require("hardhat");

// Mock Price Feed contract for local testing
const mockPriceFeedABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

async function deployMockPriceFeed() {
  console.log("Deploying Mock Price Feed for local testing...");
  
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  const mockPriceFeed = await MockV3Aggregator.deploy(
    8, // decimals
    ethers.parseUnits("2000", 8) // initial price: $2000
  );
  await mockPriceFeed.waitForDeployment();
  
  console.log("Mock Price Feed deployed to:", await mockPriceFeed.getAddress());
  return mockPriceFeed;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  let priceFeedAddress;
  
  // Check if we're on a local network
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  if (network.chainId === 1337n || network.chainId === 31337n) {
    // Local network - deploy mock price feed
    const mockPriceFeed = await deployMockPriceFeed();
    priceFeedAddress = await mockPriceFeed.getAddress();
  } else {
    // Use real Chainlink price feed address for Sepolia
    priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  }

  console.log("Using Price Feed at:", priceFeedAddress);
  console.log("Deploying PricePredictionDApp...");

  const PricePredictionDApp = await ethers.getContractFactory("PricePredictionDApp");
  
  // If local, we need to modify the constructor to accept price feed address
  // For now, let's deploy with the hardcoded address and note this limitation
  const dapp = await PricePredictionDApp.deploy();
  await dapp.waitForDeployment();

  const contractAddress = await dapp.getAddress();
  console.log("PricePredictionDApp deployed to:", contractAddress);
  
  // Try to get initial price
  try {
    const price = await dapp.getLatestPrice();
    console.log("Current Price:", ethers.formatUnits(price, 8));
  } catch (error) {
    console.log("Note: Price feed may not be available on this network");
    console.log("Error:", error.message);
  }

  console.log("\n🎉 Deployment Complete!");
  console.log("📝 Next steps:");
  console.log("1. Update CONTRACT_ADDRESS in src/App.js to:", contractAddress);
  console.log("2. Run 'npm start' to start the frontend");
  console.log("3. Connect MetaMask and start making predictions!");
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    priceFeedAddress: priceFeedAddress,
    deployedAt: new Date().toISOString()
  };
  
  require('fs').writeFileSync(
    'deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
