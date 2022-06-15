// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ENX is ERC20, Ownable {
    constructor() ERC20("Enexco", "ENX") {}

    function mint(uint256 num) external onlyOwner {
        _mint(msg.sender, num);
    }
}