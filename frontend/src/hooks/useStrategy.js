import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { ethers } from "ethers";

const PROTOCOL_INFO = {
  addressOrName: "0x0E2aE0C67f0AA03B73160bc2D9f40E23D7E1D7F5",
  contractInterface: [
    "function deposit(uint256, uint256)",
    "function withdraw(uint256, uint256)",
    "function setStopLoss(uint256, uint256, uint256)",
    "function valuePerShare(uint256) view returns (uint256)",
    "function stopLoss(address, uint256) view returns (uint256)",
    "function stopLossReward(address, uint256) view returns (uint256)",
    "function unapproved(uint256) view returns (bool)",
    "function initValuePerShare(uint256) view returns (uint256)",
  ],
};
const STRATEGY_ABI = [
  "function allowed(address) view returns (bool)",
  "function totalValue() view returns (uint256)",
  "function invested(address) view returns (uint256)",
  "function value(address) view returns (uint256)",
];

export function useStrategy(strategyId, contract) {
  const { data: account } = useAccount();
  const { data: isUnapproved } = useContractRead(PROTOCOL_INFO, "unapproved", {
    args: strategyId,
  });
  const { data: isAllowed } = useContractRead(
    {
      addressOrName: contract,
      contractInterface: STRATEGY_ABI,
    },
    "allowed",
    { args: (account && account.address) || ethers.constants.AddressZero }
  );
  const { data: invested, refetch: refetchInvested } = useContractRead(
    {
      addressOrName: contract,
      contractInterface: STRATEGY_ABI,
    },
    "invested",
    { args: (account && account.address) || ethers.constants.AddressZero }
  );
  const { data: value, refetch: refetchValue } = useContractRead(
    {
      addressOrName: contract,
      contractInterface: STRATEGY_ABI,
    },
    "value",
    { args: (account && account.address) || ethers.constants.AddressZero }
  );
  const { data: initValuePerShare } = useContractRead(
    PROTOCOL_INFO,
    "initValuePerShare",
    {
      args: strategyId,
    }
  );
  const { data: valuePerShare, refetch: refetchValuePerShare } =
    useContractRead(PROTOCOL_INFO, "valuePerShare", {
      args: strategyId,
    });
  const { data: totalValue, refetch: refetchTotalValue } = useContractRead(
    {
      addressOrName: contract,
      contractInterface: STRATEGY_ABI,
    },
    "totalValue"
  );
  const { data: stopLoss, refetch: refetchStopLoss } = useContractRead(
    PROTOCOL_INFO,
    "stopLoss",
    {
      args: [
        (account && account.address) || ethers.constants.AddressZero,
        strategyId,
      ],
    }
  );
  const { data: stopLossReward, refetch: refetchStopLossReward } =
    useContractRead(PROTOCOL_INFO, "stopLossReward", {
      args: [
        (account && account.address) || ethers.constants.AddressZero,
        strategyId,
      ],
    });
  const deposit = useContractWrite(PROTOCOL_INFO, "deposit");
  const withdraw = useContractWrite(PROTOCOL_INFO, "withdraw");
  const setStopLoss = useContractWrite(PROTOCOL_INFO, "setStopLoss");

  return {
    isApproved: !isUnapproved,
    isAllowed: !!isAllowed,
    isInvested: !!(invested && invested.gte(1)),
    invested: invested || "Loading",
    currentValue: value || "Loading",
    cumulativeROI:
      (valuePerShare &&
        initValuePerShare &&
        (initValuePerShare.gte(1)
          ? valuePerShare.mul(10000).div(initValuePerShare).toNumber() / 100
          : "0")) ||
      "Loading",
    totalValue: totalValue || "Loading",
    stopLoss: stopLoss || "Loading",
    stopLossReward: stopLossReward || "Loading",
    deposit,
    withdraw,
    setStopLoss,
    refetch() {
      refetchInvested();
      refetchValue();
      refetchValuePerShare();
      refetchTotalValue();
      refetchStopLoss();
      refetchStopLossReward();
    },
  };
}
