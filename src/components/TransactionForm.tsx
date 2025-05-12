"use client";

import { useState, useEffect, useContext } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { 
  getOrCreateAssociatedTokenAccount, 
  createTransferInstruction, 
  getMint,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { NetworkContext } from "@/providers/WalletContextProvider";
import NetworkSwitcher from "./NetworkSwitcher";

type TokenType = "SOL" | "SPL";

// Helper function to retry API calls
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      // If it's not a 403/429 error, don't retry
      if (!error.message.includes("403") && !error.message.includes("429")) {
        throw error;
      }
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  
  throw lastError!;
}

export default function TransactionForm() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { network } = useContext(NetworkContext);
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<TokenType>("SOL");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(9); // Default decimals
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isCreatingTokenAccount, setIsCreatingTokenAccount] = useState(false);

  useEffect(() => {
    setIsConnected(!!publicKey);
  }, [publicKey]);

  // When token address changes, try to fetch token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!tokenAddress || !connection) return;
      
      try {
        const mintPubkey = new web3.PublicKey(tokenAddress);
        
        // Use retry logic for getting mint info
        const mintInfo = await retryOperation(() => 
          getMint(connection, mintPubkey)
        );
        
        setTokenDecimals(mintInfo.decimals);
      } catch (error) {
        console.log("Error fetching token info:", error);
        // Keep default decimals
      }
    };
    
    if (tokenType === "SPL") {
      fetchTokenInfo();
    }
  }, [tokenAddress, connection, tokenType]);

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
      
      // Provide more user-friendly error messages
      let errorMessage = error.message;
      
      if (error.message.includes("TokenAccountNotFound") || error.message.includes("Account does not exist")) {
        errorMessage = "Error creating token account. Please try again.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for this transaction. Make sure you have enough tokens.";
      } else if (error.message.includes("owner does not match")) {
        errorMessage = "Owner mismatch error. Make sure you're using the correct wallet.";
      } else if (error.message.includes("403")) {
        errorMessage = "Network access forbidden. Please check your network settings or try again later.";
      }
      
      setStatus({
        success: false,
        message: `Transaction failed: ${errorMessage}`,
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
      
      // Find the associated token address for the sender
      const senderTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      // Create transaction to hold all instructions
      const transaction = new web3.Transaction();
      
      // Check if the sender's token account exists and create it if it doesn't
      let senderAccountInfo;
      try {
        senderAccountInfo = await connection.getAccountInfo(senderTokenAddress);
        
        if (!senderAccountInfo) {
          console.log("Creating sender token account...");
          // Create ATA for sender
          const createSenderAccountIx = await getOrCreateAssociatedTokenAccount(
            connection,
            publicKey as any,
            mintPubkey,
            publicKey
          );
        }
      } catch (error) {
        console.log("Error checking sender account, will create:", error);
        // Will be created below
      }
      
      // Find the associated token address for the recipient
      const recipientTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );
      
      // Check if recipient token account exists
      let recipientAccountInfo;
      try {
        recipientAccountInfo = await connection.getAccountInfo(recipientTokenAddress);
      } catch (error) {
        console.log("Error checking recipient account:", error);
      }
      
      // If recipient account doesn't exist, add creation instruction
      if (!recipientAccountInfo) {
        console.log("Adding instruction to create recipient token account");
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          publicKey,
          recipientTokenAddress,
          recipientPubkey,
          mintPubkey
        );
        transaction.add(createAccountInstruction);
      }
      
      // Get the token account to check balance
      const senderTokenAccount = await getAccount(
        connection,
        senderTokenAddress
      );
      
      // Check if the sender has any tokens
      if (senderTokenAccount.amount === BigInt(0)) {
        throw new Error("You don't have any tokens in your wallet. Please add some tokens first.");
      }
      
      // Calculate the amount with decimals
      const amountToSend = parseFloat(amount) * Math.pow(10, tokenDecimals);
      
      // Create the transfer instruction
      const transferInstruction = createTransferInstruction(
        senderTokenAddress,
        recipientTokenAddress,
        publicKey,
        BigInt(Math.round(amountToSend))
      );
      
      // Add the transfer instruction to the transaction
      transaction.add(transferInstruction);
      
      // Sign and send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      
      return signature;
    } catch (error: any) {
      console.error("Error sending SPL token:", error);
      
      // Check for specific errors
      if (error.message && error.message.includes("403")) {
        throw new Error("Network access forbidden. Please check your network settings or try again later.");
      } else if (error instanceof Error && error.name === "TokenAccountNotFoundError") {
        throw new Error("Token account not found. Please try again.");
      }
      
      throw error;
    }
  };

  const createTokenAccount = async () => {
    if (!publicKey || !tokenAddress) return;
    
    setIsCreatingTokenAccount(true);
    setStatus(null);
    
    try {
      // Get the token mint
      const mintPubkey = new web3.PublicKey(tokenAddress);
      
      // Find the associated token address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );
      
      // Check if the account already exists
      const accountInfo = await retryOperation(() => 
        connection.getAccountInfo(associatedTokenAddress)
      );
      
      if (accountInfo) {
        // Get token account info
        const tokenAccount = await retryOperation(() => 
          getAccount(connection, associatedTokenAddress)
        );
        
        // Check balance
        const uiAmount = Number(tokenAccount.amount) / Math.pow(10, tokenDecimals);
        setStatus({
          success: true,
          message: `Token account already exists with balance: ${uiAmount}`,
        });
      } else {
        // Create the token account
        const transaction = new web3.Transaction();
        
        // Get or create the associated token account
        const tokenAccount = await retryOperation(() => 
          getOrCreateAssociatedTokenAccount(
            connection,
            publicKey as any,
            mintPubkey,
            publicKey
          )
        );
        
        setStatus({
          success: true,
          message: `Token account created successfully! You can now receive tokens at this address.`,
        });
      }
    } catch (error: any) {
      console.error("Token account creation error:", error);
      
      // Check for 403 error specifically
      if (error.message && error.message.includes("403")) {
        setStatus({
          success: false,
          message: `Failed to create token account: Network access forbidden. Please check your network settings or try again later.`,
        });
      } else {
        setStatus({
          success: false,
          message: `Failed to create token account: ${error.message}`,
        });
      }
    } finally {
      setIsCreatingTokenAccount(false);
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
        <NetworkSwitcher />
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
            <p>Note: Make sure your wallet is connected to the correct network ({network}).</p>
          </div>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <button 
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-white/80 hover:text-white text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          {showInstructions ? "Hide Help" : "Show Help"}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2">Token Type</label>
          <div className="flex flex-wrap gap-2">
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
            <div className="text-xs text-white/70 mt-1">
              Token accounts are automatically created when sending tokens
            </div>
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
          {status.success && status.message.includes("Signature:") && (
            <a
              href={`https://explorer.solana.com/tx/${status.message.split(": ")[1]}?cluster=${network.toLowerCase()}`}
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
        <p className="mt-1">Network: {network}</p>
      </div>
    </div>
  );
} 