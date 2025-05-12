/**
 * Script to create a token account for a wallet
 * 
 * Usage: 
 * node create-token-account.js <WALLET_ADDRESS>
 * 
 * Example:
 * node create-token-account.js 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK
 */

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// IHR token mint address
const IHR_TOKEN_MINT = 'FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci';

// Path to load the keypair
const KEYPAIR_PATH = path.join(__dirname, 'airdrop-authority.json');

async function main() {
  // Check command line arguments
  if (process.argv.length < 3) {
    console.log('Usage: node create-token-account.js <WALLET_ADDRESS>');
    process.exit(1);
  }

  const walletAddress = process.argv[2];

  // Validate wallet address
  let walletPublicKey;
  try {
    walletPublicKey = new web3.PublicKey(walletAddress);
  } catch (error) {
    console.error('Invalid wallet address:', error.message);
    process.exit(1);
  }

  // Connect to devnet
  const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');

  // Load the keypair for the fee payer
  let feePayer;
  try {
    if (fs.existsSync(KEYPAIR_PATH)) {
      // Load existing keypair
      const keyData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
      feePayer = web3.Keypair.fromSecretKey(new Uint8Array(keyData));
      console.log('Using existing keypair from file');
    } else {
      // Create a new keypair and save it
      feePayer = web3.Keypair.generate();
      fs.writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(feePayer.secretKey)));
      console.log('Created and saved new keypair to file');
      
      // Request an airdrop of SOL to pay for transaction fees
      console.log('Requesting SOL airdrop for fees...');
      const airdropSignature = await connection.requestAirdrop(
        feePayer.publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
      console.log('Received SOL airdrop');
    }
  } catch (error) {
    console.error('Error with keypair:', error);
    process.exit(1);
  }

  console.log('Fee payer:', feePayer.publicKey.toString());
  console.log('Target wallet:', walletPublicKey.toString());

  try {
    // Get the token mint
    const mintPublicKey = new web3.PublicKey(IHR_TOKEN_MINT);
    
    // Find the associated token address
    const tokenAddress = await splToken.getAssociatedTokenAddress(
      mintPublicKey,
      walletPublicKey
    );
    
    console.log('Token address:', tokenAddress.toString());
    
    // Check if the token account already exists
    const accountInfo = await connection.getAccountInfo(tokenAddress);
    
    if (accountInfo) {
      console.log('Token account already exists');
      
      // Get token account info
      const tokenAccount = await splToken.getAccount(connection, tokenAddress);
      console.log(`Current balance: ${Number(tokenAccount.amount)} (raw units)`);
    } else {
      console.log('Creating token account...');
      
      // Create the token account
      const transaction = new web3.Transaction();
      
      // Create associated token account instruction
      const createAccountInstruction = splToken.createAssociatedTokenAccountInstruction(
        feePayer.publicKey,
        tokenAddress,
        walletPublicKey,
        mintPublicKey
      );
      
      transaction.add(createAccountInstruction);
      
      // Send and confirm the transaction
      const signature = await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [feePayer]
      );
      
      console.log('Token account created successfully!');
      console.log('Signature:', signature);
      console.log(`View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    }
    
    console.log('\nToken account is ready to receive IHR tokens');
    console.log(`To check the token account, run: node check-token-accounts.js ${walletPublicKey.toString()}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 