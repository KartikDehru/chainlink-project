const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Load deployment info
  const deploymentInfo = require('../deployment.json');
  
  console.log("Setting price feed address...");
  console.log("Contract address:", deploymentInfo.contractAddress);
  console.log("Price feed address:", deploymentInfo.priceFeedAddress);
  
  // Get contract instance
  const dapp = await ethers.getContractAt(
    "PricePredictionDApp",
    deploymentInfo.contractAddress,
    deployer
  );
  
  // Set price feed address
  const tx = await dapp.setPriceFeed(deploymentInfo.priceFeedAddress);
  await tx.wait();
  
  console.log("Price feed address set successfully!");
  
  // Try to get price now
  try {
    const price = await dapp.getLatestPrice();
    console.log("Current Price:", ethers.formatUnits(price, 8));
  } catch (error) {
    console.error("Error getting price:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
