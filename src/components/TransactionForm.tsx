"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

type TokenType = "SOL" | "SPL";

export default function TransactionForm() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<TokenType>("SOL");
  const [tokenAddress, setTokenAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setIsConnected(!!publicKey);
  }, [publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setIsLoading(true);
    setStatus(null);

    try {
      let signature: string;
      
      if (tokenType === "SOL") {
        signature = await sendSol();
      } else {
        signature = await sendSplToken();
      }
      
      setStatus({
        success: true,
        message: `Transaction successful! Signature: ${signature}`,
      });
      
      // Reset form after successful transaction
      setRecipient("");
      setAmount("");
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus({
        success: false,
        message: `Transaction failed: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendSol = async (): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    
    try {
      const recipientPubkey = new web3.PublicKey(recipient);
      const lamports = parseFloat(amount) * web3.LAMPORTS_PER_SOL;
      
      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );
      
      // Send transaction and await confirmation
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      
      return signature;
    } catch (error) {
      console.error("Error sending SOL:", error);
      throw error;
    }
  };

  const sendSplToken = async (): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    if (!tokenAddress) throw new Error("Token address is required");
    
    try {
      const recipientPubkey = new web3.PublicKey(recipient);
      const mintPubkey = new web3.PublicKey(tokenAddress);
      
      // Get the token account of the sender
      const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any, // This is a hack because the type definitions don't match
        mintPubkey,
        publicKey,
      );
      
      // Get or create the token account of the recipient
      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey as any, // This is a hack because the type definitions don't match
        mintPubkey,
        recipientPubkey
      );
      
      // Calculate the amount with decimals (assuming 9 decimals which is common for SPL tokens)
      // In a production app, you would fetch the token's decimals from the blockchain
      const tokenDecimals = 9;
      const amountToSend = parseFloat(amount) * Math.pow(10, tokenDecimals);
      
      // Create the transfer instruction
      const transferInstruction = createTransferInstruction(
        senderTokenAccount.address,
        recipientTokenAccount.address,
        publicKey,
        BigInt(Math.round(amountToSend))
      );
      
      // Add the instruction to a transaction
      const transaction = new web3.Transaction().add(transferInstruction);
      
      // Sign and send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      
      return signature;
    } catch (error) {
      console.error("Error sending SPL token:", error);
      throw error;
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl text-white text-center">
        <p>Connect your wallet to send transactions</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Send Tokens</h2>
        <button 
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-white/80 hover:text-white text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          Help
        </button>
      </div>

      {showInstructions && (
        <div className="mb-6 p-3 bg-white/5 rounded-lg text-white/90 text-sm">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Select token type (SOL or SPL Token)</li>
            <li>For SPL tokens, enter the token's mint address</li>
            <li>Enter the recipient's wallet address</li>
            <li>Enter the amount to send</li>
            <li>Click send and approve the transaction in your wallet</li>
          </ol>
          <div className="mt-2 text-white/70 text-xs">
            <p>Note: This demo uses Solana's devnet. Make sure your wallet is connected to devnet.</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2">Token Type</label>
          <div className="flex space-x-4">
            <button
              type="button"
              className={`py-2 px-4 rounded ${
                tokenType === "SOL" 
                  ? "bg-purple-600 text-white" 
                  : "bg-white/20 text-white"
              }`}
              onClick={() => setTokenType("SOL")}
            >
              SOL
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded ${
                tokenType === "SPL" 
                  ? "bg-purple-600 text-white" 
                  : "bg-white/20 text-white"
              }`}
              onClick={() => setTokenType("SPL")}
            >
              SPL Token
            </button>
          </div>
        </div>
        
        {tokenType === "SPL" && (
          <div>
            <label htmlFor="tokenAddress" className="block text-white mb-2">
              Token Address
            </label>
            <input
              id="tokenAddress"
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Enter SPL token mint address"
              className="w-full p-2 rounded bg-white/20 text-white placeholder:text-white/50"
              required={tokenType === "SPL"}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="recipient" className="block text-white mb-2">
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient wallet address"
            className="w-full p-2 rounded bg-white/20 text-white placeholder:text-white/50"
            required
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-white mb-2">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount of ${tokenType}`}
            className="w-full p-2 rounded bg-white/20 text-white placeholder:text-white/50"
            min="0"
            step="any"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-white text-purple-900 font-bold hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? "Processing..." : `Send ${tokenType}`}
        </button>
      </form>
      
      {status && (
        <div className={`mt-4 p-3 rounded ${status.success ? "bg-green-500/20" : "bg-red-500/20"}`}>
          <p className="text-sm text-white break-all">{status.message}</p>
          {status.success && (
            <a
              href={`https://explorer.solana.com/tx/${status.message.split(": ")[1]}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white underline mt-2 block"
            >
              View on Solana Explorer
            </a>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10 text-white/60 text-xs">
        <p>Connected: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}</p>
        <p className="mt-1">Network: Devnet</p>
      </div>
    </div>
  );
} 