"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import TransactionForm from "@/components/TransactionForm";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { connected } = useWallet();

  // Only show UI when component has mounted to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-600 overflow-hidden">
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-500/20 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse animation-delay-4000"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white/30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`,
                animation: 'float infinite linear'
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 px-4 py-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-24 h-24 rounded-full shadow-lg flex items-center justify-center mb-4 overflow-hidden">
            <Image 
              src="/solana.webp" 
              alt="Solana Logo"
              width={100}
              height={100}
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center">
            Connect to Solana
          </h1>
          <p className="text-white/80 text-center max-w-md">
            Connect your wallet to interact with the Solana blockchain. Fast, secure, and decentralized.
          </p>
          
          <div className="mt-6 w-full max-w-xl rounded-xl overflow-hidden shadow-lg">
            <iframe 
              className="w-full aspect-video"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              title="Solana Blockchain Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
        
        {/* Wallet Button with custom style wrapper */}
        {mounted && (
          <div className="wallet-adapter-button-wrapper">
            <WalletMultiButton className="!bg-white !text-purple-900 hover:!bg-opacity-90 !transition-all !duration-200 !font-bold !rounded-xl !py-4 !px-8 !text-lg shadow-lg" />
          </div>
        )}

        {/* Transaction Form - only show after wallet connection */}
        {mounted && connected && (
          <div className="mt-8 w-full max-w-md">
            <TransactionForm />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center text-white/60 text-sm">
        <p>Using Solana Wallet Adapter with Next.js</p>
      </div>
    </div>
  );
}
