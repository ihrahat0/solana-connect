"use client";

import { FC, useContext } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { NetworkContext } from "@/providers/WalletContextProvider";

const NetworkSwitcher: FC = () => {
  const { network, setNetwork } = useContext(NetworkContext);

  const toggleNetwork = () => {
    const newNetwork = network === WalletAdapterNetwork.Mainnet 
      ? WalletAdapterNetwork.Devnet 
      : WalletAdapterNetwork.Mainnet;
    
    setNetwork(newNetwork);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleNetwork}
        className="flex items-center px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <span className="text-sm text-white mr-2">
          {network === WalletAdapterNetwork.Mainnet ? "Mainnet" : "Devnet"}
        </span>
        <div className="relative inline-block w-10 align-middle select-none">
          <input
            type="checkbox"
            name="toggle"
            id="network-toggle"
            checked={network === WalletAdapterNetwork.Devnet}
            onChange={toggleNetwork}
            className="sr-only"
          />
          <div className={`block w-10 h-6 rounded-full ${network === WalletAdapterNetwork.Mainnet ? 'bg-purple-600' : 'bg-gray-600'}`}></div>
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${network === WalletAdapterNetwork.Devnet ? 'transform translate-x-4' : ''}`}></div>
        </div>
      </button>
    </div>
  );
};

export default NetworkSwitcher; 