// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AdvancedPricePredictionDApp is Ownable {
    // Enhanced structures
    struct Asset {
        string symbol;
        AggregatorV3Interface priceFeed;
        uint8 decimals;
        bool isActive;
        uint256 totalPredictions;
        uint256 totalVolume;
    }
    
    struct TimeWindow {
        string name;
        uint256 duration; // in seconds
        bool isActive;
        uint256 multiplier; // reward multiplier (basis points, 10000 = 1x)
    }
    
    struct PredictionType {
        string name;
        bool isActive;
        uint256 minBet;
        uint256 maxBet;
        uint256 rewardMultiplier; // basis points
    }
    
    struct Prediction {
        address user;
        uint8 assetId;
        uint8 timeWindowId;
        uint8 predictionTypeId;
        uint256 amount;
        int256 startPrice;
        int256 targetPrice; // for specific price targets
        bool isUp;
        uint256 timestamp;
        uint256 endTime;
        bool resolved;
        bool won;
        uint256 reward;
        bytes32 requestId; // for VRF integration
    }
    
    struct UserStats {
        uint256 totalPredictions;
        uint256 winCount;
        uint256 totalBet;
        uint256 totalWon;
        uint256 winStreak;
        uint256 maxWinStreak;
    }
    
    // State variables
    mapping(uint8 => Asset) public assets;
    mapping(uint8 => TimeWindow) public timeWindows;  
    mapping(uint8 => PredictionType) public predictionTypes;
    mapping(uint256 => Prediction) public predictions;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public userPredictions;
    
    uint8 public assetCount = 0;
    uint8 public timeWindowCount = 0;
    uint8 public predictionTypeCount = 0;
    uint256 public predictionCount = 0;
    uint256 public totalVolume = 0;
    uint256 public houseEdge = 1000; // 10% in basis points
    
    // Multi-prediction support
    mapping(address => uint256) public activePredictions;
    uint256 public maxActivePredictions = 10;
    
    // Leaderboard
    address[] public topPlayers;
    mapping(address => uint256) public playerRanking;
    
    // Events
    event AssetAdded(uint8 indexed assetId, string symbol, address priceFeed);
    event TimeWindowAdded(uint8 indexed windowId, string name, uint256 duration);
    event PredictionTypeAdded(uint8 indexed typeId, string name, uint256 minBet, uint256 maxBet);
    event PredictionMade(
        uint256 indexed predictionId,
        address indexed user,
        uint8 assetId,
        uint8 timeWindowId,
        uint8 predictionTypeId,
        uint256 amount,
        bool isUp,
        int256 startPrice
    );
    event PredictionResolved(
        uint256 indexed predictionId,
        address indexed user,
        bool won,
        uint256 reward,
        int256 endPrice
    );
    event LeaderboardUpdated(address indexed user, uint256 newRank);
    
    constructor() {}
    
    // Asset management
    function addAsset(string memory _symbol, address _priceFeed, uint8 _decimals) external onlyOwner {
        assets[assetCount] = Asset({
            symbol: _symbol,
            priceFeed: AggregatorV3Interface(_priceFeed),
            decimals: _decimals,
            isActive: true,
            totalPredictions: 0,
            totalVolume: 0
        });
        emit AssetAdded(assetCount, _symbol, _priceFeed);
        assetCount++;
    }
    
    // Time window management
    function addTimeWindow(string memory _name, uint256 _duration, uint256 _multiplier) external onlyOwner {
        timeWindows[timeWindowCount] = TimeWindow({
            name: _name,
            duration: _duration,
            isActive: true,
            multiplier: _multiplier
        });
        emit TimeWindowAdded(timeWindowCount, _name, _duration);
        timeWindowCount++;
    }
    
    // Prediction type management
    function addPredictionType(
        string memory _name,
        uint256 _minBet,
        uint256 _maxBet,
        uint256 _rewardMultiplier
    ) external onlyOwner {
        predictionTypes[predictionTypeCount] = PredictionType({
            name: _name,
            isActive: true,
            minBet: _minBet,
            maxBet: _maxBet,
            rewardMultiplier: _rewardMultiplier
        });
        emit PredictionTypeAdded(predictionTypeCount, _name, _minBet, _maxBet);
        predictionTypeCount++;
    }
    
    // Enhanced prediction making
    function makePrediction(
        uint8 _assetId,
        uint8 _timeWindowId,
        uint8 _predictionTypeId,
        bool _isUp,
        int256 _targetPrice // optional target price for specific prediction types
    ) external payable {
        require(_assetId < assetCount, "Invalid asset");
        require(_timeWindowId < timeWindowCount, "Invalid time window");
        require(_predictionTypeId < predictionTypeCount, "Invalid prediction type");
        require(assets[_assetId].isActive, "Asset not active");
        require(timeWindows[_timeWindowId].isActive, "Time window not active");
        require(predictionTypes[_predictionTypeId].isActive, "Prediction type not active");
        require(activePredictions[msg.sender] < maxActivePredictions, "Too many active predictions");
        
        PredictionType memory predType = predictionTypes[_predictionTypeId];
        require(msg.value >= predType.minBet, "Bet amount too low");
        require(msg.value <= predType.maxBet, "Bet amount too high");
        
        // Get current price
        int256 currentPrice = getCurrentPrice(_assetId);
        require(currentPrice > 0, "Invalid price");
        
        uint256 endTime = block.timestamp + timeWindows[_timeWindowId].duration;
        
        predictions[predictionCount] = Prediction({
            user: msg.sender,
            assetId: _assetId,
            timeWindowId: _timeWindowId,
            predictionTypeId: _predictionTypeId,
            amount: msg.value,
            startPrice: currentPrice,
            targetPrice: _targetPrice,
            isUp: _isUp,
            timestamp: block.timestamp,
            endTime: endTime,
            resolved: false,
            won: false,
            reward: 0,
            requestId: bytes32(0)
        });
        
        userPredictions[msg.sender].push(predictionCount);
        activePredictions[msg.sender]++;
        
        // Update statistics
        assets[_assetId].totalPredictions++;
        assets[_assetId].totalVolume += msg.value;
        totalVolume += msg.value;
        userStats[msg.sender].totalPredictions++;
        userStats[msg.sender].totalBet += msg.value;
        
        emit PredictionMade(
            predictionCount,
            msg.sender,
            _assetId,
            _timeWindowId,
            _predictionTypeId,
            msg.value,
            _isUp,
            currentPrice
        );
        
        predictionCount++;
    }
    
    // Batch prediction making
    function makeBatchPredictions(
        uint8[] calldata _assetIds,
        uint8[] calldata _timeWindowIds,
        uint8[] calldata _predictionTypeIds,
        bool[] calldata _isUp,
        uint256[] calldata _amounts
    ) external payable {
        require(_assetIds.length == _timeWindowIds.length, "Array length mismatch");
        require(_assetIds.length == _predictionTypeIds.length, "Array length mismatch");
        require(_assetIds.length == _isUp.length, "Array length mismatch");
        require(_assetIds.length == _amounts.length, "Array length mismatch");
        require(_assetIds.length <= 10, "Too many predictions at once");
        
        uint256 totalAmount = 0;
        for(uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }
        require(msg.value == totalAmount, "Incorrect total amount");
        
        for(uint256 i = 0; i < _assetIds.length; i++) {
            _makeSinglePrediction(
                _assetIds[i],
                _timeWindowIds[i],
                _predictionTypeIds[i],
                _isUp[i],
                _amounts[i],
                0 // no target price for batch
            );
        }
    }
    
    function _makeSinglePrediction(
        uint8 _assetId,
        uint8 _timeWindowId,
        uint8 _predictionTypeId,
        bool _isUp,
        uint256 _amount,
        int256 _targetPrice
    ) internal {
        require(_assetId < assetCount, "Invalid asset");
        require(assets[_assetId].isActive, "Asset not active");
        require(activePredictions[msg.sender] < maxActivePredictions, "Too many active predictions");
        
        int256 currentPrice = getCurrentPrice(_assetId);
        require(currentPrice > 0, "Invalid price");
        
        uint256 endTime = block.timestamp + timeWindows[_timeWindowId].duration;
        
        predictions[predictionCount] = Prediction({
            user: msg.sender,
            assetId: _assetId,
            timeWindowId: _timeWindowId,
            predictionTypeId: _predictionTypeId,
            amount: _amount,
            startPrice: currentPrice,
            targetPrice: _targetPrice,
            isUp: _isUp,
            timestamp: block.timestamp,
            endTime: endTime,
            resolved: false,
            won: false,
            reward: 0,
            requestId: bytes32(0)
        });
        
        userPredictions[msg.sender].push(predictionCount);
        activePredictions[msg.sender]++;
        
        emit PredictionMade(
            predictionCount,
            msg.sender,
            _assetId,
            _timeWindowId,
            _predictionTypeId,
            _amount,
            _isUp,
            currentPrice
        );
        
        predictionCount++;
    }
    
    // Enhanced resolution with multiple criteria
    function resolvePrediction(uint256 _predictionId) external {
        _resolvePrediction(_predictionId);
    }
    
    function _resolvePrediction(uint256 _predictionId) internal {
        require(_predictionId < predictionCount, "Invalid prediction ID");
        Prediction storage prediction = predictions[_predictionId];
        require(!prediction.resolved, "Already resolved");
        require(block.timestamp >= prediction.endTime, "Prediction not yet ended");
        
        int256 endPrice = getCurrentPrice(prediction.assetId);
        require(endPrice > 0, "Invalid end price");
        
        bool won = false;
        PredictionType memory predType = predictionTypes[prediction.predictionTypeId];
        
        // Different resolution logic based on prediction type
        if (prediction.predictionTypeId == 0) { // Basic up/down
            won = prediction.isUp ? endPrice > prediction.startPrice : endPrice < prediction.startPrice;
        } else if (prediction.predictionTypeId == 1) { // Target price
            won = prediction.isUp ? endPrice >= prediction.targetPrice : endPrice <= prediction.targetPrice;
        } else if (prediction.predictionTypeId == 2) { // Percentage change
            int256 changePercent = ((endPrice - prediction.startPrice) * 100) / prediction.startPrice;
            won = prediction.isUp ? changePercent >= 5 : changePercent <= -5; // 5% threshold
        }
        
        prediction.resolved = true;
        prediction.won = won;
        activePredictions[prediction.user]--;
        
        if (won) {
            uint256 reward = (prediction.amount * predType.rewardMultiplier * timeWindows[prediction.timeWindowId].multiplier) / (10000 * 10000);
            prediction.reward = reward;
            
            // Update user stats
            userStats[prediction.user].winCount++;
            userStats[prediction.user].totalWon += reward;
            userStats[prediction.user].winStreak++;
            
            if (userStats[prediction.user].winStreak > userStats[prediction.user].maxWinStreak) {
                userStats[prediction.user].maxWinStreak = userStats[prediction.user].winStreak;
            }
            
            // Transfer reward
            payable(prediction.user).transfer(reward);
            
            // Update leaderboard
            _updateLeaderboard(prediction.user);
        } else {
            userStats[prediction.user].winStreak = 0;
        }
        
        emit PredictionResolved(_predictionId, prediction.user, won, prediction.reward, endPrice);
    }
    
    // Auto-resolve multiple predictions
    function resolveMultiplePredictions(uint256[] calldata _predictionIds) external {
        for(uint256 i = 0; i < _predictionIds.length; i++) {
            if (_predictionIds[i] < predictionCount && 
                !predictions[_predictionIds[i]].resolved && 
                block.timestamp >= predictions[_predictionIds[i]].endTime) {
                _resolvePrediction(_predictionIds[i]);
            }
        }
    }
    
    // Leaderboard management
    function _updateLeaderboard(address _user) internal {
        uint256 userScore = userStats[_user].totalWon + (userStats[_user].winCount * 1000);
        
        // Simple insertion sort for top 10
        if (topPlayers.length < 10) {
            topPlayers.push(_user);
            playerRanking[_user] = topPlayers.length;
        } else {
            uint256 lowestScore = userStats[topPlayers[9]].totalWon + (userStats[topPlayers[9]].winCount * 1000);
            if (userScore > lowestScore) {
                topPlayers[9] = _user;
                playerRanking[_user] = 10;
                
                // Bubble up
                for(uint256 i = 8; i >= 0 && i < 10; i--) {
                    uint256 currentScore = userStats[topPlayers[i]].totalWon + (userStats[topPlayers[i]].winCount * 1000);
                    if (userScore > currentScore) {
                        address temp = topPlayers[i];
                        topPlayers[i] = topPlayers[i + 1];
                        topPlayers[i + 1] = temp;
                        playerRanking[_user] = i + 1;
                        playerRanking[temp] = i + 2;
                    } else {
                        break;
                    }
                }
            }
        }
        
        emit LeaderboardUpdated(_user, playerRanking[_user]);
    }
    
    // View functions
    function getCurrentPrice(uint8 _assetId) public view returns (int256) {
        require(_assetId < assetCount, "Invalid asset");
        (, int256 price, , , ) = assets[_assetId].priceFeed.latestRoundData();
        return price;
    }
    
    function getUserPredictions(address _user) external view returns (uint256[] memory) {
        return userPredictions[_user];
    }
    
    function getActivePredictions(address _user) external view returns (uint256[] memory) {
        uint256[] memory allUserPredictions = userPredictions[_user];
        uint256 activeCount = 0;
        
        // Count active predictions
        for(uint256 i = 0; i < allUserPredictions.length; i++) {
            if (!predictions[allUserPredictions[i]].resolved) {
                activeCount++;
            }
        }
        
        uint256[] memory activePreds = new uint256[](activeCount);
        uint256 index = 0;
        
        for(uint256 i = 0; i < allUserPredictions.length; i++) {
            if (!predictions[allUserPredictions[i]].resolved) {
                activePreds[index] = allUserPredictions[i];
                index++;
            }
        }
        
        return activePreds;
    }
    
    function getLeaderboard() external view returns (address[] memory) {
        return topPlayers;
    }
    
    function getResolvablePredictions() external view returns (uint256[] memory) {
        uint256 resolvableCount = 0;
        
        // Count resolvable predictions
        for(uint256 i = 0; i < predictionCount; i++) {
            if (!predictions[i].resolved && block.timestamp >= predictions[i].endTime) {
                resolvableCount++;
            }
        }
        
        uint256[] memory resolvable = new uint256[](resolvableCount);
        uint256 index = 0;
        
        for(uint256 i = 0; i < predictionCount; i++) {
            if (!predictions[i].resolved && block.timestamp >= predictions[i].endTime) {
                resolvable[index] = i;
                index++;
            }
        }
        
        return resolvable;
    }
    
    // Admin functions
    function setMaxActivePredictions(uint256 _max) external onlyOwner {
        maxActivePredictions = _max;
    }
    
    function setHouseEdge(uint256 _houseEdge) external onlyOwner {
        require(_houseEdge <= 2000, "House edge too high"); // Max 20%
        houseEdge = _houseEdge;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function withdraw(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(_amount);
    }
    
    receive() external payable {}
}
