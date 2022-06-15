// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IStrategy {
    // return the information link of this strategy
    function strategyURI() external returns (string memory);

    // return the address of the investing token
    function currency() external returns (address);

    // return if an address is allowed to invest
    // return 1 for address(0x0) if it's open to all
    function allowed(address) external returns (bool);

    // should check if msg.sender is the pool
    function init(uint256 strategyId) external;

    // return total value of the strategy
    function totalValue() external returns (uint256);

    function run(address sender) external;

    function handleDeposit(
        address depositor,
        uint256 amount // of currency
    ) external returns (uint256);

    function handleWithdraw(
        address withdrawer,
        uint256 amount // of currency
    ) external returns (uint256);

    function invested(address investor) external view returns (uint256);

    function value(address investor) external view returns (uint256);
}
