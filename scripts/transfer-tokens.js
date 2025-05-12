/**
 * Script to transfer IHR tokens from one wallet to another
 * 
 * Usage: 
 * node transfer-tokens.js <RECIPIENT_ADDRESS> <AMOUNT>
 * 
 * Example:
 * node transfer-tokens.js 7KFAhQnBQ7qqQMfKvuuqBGUBzBfTjPLozKMo7jSiUgbN 10
 */

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// IHR token mint address
const IHR_TOKEN_MINT = 'FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci';

// Decimals for IHR token
const IHR_DECIMALS = 9;

// Path to load the keypair
const KEYPAIR_PATH = path.join(__dirname, 'airdrop-authority.json');

async function main() {
  // Check command line arguments
  if (process.argv.length < 4) {
    console.log('Usage: node transfer-tokens.js <RECIPIENT_ADDRESS> <AMOUNT>');
    process.exit(1);
  }

  const recipientAddress = process.argv[2];
  const amount = parseFloat(process.argv[3]);

  // Validate recipient address
  let recipientPublicKey;
  try {
    recipientPublicKey = new web3.PublicKey(recipientAddress);
  } catch (error) {
    console.error('Invalid recipient address:', error.message);
    process.exit(1);
  }

  // Validate amount
  if (isNaN(amount) || amount <= 0) {
    console.error('Amount must be a positive number');
    process.exit(1);
  }

  // Connect to devnet
  const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');

  // Load the keypair for the sender
  let feePayer;
  try {
    if (fs.existsSync(KEYPAIR_PATH)) {
      // Load existing keypair
      const keyData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
      feePayer = web3.Keypair.fromSecretKey(new Uint8Array(keyData));
      console.log('Using existing keypair from file');
    } else {
      console.error('Keypair file not found. Please run airdrop-tokens.js first to generate a keypair.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error loading keypair:', error);
    process.exit(1);
  }

  console.log('Sender:', feePayer.publicKey.toString());
  console.log('Recipient:', recipientPublicKey.toString());
  console.log(`Amount: ${amount} IHR`);

  try {
    // Get the token mint
    const mintPublicKey = new web3.PublicKey(IHR_TOKEN_MINT);
    
    // Get the sender's token account
    const senderTokenAddress = await splToken.getAssociatedTokenAddress(
      mintPublicKey,
      feePayer.publicKey
    );
    
    // Check if the sender's token account exists
    try {
      const senderTokenAccount = await splToken.getAccount(connection, senderTokenAddress);
      console.log(`Sender token balance: ${Number(senderTokenAccount.amount) / Math.pow(10, IHR_DECIMALS)} IHR`);
      
      // Check if sender has enough tokens
      if (senderTokenAccount.amount < BigInt(Math.round(amount * Math.pow(10, IHR_DECIMALS)))) {
        console.error(`Not enough tokens. You have ${Number(senderTokenAccount.amount) / Math.pow(10, IHR_DECIMALS)} IHR but tried to send ${amount} IHR`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Sender token account not found or error checking balance:', error);
      process.exit(1);
    }
    
    // Get or create the recipient's token account
    const recipientTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      feePayer,
      mintPublicKey,
      recipientPublicKey
    );
    
    console.log('Recipient token account:', recipientTokenAccount.address.toString());
    
    // Calculate the token amount with decimals
    const tokenAmount = BigInt(Math.round(amount * Math.pow(10, IHR_DECIMALS)));
    
    // Create a transaction to transfer tokens
    const transaction = new web3.Transaction();
    
    // Add the transfer instruction
    const transferInstruction = splToken.createTransferInstruction(
      senderTokenAddress,
      recipientTokenAccount.address,
      feePayer.publicKey,
      tokenAmount
    );
    
    transaction.add(transferInstruction);
    
    // Send and confirm the transaction
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [feePayer]
    );
    
    console.log('Transaction successful!');
    console.log('Signature:', signature);
    console.log(`${amount} IHR tokens sent to ${recipientPublicKey.toString()}`);
    console.log(`View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 