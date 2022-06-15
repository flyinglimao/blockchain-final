import { useContractRead, useContractWrite } from "wagmi";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256) ",
];
export function useBalance(address, user) {
  const { data: balance } = useContractRead(
    {
      addressOrName: address,
      contractInterface: ERC20_ABI,
    },
    "balanceOf",
    { args: user }
  );

  return balance
}
export function useAllowance(address, user, spender) {
  const { data: balance } = useContractRead(
    {
      addressOrName: address,
      contractInterface: ERC20_ABI,
    },
    "allowance",
    { args: [user, spender] }
  );

  return balance
}
export function useApprove(address) {
  const obj = useContractWrite(
    {
      addressOrName: address,
      contractInterface: ERC20_ABI,
    },
    "approve"
  );

  return obj
}