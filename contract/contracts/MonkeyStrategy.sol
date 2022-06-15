// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Strategy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router02 {
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * This strategy random sell or buy random token in every block
 */
contract MonkeyStrategy is IStrategy {
    string public override strategyURI = "";
    address public override currency =
        0xc778417E063141139Fce010982780140Aa0cD5Ab;
    bool inited = false;
    address public targetToken = 0x64E0d30CfC2Aa0533350Ed5012B6Ab0d4d475c2b;
    IUniswapV2Router02 public uniswap =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address protocol = 0x0E2aE0C67f0AA03B73160bc2D9f40E23D7E1D7F5;
    address[] path = [currency, targetToken];
    address[] r_path = [targetToken, currency];
    uint256 public totalShares = 0;
    mapping(address => uint256) public override invested;
    mapping(address => uint256) public shares;

    function allowed(address) external pure override returns (bool) {
        return true;
    }

    function init(uint256 strategyId) external override {
        require(msg.sender == protocol);
        require(!inited);
        inited = true;
        IERC20(currency).approve(address(uniswap), type(uint256).max);
        IERC20(targetToken).approve(address(uniswap), type(uint256).max);
    }

    function totalValue() public view override returns (uint256) {
        uint256 balanceOfCurrency = IERC20(currency).balanceOf(address(this));
        uint256 balanceOfTarget = IERC20(targetToken).balanceOf(address(this));
        return
            balanceOfCurrency +
            (
                balanceOfTarget > 0
                    ? uniswap.getAmountsOut(balanceOfTarget, r_path)[1]
                    : 0
            );
    }

    function run(address sender) external override {
        require(msg.sender == protocol);
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.coinbase,
                    msg.sender
                )
            )
        );
        if (seed % 2 == 1) {
            uint256 buyWithCurrency = (IERC20(currency).balanceOf(
                address(this)
            ) * uint256(uint32(seed))) / uint256(type(uint32).max);
            if (buyWithCurrency > 0)
                uniswap.swapExactTokensForTokens(
                    buyWithCurrency,
                    0,
                    path,
                    address(this),
                    block.timestamp
                );
        } else {
            uint256 buyWithTarget = (IERC20(targetToken).balanceOf(
                address(this)
            ) * uint256(uint32(seed))) / uint256(type(uint32).max);
            if (buyWithTarget > 0)
                uniswap.swapExactTokensForTokens(
                    buyWithTarget,
                    0,
                    r_path,
                    address(this),
                    block.timestamp
                );
        }
    }

    function handleDeposit(
        address depositor,
        uint256 amount // of currency
    ) external override returns (uint256 newShare) {
        require(msg.sender == protocol);
        uint256 balanceOfCurrency = IERC20(currency).balanceOf(address(this));
        uint256 currentValue = totalValue();
        IERC20(currency).transferFrom(depositor, address(this), amount);
        if (currentValue > 0 && currentValue - balanceOfCurrency > 0)
            uniswap.swapExactTokensForTokens(
                (amount * (currentValue - balanceOfCurrency)) / currentValue,
                0,
                path,
                address(this),
                block.timestamp
            );
        if (totalShares == 0) {
            newShare = amount * 1e18;
        } else {
            newShare = (amount * totalShares) / currentValue;
        }
        invested[depositor] += amount;
        shares[depositor] += newShare;
        totalShares += newShare;
    }

    function handleWithdraw(
        address withdrawer,
        uint256 amount // of currency
    ) external override returns (uint256 share) {
        require(msg.sender == protocol);
        uint256 balanceOfCurrency = IERC20(currency).balanceOf(address(this));
        uint256 balanceOfTarget = IERC20(targetToken).balanceOf(address(this));
        share = (amount * totalShares) / totalValue();
        if (share > totalShares) share = totalShares;
        uint256 amountIn = (balanceOfTarget * share) / totalShares;
        uint256 balanceFromTarget = balanceOfTarget > 0
            ? uniswap.getAmountsOut(amountIn, r_path)[1]
            : 0;
        if (balanceOfTarget > 0)
            uniswap.swapExactTokensForTokens(
                amountIn,
                0,
                r_path,
                address(this),
                block.timestamp
            );
        IERC20(currency).transfer(
            withdrawer,
            (balanceOfCurrency * share) / totalShares + balanceFromTarget
        );
        invested[withdrawer] = invested[withdrawer] > amount
            ? invested[withdrawer] - amount
            : 0; // 0 means the investment is recouped
        shares[withdrawer] -= share;
        totalShares -= share;
    }

    function value(address investor) external view override returns (uint256) {
        return
            totalShares > 0
                ? (totalValue() * shares[investor]) / totalShares
                : 0;
    }
}
