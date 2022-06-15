import { WagmiConfig, createClient, chain, configureChains } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { InjectedConnector } from "wagmi/connectors/injected";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Nav } from "./components/Nav";
import { Register } from "./components/Register";
import { StrategyList } from "./components/StrategyList";

import "./App.css";

const { chains, provider } = configureChains(
  [chain.rinkeby],
  [infuraProvider({ infuraId: "1b4fd85ec53748feae973ece5bc436bd" })]
);
const client = createClient({
  provider,
  connectors: [new InjectedConnector({ chains })],
});

function App() {
  return (
    <BrowserRouter>
      <WagmiConfig className="App" client={client}>
        <Nav />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<StrategyList />} />
        </Routes>
      </WagmiConfig>
    </BrowserRouter>
  );
}

export default App;
