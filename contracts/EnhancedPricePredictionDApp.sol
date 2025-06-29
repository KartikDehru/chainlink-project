// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EnhancedPricePredictionDApp
 * @dev A DApp that allows users to make predictions on cryptocurrency prices
 * using multiple Chainlink price feeds
 */
contract EnhancedPricePredictionDApp is Ownable {
    // Prediction struct with enhanced fields
    struct Prediction {
        address user;
        uint256 predictedPrice;
        uint256 timestamp;
        uint256 targetTimestamp;
        uint256 betAmount;
        bool isHigher;
        bool resolved;
        bool won;
        uint8 assetId;       // Which asset this prediction is for
        uint16 timeWindow;   // Duration in minutes
    }
    
    // Asset struct to store feed information
    struct Asset {
        string symbol;               // Asset symbol (e.g., "ETH")
        address priceFeed;           // Chainlink price feed address
        string pair;                 // Trading pair (e.g., "USD")
        uint8 decimals;              // Decimals for the price feed
        bool active;                 // Whether this asset is active for predictions
    }
    
    // Time window options in minutes
    uint16[] public timeWindows = [5, 15, 60, 240, 1440]; // 5min, 15min, 1hr, 4hr, 24hr
    
    // Maps asset ID to Asset struct
    mapping(uint8 => Asset) public assets;
    uint8 public assetCount;
    
    // Maps prediction ID to Prediction struct
    mapping(uint256 => Prediction) public predictions;
    
    // Maps user address to their prediction IDs
    mapping(address => uint256[]) public userPredictions;
    
    // Counter for prediction IDs
    uint256 public predictionCounter;
    
    // Minimum bet amount
    uint256 public constant MIN_BET = 0.001 ether;
    
    // Fee percentage (10% = 1000)
    uint16 public feePercentage = 1000; // 10%
    
    // Events
    event PredictionMade(
        uint256 indexed predictionId,
        address indexed user,
        uint256 predictedPrice,
        bool isHigher,
        uint256 betAmount,
        uint8 assetId,
        uint16 timeWindow
    );
    
    event PredictionResolved(
        uint256 indexed predictionId,
        bool won,
        uint256 actualPrice
    );
    
    event AssetAdded(
        uint8 indexed assetId,
        string symbol,
        address priceFeed,
        string pair
    );
    
    constructor() {
        // Add ETH/USD as the first asset (ID 0)
        _addAsset(
            "ETH",
            0x694AA1769357215DE4FAC081bf1f309aDC325306, // ETH/USD on Sepolia
            "USD",
            8
        );
        
        // Add BTC/USD as the second asset (ID 1)
        _addAsset(
            "BTC",
            0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43, // BTC/USD on Sepolia
            "USD",
            8
        );
    }
    
    /**
     * @dev Adds a new asset with a Chainlink price feed
     * @param _symbol Asset symbol
     * @param _priceFeed Chainlink price feed address
     * @param _pair Trading pair
     * @param _decimals Decimals for the price feed
     */
    function _addAsset(
        string memory _symbol,
        address _priceFeed,
        string memory _pair,
        uint8 _decimals
    ) internal {
        assets[assetCount] = Asset({
            symbol: _symbol,
            priceFeed: _priceFeed,
            pair: _pair,
            decimals: _decimals,
            active: true
        });
        
        emit AssetAdded(assetCount, _symbol, _priceFeed, _pair);
        assetCount++;
    }
    
    /**
     * @dev Adds a new asset (only owner)
     */
    function addAsset(
        string memory _symbol,
        address _priceFeed,
        string memory _pair,
        uint8 _decimals
    ) external onlyOwner {
        _addAsset(_symbol, _priceFeed, _pair, _decimals);
    }
    
    /**
     * @dev Gets the latest price for a specific asset
     * @param _assetId The ID of the asset
     * @return The latest price
     */
    function getLatestPrice(uint8 _assetId) public view returns (int256) {
        require(_assetId < assetCount, "Asset does not exist");
        require(assets[_assetId].active, "Asset is not active");
        
        AggregatorV3Interface feed = AggregatorV3Interface(assets[_assetId].priceFeed);
        (, int256 price, , , ) = feed.latestRoundData();
        return price;
    }
    
    /**
     * @dev Makes a price prediction
     * @param _isHigher Whether the user predicts the price will go up
     * @param _assetId The ID of the asset to predict
     * @param _timeWindowIndex The index of the prediction time window
     */
    function makePrediction(
        bool _isHigher,
        uint8 _assetId,
        uint8 _timeWindowIndex
    ) external payable {
        require(msg.value >= MIN_BET, "Bet amount too low");
        require(_assetId < assetCount, "Asset does not exist");
        require(assets[_assetId].active, "Asset is not active");
        require(_timeWindowIndex < timeWindows.length, "Invalid time window");
        
        int256 currentPrice = getLatestPrice(_assetId);
        require(currentPrice > 0, "Unable to get price");
        
        uint16 timeWindow = timeWindows[_timeWindowIndex];
        uint256 predictionId = predictionCounter++;
        
        predictions[predictionId] = Prediction({
            user: msg.sender,
            predictedPrice: uint256(currentPrice),
            timestamp: block.timestamp,
            targetTimestamp: block.timestamp + (timeWindow * 60), // Convert minutes to seconds
            betAmount: msg.value,
            isHigher: _isHigher,
            resolved: false,
            won: false,
            assetId: _assetId,
            timeWindow: timeWindow
        });
        
        userPredictions[msg.sender].push(predictionId);
        
        emit PredictionMade(
            predictionId,
            msg.sender,
            uint256(currentPrice),
            _isHigher,
            msg.value,
            _assetId,
            timeWindow
        );
    }
    
    /**
     * @dev Resolves a prediction
     * @param _predictionId The ID of the prediction to resolve
     */
    function resolvePrediction(uint256 _predictionId) external {
        Prediction storage prediction = predictions[_predictionId];
        require(!prediction.resolved, "Already resolved");
        require(block.timestamp >= prediction.targetTimestamp, "Too early to resolve");
        
        int256 currentPrice = getLatestPrice(prediction.assetId);
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
    
    /**
     * @dev Gets all predictions for a user
     * @param _user The address of the user
     * @return An array of prediction IDs
     */
    function getUserPredictions(address _user) external view returns (uint256[] memory) {
        return userPredictions[_user];
    }
    
    /**
     * @dev Gets a prediction
     * @param _predictionId The ID of the prediction
     * @return The prediction
     */
    function getPrediction(uint256 _predictionId) external view returns (Prediction memory) {
        return predictions[_predictionId];
    }
    
    /**
     * @dev Withdraws funds (owner only)
     */
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Checks if a prediction can be resolved
     * @param _predictionId The ID of the prediction
     * @return Whether the prediction can be resolved
     */
    function canResolve(uint256 _predictionId) external view returns (bool) {
        Prediction memory prediction = predictions[_predictionId];
        return !prediction.resolved && block.timestamp >= prediction.targetTimestamp;
    }
    
    /**
     * @dev Sets the fee percentage (owner only)
     * @param _feePercentage The new fee percentage (10% = 1000)
     */
    function setFeePercentage(uint16 _feePercentage) external onlyOwner {
        require(_feePercentage <= 3000, "Fee too high"); // Max 30%
        feePercentage = _feePercentage;
    }
    
    /**
     * @dev Sets the active status of an asset (owner only)
     * @param _assetId The ID of the asset
     * @param _active Whether the asset is active
     */
    function setAssetActive(uint8 _assetId, bool _active) external onlyOwner {
        require(_assetId < assetCount, "Asset does not exist");
        assets[_assetId].active = _active;
    }
    
    /**
     * @dev Gets all available assets
     * @return Array of assets
     */
    function getAllAssets() external view returns (Asset[] memory) {
        Asset[] memory allAssets = new Asset[](assetCount);
        for (uint8 i = 0; i < assetCount; i++) {
            allAssets[i] = assets[i];
        }
        return allAssets;
    }
    
    /**
     * @dev Gets all available time windows
     * @return Array of time windows in minutes
     */
    function getTimeWindows() external view returns (uint16[] memory) {
        return timeWindows;
    }
}