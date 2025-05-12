const { 
  clusterApiUrl, 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL 
} = require('@solana/web3.js');
const { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} = require('@solana/spl-token');
const bs58 = require('bs58');

// DO NOT SHARE OR COMMIT THIS FILE WITH THE PRIVATE KEY
async function main() {
  try {
    // Connect to devnet
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Token details
    const tokenName = "IH RAHAT";
    const tokenSymbol = "IHR";
    const tokenDecimals = 9; // Standard for most Solana tokens
    const tokenSupply = 1_000_000; // 1 million tokens

    console.log(`Creating token: ${tokenName} (${tokenSymbol})`);
    console.log(`Decimals: ${tokenDecimals}`);
    console.log(`Supply: ${tokenSupply}`);
    console.log('Network: Devnet');
    console.log('-----------------------------------');
    
    // Import the wallet from private key
    // CAUTION: Never share or expose your private key
    const privateKeyBase58 = "4UWDi7eX7Bite252fqGMdsSrRrWLCpHinVQTHqmFUZjARqxD2vJinKZ7638MMyffiF9wc4q622n83XiLeFBxS1fL";
    const privateKeyBuffer = bs58.decode(privateKeyBase58);
    const fromWallet = Keypair.fromSecretKey(privateKeyBuffer);
    console.log(`Using wallet: ${fromWallet.publicKey.toString()}`);
    
    // Check if the wallet has enough SOL
    const walletBalance = await connection.getBalance(fromWallet.publicKey);
    console.log(`Wallet balance: ${walletBalance / LAMPORTS_PER_SOL} SOL`);
    
    if (walletBalance < 0.05 * LAMPORTS_PER_SOL) {
      console.log('Requesting airdrop to cover transaction fees...');
      const signature = await connection.requestAirdrop(
        fromWallet.publicKey,
        0.1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);
      console.log('Airdrop received!');
    }
    
    // Create a new token mint
    console.log('Creating token mint...');
    const mint = await createMint(
      connection,
      fromWallet,
      fromWallet.publicKey,
      fromWallet.publicKey,
      tokenDecimals
    );
    console.log(`Token mint created: ${mint.toString()}`);
    
    // Get the token account of the wallet address
    console.log('Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      fromWallet.publicKey
    );
    console.log(`Token account created: ${tokenAccount.address.toString()}`);
    
    // Mint tokens to the token account
    console.log(`Minting ${tokenSupply} tokens to owner...`);
    const mintSignature = await mintTo(
      connection,
      fromWallet,
      mint,
      tokenAccount.address,
      fromWallet.publicKey,
      tokenSupply * (10 ** tokenDecimals)
    );
    console.log('Token minting signature:', mintSignature);
    
    console.log('\nToken Creation Successful!');
    console.log('==============================');
    console.log(`Token Name: ${tokenName}`);
    console.log(`Token Symbol: ${tokenSymbol}`);
    console.log(`Total Supply: ${tokenSupply}`);
    console.log(`Decimals: ${tokenDecimals}`);
    console.log(`Token Address: ${mint.toString()}`);
    console.log(`Token Owner: ${fromWallet.publicKey.toString()}`);
    console.log(`Explorer URL: https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`);
    console.log('==============================');
    
    // Return just the token address at the end for easy copying
    console.log(`\nToken Address: ${mint.toString()}`);
    
  } catch (error) {
    console.error('Error creating token:', error);
  }
}

main(); 