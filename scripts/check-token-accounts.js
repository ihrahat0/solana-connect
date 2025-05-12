/**
 * Script to check token accounts and balances for a wallet address
 * 
 * Usage: 
 * node check-token-accounts.js <WALLET_ADDRESS>
 * 
 * Example:
 * node check-token-accounts.js 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK
 */

const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');

// IHR token mint address
const IHR_TOKEN_MINT = 'FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci';

// Decimals for IHR token
const IHR_DECIMALS = 9;

async function main() {
  // Check command line arguments
  if (process.argv.length < 3) {
    console.log('Usage: node check-token-accounts.js <WALLET_ADDRESS>');
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

  console.log('Checking wallet:', walletPublicKey.toString());

  try {
    // Get SOL balance
    const solBalance = await connection.getBalance(walletPublicKey);
    console.log(`SOL Balance: ${solBalance / web3.LAMPORTS_PER_SOL} SOL`);

    // Get the token mint
    const mintPublicKey = new web3.PublicKey(IHR_TOKEN_MINT);
    
    // Check if the mint exists
    try {
      const mintInfo = await splToken.getMint(connection, mintPublicKey);
      console.log(`Token mint found: ${mintPublicKey.toString()}`);
      console.log(`Decimals: ${mintInfo.decimals}`);
      console.log(`Mint authority: ${mintInfo.mintAuthority?.toString() || 'None'}`);
      console.log(`Supply: ${Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)}`);
      
      // Find the associated token address
      const tokenAddress = await splToken.getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );
      
      console.log(`Expected token account address: ${tokenAddress.toString()}`);
      
      // Check if the token account exists
      try {
        const accountInfo = await connection.getAccountInfo(tokenAddress);
        
        if (accountInfo) {
          console.log('Token account exists');
          
          // Get token account info
          const tokenAccount = await splToken.getAccount(connection, tokenAddress);
          const uiAmount = Number(tokenAccount.amount) / Math.pow(10, IHR_DECIMALS);
          
          console.log(`Token balance: ${uiAmount} IHR`);
          console.log(`Token account owner: ${tokenAccount.owner.toString()}`);
        } else {
          console.log('Token account does not exist yet');
        }
      } catch (error) {
        console.log('Error checking token account:', error.message);
      }
      
      // List all token accounts owned by this wallet
      console.log('\nListing all token accounts owned by this wallet:');
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        walletPublicKey,
        { programId: splToken.TOKEN_PROGRAM_ID }
      );
      
      console.log(`Found ${tokenAccounts.value.length} token accounts:`);
      
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = splToken.AccountLayout.decode(tokenAccount.account.data);
        const mintAddress = new web3.PublicKey(accountData.mint);
        const amount = accountData.amount;
        
        // Try to get mint info to determine decimals
        let decimals = 0;
        try {
          const mintInfo = await splToken.getMint(connection, mintAddress);
          decimals = mintInfo.decimals;
        } catch (error) {
          // If we can't get mint info, assume 9 decimals
          decimals = 9;
        }
        
        const uiAmount = Number(amount) / Math.pow(10, decimals);
        
        console.log(`- Account: ${tokenAccount.pubkey.toString()}`);
        console.log(`  Mint: ${mintAddress.toString()}`);
        console.log(`  Balance: ${uiAmount}`);
        console.log(`  Is IHR token: ${mintAddress.toString() === IHR_TOKEN_MINT ? 'Yes' : 'No'}`);
      }
      
    } catch (error) {
      console.error('Error checking token mint:', error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 