// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PricePredictionDApp is Ownable {
    AggregatorV3Interface internal priceFeed;
    
    struct Prediction {
        address user;
        uint256 predictedPrice;
        uint256 timestamp;
        uint256 targetTimestamp;
        uint256 betAmount;
        bool isHigher;
        bool resolved;
        bool won;
    }
    
    mapping(uint256 => Prediction) public predictions;
    mapping(address => uint256[]) public userPredictions;
    uint256 public predictionCounter;
    uint256 public constant PREDICTION_DURATION = 300; // 5 minutes
    uint256 public constant MIN_BET = 0.001 ether;
    
    event PredictionMade(
        uint256 indexed predictionId,
        address indexed user,
        uint256 predictedPrice,
        bool isHigher,
        uint256 betAmount
    );
    
    event PredictionResolved(
        uint256 indexed predictionId,
        bool won,
        uint256 actualPrice
    );
    
    constructor() {
        // ETH/USD Price Feed on Sepolia testnet
        // For local testing, this will be replaced with mock feed address
        priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }
    
    // Allow owner to update price feed address (useful for testing)
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
    
    function makePrediction(bool _isHigher) external payable {
        require(msg.value >= MIN_BET, "Bet amount too low");
        
        int256 currentPrice = getLatestPrice();
        require(currentPrice > 0, "Unable to get price");
        
        uint256 predictionId = predictionCounter++;
        
        predictions[predictionId] = Prediction({
            user: msg.sender,
            predictedPrice: uint256(currentPrice),
            timestamp: block.timestamp,
            targetTimestamp: block.timestamp + PREDICTION_DURATION,
            betAmount: msg.value,
            isHigher: _isHigher,
            resolved: false,
            won: false
        });
        
        userPredictions[msg.sender].push(predictionId);
        
        emit PredictionMade(predictionId, msg.sender, uint256(currentPrice), _isHigher, msg.value);
    }
    
    function resolvePrediction(uint256 _predictionId) external {
        Prediction storage prediction = predictions[_predictionId];
        require(!prediction.resolved, "Already resolved");
        require(block.timestamp >= prediction.targetTimestamp, "Too early to resolve");
        
        int256 currentPrice = getLatestPrice();
        require(currentPrice > 0, "Unable to get current price");
        
        bool won = false;
        if (prediction.isHigher && uint256(currentPrice) > prediction.predictedPrice) {
            won = true;
        } else if (!prediction.isHigher && uint256(currentPrice) < prediction.predictedPrice) {
            won = true;
        }
        
        prediction.resolved = true;
        prediction.won = won;
        
        if (won) {
            // Winner gets 1.8x their bet (house edge of 10%)
            uint256 payout = (prediction.betAmount * 18) / 10;
            payable(prediction.user).transfer(payout);
        }
        
        emit PredictionResolved(_predictionId, won, uint256(currentPrice));
    }
    
    function getUserPredictions(address _user) external view returns (uint256[] memory) {
        return userPredictions[_user];
    }
    
    function getPrediction(uint256 _predictionId) external view returns (Prediction memory) {
        return predictions[_predictionId];
    }
    
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Function to check if prediction can be resolved
    function canResolve(uint256 _predictionId) external view returns (bool) {
        Prediction memory prediction = predictions[_predictionId];
        return !prediction.resolved && block.timestamp >= prediction.targetTimestamp;
    }
}
