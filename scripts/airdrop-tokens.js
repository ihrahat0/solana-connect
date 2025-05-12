/**
 * Script to airdrop IHR tokens to a specified wallet address
 * 
 * Usage: 
 * node airdrop-tokens.js <RECIPIENT_ADDRESS> <AMOUNT>
 * 
 * Example:
 * node airdrop-tokens.js 7KFAhQnBQ7qqQMfKvuuqBGUBzBfTjPLozKMo7jSiUgbN 100
 */

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// IHR token mint address
const IHR_TOKEN_MINT = 'FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci';

// Decimals for IHR token
const IHR_DECIMALS = 9;

// Path to save the keypair
const KEYPAIR_PATH = path.join(__dirname, 'airdrop-authority.json');

async function main() {
  // Check command line arguments
  if (process.argv.length < 4) {
    console.log('Usage: node airdrop-tokens.js <RECIPIENT_ADDRESS> <AMOUNT>');
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

  // Create or load a keypair for the fee payer / mint authority
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
        web3.LAMPORTS_PER_SOL * 2 // 2 SOL should be enough for multiple operations
      );
      await connection.confirmTransaction(airdropSignature);
      console.log('Received SOL airdrop');
    }
  } catch (error) {
    console.error('Error with keypair:', error);
    
    // Fallback to generating a new keypair
    feePayer = web3.Keypair.generate();
    
    // Request an airdrop of SOL to pay for transaction fees
    console.log('Requesting SOL airdrop for fees...');
    const airdropSignature = await connection.requestAirdrop(
      feePayer.publicKey,
      web3.LAMPORTS_PER_SOL * 2
    );
    await connection.confirmTransaction(airdropSignature);
  }

  console.log('Using fee payer:', feePayer.publicKey.toString());
  console.log('Recipient:', recipientPublicKey.toString());
  console.log(`Amount: ${amount} IHR`);

  try {
    // Get the token mint
    const mintPublicKey = new web3.PublicKey(IHR_TOKEN_MINT);
    
    // Check if the mint exists
    try {
      const mintInfo = await splToken.getMint(connection, mintPublicKey);
      console.log(`Token mint found: ${mintPublicKey.toString()}`);
      console.log(`Decimals: ${mintInfo.decimals}`);
    } catch (error) {
      console.error('Error: Token mint not found. Make sure the token has been created on devnet.');
      process.exit(1);
    }
    
    // Get or create the associated token account for the recipient
    console.log('Creating or finding recipient token account...');
    const recipientTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      feePayer,
      mintPublicKey,
      recipientPublicKey
    );
    
    console.log('Recipient token account:', recipientTokenAccount.address.toString());

    // Calculate the token amount with decimals
    const tokenAmount = amount * Math.pow(10, IHR_DECIMALS);
    
    // Create a transaction to mint tokens to the recipient
    const transaction = new web3.Transaction();
    
    try {
      // Try to mint tokens to the recipient
      console.log('Attempting to mint tokens...');
      const mintInstruction = splToken.createMintToInstruction(
        mintPublicKey,
        recipientTokenAccount.address,
        feePayer.publicKey,
        BigInt(Math.round(tokenAmount))
      );
      
      transaction.add(mintInstruction);
      
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
    } catch (mintError) {
      console.error('Error minting tokens:', mintError);
      console.log('You may not be the mint authority for this token.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 