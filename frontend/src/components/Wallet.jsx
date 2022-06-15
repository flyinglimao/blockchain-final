import Button from "@mui/material/Button";

import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

export function Wallet() {
  const { data } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  if (data)
    return (
      <span>
        {data.address.slice(0, 6)}...{data.address.slice(-4)}
      </span>
    );
  return (
    <Button variant="inherit" onClick={() => connect()}>
      Connect Wallet
    </Button>
  );
}
