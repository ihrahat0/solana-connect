"use client";

import { FC, ReactNode, useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import React from "react";

// Import the styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextProviderProps {
  children: ReactNode;
}

export const NetworkContext = React.createContext<{
  network: WalletAdapterNetwork;
  setNetwork: (network: WalletAdapterNetwork) => void;
}>({
  network: WalletAdapterNetwork.Mainnet,
  setNetwork: () => {},
});

// RPC endpoints - you can add your own API keys here
const getRpcEndpoints = (network: WalletAdapterNetwork) => {
  const endpoints = {
    [WalletAdapterNetwork.Mainnet]: [
      // Add your custom RPC endpoints with API keys here
      "https://crimson-sleek-replica.solana-mainnet.quiknode.pro/67a01501974b15a26bcc9567d0ffaf4d66649012",
      "https://solana-mainnet.g.alchemy.com/v2/demo", // Alchemy demo endpoint
      "https://api.mainnet.solana.com",
      clusterApiUrl(WalletAdapterNetwork.Mainnet),
    ],
    [WalletAdapterNetwork.Devnet]: [
      "https://api.devnet.solana.com",
      clusterApiUrl(WalletAdapterNetwork.Devnet),
    ],
    [WalletAdapterNetwork.Testnet]: [
      "https://api.testnet.solana.com",
      clusterApiUrl(WalletAdapterNetwork.Testnet),
    ],
  };
  
  return endpoints[network] || [clusterApiUrl(network)];
};

const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);

  // Use multiple endpoints with fallback
  const endpoint = useMemo(() => {
    const endpoints = getRpcEndpoints(network);
    return endpoints[0]; // Use the primary endpoint
  }, [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
  // and lazy loading. Instead of including the full list, you can also just include specific adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  // Load network preference from localStorage
  useEffect(() => {
    const savedNetwork = localStorage.getItem('solana-network');
    if (savedNetwork) {
      try {
        setNetwork(savedNetwork as WalletAdapterNetwork);
      } catch (e) {
        console.error('Invalid network in localStorage');
      }
    }
  }, []);

  // Save network preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('solana-network', network);
  }, [network]);

  const networkContextValue = useMemo(() => ({
    network,
    setNetwork,
  }), [network]);

  return (
    <NetworkContext.Provider value={networkContextValue}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  );
};

export default WalletContextProvider; 