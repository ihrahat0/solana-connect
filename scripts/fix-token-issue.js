/**
 * Script to fix token account issues and send IHR tokens
 * 
 * Usage: 
 * node fix-token-issue.js <YOUR_WALLET_ADDRESS> <AMOUNT>
 * 
 * Example:
 * node fix-token-issue.js 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK 100
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
    console.log('Usage: node fix-token-issue.js <YOUR_WALLET_ADDRESS> <AMOUNT>');
    process.exit(1);
  }

  const walletAddress = process.argv[2];
  const amount = parseFloat(process.argv[3]);

  // Validate wallet address
  let walletPublicKey;
  try {
    walletPublicKey = new web3.PublicKey(walletAddress);
  } catch (error) {
    console.error('Invalid wallet address:', error.message);
    process.exit(1);
  }

  // Validate amount
  if (isNaN(amount) || amount <= 0) {
    console.error('Amount must be a positive number');
    process.exit(1);
  }

  console.log('=== Step 1: Setting up connection and keypair ===');
  
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
        web3.LAMPORTS_PER_SOL * 2
      );
      await connection.confirmTransaction(airdropSignature);
      console.log('Received SOL airdrop');
    }
  } catch (error) {
    console.error('Error with keypair:', error);
    process.exit(1);
  }

  console.log('Fee payer:', feePayer.publicKey.toString());
  console.log('Your wallet:', walletPublicKey.toString());

  try {
    console.log('\n=== Step 2: Creating token account for your wallet ===');
    
    // Get the token mint
    const mintPublicKey = new web3.PublicKey(IHR_TOKEN_MINT);
    
    // Find the associated token address for your wallet
    const yourTokenAddress = await splToken.getAssociatedTokenAddress(
      mintPublicKey,
      walletPublicKey
    );
    
    console.log('Your token address:', yourTokenAddress.toString());
    
    // Check if your token account already exists
    let yourTokenAccount;
    const yourAccountInfo = await connection.getAccountInfo(yourTokenAddress);
    
    if (yourAccountInfo) {
      console.log('Your token account already exists');
      yourTokenAccount = await splToken.getAccount(connection, yourTokenAddress);
      console.log(`Current balance: ${Number(yourTokenAccount.amount) / Math.pow(10, IHR_DECIMALS)} IHR`);
    } else {
      console.log('Creating your token account...');
      
      // Create your token account
      const createYourAccountTx = new web3.Transaction();
      
      // Create associated token account instruction
      const createYourAccountInstruction = splToken.createAssociatedTokenAccountInstruction(
        feePayer.publicKey,
        yourTokenAddress,
        walletPublicKey,
        mintPublicKey
      );
      
      createYourAccountTx.add(createYourAccountInstruction);
      
      // Send and confirm the transaction
      const createYourAccountSignature = await web3.sendAndConfirmTransaction(
        connection,
        createYourAccountTx,
        [feePayer]
      );
      
      console.log('Your token account created successfully!');
      console.log('Signature:', createYourAccountSignature);
      console.log(`View transaction: https://explorer.solana.com/tx/${createYourAccountSignature}?cluster=devnet`);
    }
    
    console.log('\n=== Step 3: Creating token account for fee payer ===');
    
    // Find the associated token address for fee payer
    const feePayerTokenAddress = await splToken.getAssociatedTokenAddress(
      mintPublicKey,
      feePayer.publicKey
    );
    
    console.log('Fee payer token address:', feePayerTokenAddress.toString());
    
    // Check if fee payer token account already exists
    let feePayerTokenAccount;
    const feePayerAccountInfo = await connection.getAccountInfo(feePayerTokenAddress);
    
    if (feePayerAccountInfo) {
      console.log('Fee payer token account already exists');
      feePayerTokenAccount = await splToken.getAccount(connection, feePayerTokenAddress);
      console.log(`Current balance: ${Number(feePayerTokenAccount.amount) / Math.pow(10, IHR_DECIMALS)} IHR`);
    } else {
      console.log('Creating fee payer token account...');
      
      // Create fee payer token account
      const createFeePayerAccountTx = new web3.Transaction();
      
      // Create associated token account instruction
      const createFeePayerAccountInstruction = splToken.createAssociatedTokenAccountInstruction(
        feePayer.publicKey,
        feePayerTokenAddress,
        feePayer.publicKey,
        mintPublicKey
      );
      
      createFeePayerAccountTx.add(createFeePayerAccountInstruction);
      
      // Send and confirm the transaction
      const createFeePayerAccountSignature = await web3.sendAndConfirmTransaction(
        connection,
        createFeePayerAccountTx,
        [feePayer]
      );
      
      console.log('Fee payer token account created successfully!');
      console.log('Signature:', createFeePayerAccountSignature);
      console.log(`View transaction: https://explorer.solana.com/tx/${createFeePayerAccountSignature}?cluster=devnet`);
    }
    
    console.log('\n=== Step 4: Checking if we have tokens to send ===');
    
    // Re-fetch fee payer token account to get updated balance
    feePayerTokenAccount = await splToken.getAccount(connection, feePayerTokenAddress);
    const feePayerBalance = Number(feePayerTokenAccount.amount) / Math.pow(10, IHR_DECIMALS);
    
    console.log(`Fee payer token balance: ${feePayerBalance} IHR`);
    
    if (feePayerBalance < amount) {
      console.log(`\n⚠️ Not enough tokens to send ${amount} IHR. We only have ${feePayerBalance} IHR.`);
      console.log('Please contact the token creator to get some tokens first.');
      console.log(`The mint authority is: 7v8UUEYC151uXUtBXKe49tVWfPPosSKoJaAfxr4H7jBX`);
      process.exit(1);
    }
    
    console.log('\n=== Step 5: Sending tokens to your wallet ===');
    
    // Calculate the token amount with decimals
    const tokenAmount = BigInt(Math.round(amount * Math.pow(10, IHR_DECIMALS)));
    
    // Create a transaction to transfer tokens
    const transferTx = new web3.Transaction();
    
    // Add the transfer instruction
    const transferInstruction = splToken.createTransferInstruction(
      feePayerTokenAddress,
      yourTokenAddress,
      feePayer.publicKey,
      tokenAmount
    );
    
    transferTx.add(transferInstruction);
    
    // Send and confirm the transaction
    const transferSignature = await web3.sendAndConfirmTransaction(
      connection,
      transferTx,
      [feePayer]
    );
    
    console.log('Transfer successful!');
    console.log('Signature:', transferSignature);
    console.log(`${amount} IHR tokens sent to ${walletPublicKey.toString()}`);
    console.log(`View transaction: https://explorer.solana.com/tx/${transferSignature}?cluster=devnet`);
    
    console.log('\n=== Step 6: Verifying final balances ===');
    
    // Check your token balance
    yourTokenAccount = await splToken.getAccount(connection, yourTokenAddress);
    const yourFinalBalance = Number(yourTokenAccount.amount) / Math.pow(10, IHR_DECIMALS);
    
    console.log(`Your final token balance: ${yourFinalBalance} IHR`);
    
    console.log('\n✅ Token account setup and funding complete!');
    console.log('You should now be able to send IHR tokens from your wallet in the app.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 