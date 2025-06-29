const { ethers } = require("hardhat");

async function main() {
  // Get deployment info
  const deploymentInfo = require('../deployment.json');
  
  console.log("Checking contract on Sepolia...");
  console.log("Contract address:", deploymentInfo.contractAddress);
  
  // Get contract instance
  const dapp = await ethers.getContractAt(
    "PricePredictionDApp",
    deploymentInfo.contractAddress
  );
  
  // Get current price
  try {
    const price = await dapp.getLatestPrice();
    console.log("Current ETH/USD Price:", ethers.formatUnits(price, 8));
    
    // Get contract owner
    const owner = await dapp.owner();
    console.log("Contract Owner:", owner);
    
    // Get minimum bet
    const minBet = await dapp.MIN_BET();
    console.log("Minimum Bet:", ethers.formatEther(minBet), "ETH");
    
    // Get prediction duration
    const duration = await dapp.PREDICTION_DURATION();
    console.log("Prediction Duration:", duration.toString(), "seconds");
    
    console.log("\nContract is ready for use on Sepolia testnet!");
  } catch (error) {
    console.error("Error accessing contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
