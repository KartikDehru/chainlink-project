const { ethers, network } = require("hardhat");

async function main() {
  console.log("Deploying EnhancedPricePredictionDApp...");

  const EnhancedPricePredictionDApp = await ethers.getContractFactory("EnhancedPricePredictionDApp");
  const dapp = await EnhancedPricePredictionDApp.deploy();

  await dapp.waitForDeployment();

  const contractAddress = await dapp.getAddress();
  console.log("EnhancedPricePredictionDApp deployed to:", contractAddress);
  
  // Get info about supported assets
  try {
    const assetCount = await dapp.assetCount();
    console.log("Supported assets:", assetCount.toString());
    
    // Get ETH/USD price
    const ethPrice = await dapp.getLatestPrice(0);
    console.log("Current ETH/USD Price:", ethers.formatUnits(ethPrice, 8));
    
    // Get BTC/USD price
    const btcPrice = await dapp.getLatestPrice(1);
    console.log("Current BTC/USD Price:", ethers.formatUnits(btcPrice, 8));
    
    // Get time windows
    const timeWindows = await dapp.getTimeWindows();
    console.log("Available time windows (minutes):", timeWindows.map(t => t.toString()).join(", "));
  } catch (error) {
    console.log("Note: Some price feeds may not be available on this network");
    console.log("Error:", error.message);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractName: "EnhancedPricePredictionDApp",
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString()
  };
  
  require('fs').writeFileSync(
    'enhanced-deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to enhanced-deployment.json");
  console.log("\n🎉 Enhanced DApp Deployment Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
