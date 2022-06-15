// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Strategy.sol";

contract Protocol is Ownable {
    mapping(uint256 => uint256) public lastRun; // strategy id => last run block
    IStrategy[] public approvedStrategy;
    uint256[] public reward;
    mapping(uint256 => bool) public unapproved;
    mapping(uint256 => mapping(address => uint256)) public shares;
    mapping(uint256 => uint256) public totalShares;
    mapping(address => mapping(uint256 => uint256)) public stopLoss;
    // stopLossReward can be considered as the fee to execute the stoploss
    // the currency is the reward token
    mapping(address => mapping(uint256 => uint256)) public stopLossReward;
    mapping(uint256 => uint256) public initValuePerShare;
    event SetStopLoss(address indexed user, uint256 indexed strategyId);
    event ExecStopLoss(address indexed user, uint256 indexed strategyId);
    IERC20 public rewardToken;

    constructor(IERC20 rewardToken_) {
        rewardToken = rewardToken_;
    }

    function approve(IStrategy strategy, uint256 rewardPergas)
        external
        onlyOwner
    {
        uint256 id = approvedStrategy.length;
        approvedStrategy.push(strategy);
        reward.push(rewardPergas);
        strategy.init(id);
    }

    function unapprove(uint256 strategyId) external onlyOwner {
        unapproved[strategyId] = true;
    }

    function deposit(uint256 strategyId, uint256 amount) external {
        require(!unapproved[strategyId], "Unapproved strategy");
        uint256 share = approvedStrategy[strategyId].handleDeposit(
            msg.sender,
            amount
        );
        shares[strategyId][msg.sender] += share;
        totalShares[strategyId] += share;
        if (initValuePerShare[strategyId] == 0)
            initValuePerShare[strategyId] = valuePerShare(strategyId);
    }

    function withdraw(uint256 strategyId, uint256 amount) external {
        require(!unapproved[strategyId], "Unapproved strategy");
        uint256 share = approvedStrategy[strategyId].handleWithdraw(
            msg.sender,
            amount
        );
        shares[strategyId][msg.sender] -= share;
        totalShares[strategyId] -= share;
    }

    function valuePerShare(uint256 strategyId) public returns (uint256) {
        return
            totalShares[strategyId] == 0
                ? 0
                : approvedStrategy[strategyId].totalValue() /
                    totalShares[strategyId];
    }

    function run(uint256 strategyId) external returns (uint256 tokenReward) {
        require(
            lastRun[strategyId] < block.number,
            "Already run in this block"
        );
        uint256 preGas = gasleft();

        lastRun[strategyId] = block.number;
        approvedStrategy[strategyId].run(msg.sender);

        tokenReward = (preGas - gasleft()) * reward[strategyId];
        rewardToken.transfer(msg.sender, tokenReward);
    }

    function setReward(uint256 strategyId, uint256 rewardPerGas)
        external
        onlyOwner
    {
        reward[strategyId] = rewardPerGas;
    }

    function setStopLoss(
        uint256 strategyId,
        uint256 stopLoss_,
        uint256 reward_
    ) external {
        uint256 prevStopLoss = stopLossReward[msg.sender][strategyId];
        stopLoss[msg.sender][strategyId] = stopLoss_;
        stopLossReward[msg.sender][strategyId] = reward_;

        if (prevStopLoss >= reward_) rewardToken.transfer(msg.sender, prevStopLoss - reward_);
        else rewardToken.transferFrom(msg.sender, address(this), reward_ - prevStopLoss);

        emit SetStopLoss(msg.sender, strategyId);
    }

    function executeStopLoss(address target, uint256 strategyId) external {
        require(approvedStrategy[strategyId].value(target) <= stopLoss[target][strategyId]);
        uint256 share = approvedStrategy[strategyId].handleWithdraw(
            target,
            approvedStrategy[strategyId].value(target)
        );
        shares[strategyId][target] -= share;
        totalShares[strategyId] -= share;
        // although the remaining share should be 0, not checking here
        // since it might have some share unable to withdraw

        uint256 fee = stopLossReward[target][strategyId];
        stopLossReward[target][strategyId] = 0;
        rewardToken.transfer(msg.sender, fee);

        emit ExecStopLoss(msg.sender, strategyId);
    }
}
