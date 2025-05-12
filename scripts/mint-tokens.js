/**
 * Script to mint IHR tokens to a wallet address
 * 
 * Usage: 
 * node mint-tokens.js <RECIPIENT_ADDRESS> <AMOUNT>
 * 
 * Example:
 * node mint-tokens.js 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK 100
 * 
 * Note: This script requires the mint authority's private key to work.
 * The mint authority for the IHR token is 7v8UUEYC151uXUtBXKe49tVWfPPosSKoJaAfxr4H7jBX
 */

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// IHR token mint address
const IHR_TOKEN_MINT = 'FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci';

// Decimals for IHR token
const IHR_DECIMALS = 9;

// Path to load the mint authority keypair
const MINT_AUTHORITY_PATH = path.join(__dirname, 'mint-authority.json');

async function main() {
  // Check command line arguments
  if (process.argv.length < 4) {
    console.log('Usage: node mint-tokens.js <RECIPIENT_ADDRESS> <AMOUNT>');
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

  // Check if mint authority keypair exists
  if (!fs.existsSync(MINT_AUTHORITY_PATH)) {
    console.error(`Mint authority keypair not found at ${MINT_AUTHORITY_PATH}`);
    console.log('\nTo use this script, you need the mint authority\'s private key.');
    console.log('The mint authority for the IHR token is 7v8UUEYC151uXUtBXKe49tVWfPPosSKoJaAfxr4H7jBX');
    console.log('\nIf you are the token creator, create a file called mint-authority.json with your keypair.');
    console.log('The file should contain the array of secret key bytes.');
    process.exit(1);
  }

  // Load the mint authority keypair
  let mintAuthority;
  try {
    const keyData = JSON.parse(fs.readFileSync(MINT_AUTHORITY_PATH, 'utf8'));
    mintAuthority = web3.Keypair.fromSecretKey(new Uint8Array(keyData));
    console.log('Using mint authority:', mintAuthority.publicKey.toString());
    
    // Verify this is the correct mint authority
    const expectedMintAuthority = '7v8UUEYC151uXUtBXKe49tVWfPPosSKoJaAfxr4H7jBX';
    if (mintAuthority.publicKey.toString() !== expectedMintAuthority) {
      console.error(`This is not the correct mint authority. Expected ${expectedMintAuthority}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error loading mint authority keypair:', error);
    process.exit(1);
  }

  console.log('Mint authority:', mintAuthority.publicKey.toString());
  console.log('Recipient:', recipientPublicKey.toString());
  console.log(`Amount: ${amount} IHR`);

  try {
    // Get the token mint
    const mintPublicKey = new web3.PublicKey(IHR_TOKEN_MINT);
    
    // Check if the mint exists and verify the mint authority
    try {
      const mintInfo = await splToken.getMint(connection, mintPublicKey);
      console.log(`Token mint found: ${mintPublicKey.toString()}`);
      console.log(`Decimals: ${mintInfo.decimals}`);
      console.log(`Mint authority: ${mintInfo.mintAuthority?.toString() || 'None'}`);
      
      if (!mintInfo.mintAuthority || mintInfo.mintAuthority.toString() !== mintAuthority.publicKey.toString()) {
        console.error('The loaded keypair is not the mint authority for this token.');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error checking token mint:', error);
      process.exit(1);
    }
    
    // Get or create the associated token account for the recipient
    console.log('Creating or finding recipient token account...');
    const recipientTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      mintPublicKey,
      recipientPublicKey
    );
    
    console.log('Recipient token account:', recipientTokenAccount.address.toString());

    // Calculate the token amount with decimals
    const tokenAmount = BigInt(Math.round(amount * Math.pow(10, IHR_DECIMALS)));
    
    // Mint tokens to the recipient
    console.log('Minting tokens...');
    const signature = await splToken.mintTo(
      connection,
      mintAuthority,
      mintPublicKey,
      recipientTokenAccount.address,
      mintAuthority.publicKey,
      tokenAmount
    );
    
    console.log('Transaction successful!');
    console.log('Signature:', signature);
    console.log(`${amount} IHR tokens minted to ${recipientPublicKey.toString()}`);
    console.log(`View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
    // Check the recipient's token balance
    const tokenAccount = await splToken.getAccount(connection, recipientTokenAccount.address);
    const balance = Number(tokenAccount.amount) / Math.pow(10, IHR_DECIMALS);
    console.log(`Recipient's new token balance: ${balance} IHR`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 