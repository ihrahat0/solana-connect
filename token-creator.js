const { 
  clusterApiUrl, 
  Connection, 
  Keypair, 
  PublicKey, 
  LAMPORTS_PER_SOL 
} = require('@solana/web3.js');
const { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} = require('@solana/spl-token');

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
    
    // Generate a new wallet keypair for testing (in production you'd use your own)
    const payer = Keypair.generate();
    
    console.log(`Generated wallet: ${payer.publicKey.toString()}`);
    console.log(`Requesting airdrop to cover transaction fees...`);
    
    // Request airdrop
    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      2 * LAMPORTS_PER_SOL // 2 SOL
    );
    
    await connection.confirmTransaction(airdropSignature);
    console.log('Airdrop received!');
    
    // Create the token mint
    console.log('Creating token mint...');
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,  // mint authority
      payer.publicKey,  // freeze authority
      tokenDecimals
    );
    
    console.log(`Token mint created: ${mint.toString()}`);
    
    // Create a token account
    console.log('Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
    
    console.log(`Token account created: ${tokenAccount.address.toString()}`);
    
    // Mint the tokens
    console.log(`Minting ${tokenSupply} tokens to owner...`);
    const mintSignature = await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer.publicKey,
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
    console.log(`Token Owner: ${payer.publicKey.toString()}`);
    console.log(`Explorer URL: https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`);
    console.log('==============================');
    
    // Return just the token address at the end for easy copying
    console.log(`\nToken Address: ${mint.toString()}`);
    console.log(`Token Owner Private Key (SAVE THIS): ${Buffer.from(payer.secretKey).toString('base64')}`);
    
  } catch (error) {
    console.error('Error creating token:', error);
  }
}

main();
