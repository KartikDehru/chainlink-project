const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PricePredictionDApp...");

  const PricePredictionDApp = await ethers.getContractFactory("PricePredictionDApp");
  const dapp = await PricePredictionDApp.deploy();

  await dapp.waitForDeployment();

  console.log("PricePredictionDApp deployed to:", await dapp.getAddress());
  
  // Get initial price
  try {
    const price = await dapp.getLatestPrice();
    console.log("Current ETH/USD Price:", ethers.formatUnits(price, 8));
  } catch (error) {
    console.log("Note: Price feed may not be available on local network");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
