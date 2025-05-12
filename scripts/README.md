# IHR Token Scripts

This directory contains scripts for managing IHR tokens on Solana's devnet.

## Prerequisites

- Node.js installed
- npm or yarn installed
- A Solana wallet address on devnet

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. The first time you run the scripts, they will:
   - Generate a new keypair and save it to `airdrop-authority.json`
   - Request SOL from the devnet faucet to pay for transaction fees

## Available Scripts

### Check Token Accounts

Check token accounts and balances for any wallet address:

```bash
npm run check -- <WALLET_ADDRESS>
```

Example:
```bash
npm run check -- 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK
```

### Create Token Account

Create a token account for any wallet address:

```bash
npm run create -- <WALLET_ADDRESS>
```

Example:
```bash
npm run create -- 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK
```

### Fix Token Issue

Create token accounts and attempt to send tokens to a wallet:

```bash
npm run fix -- <WALLET_ADDRESS> <AMOUNT>
```

Example:
```bash
npm run fix -- 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK 100
```

### Airdrop Script (Requires Mint Authority)

Attempts to airdrop IHR tokens to any wallet address on Solana's devnet:

```bash
npm run airdrop -- <RECIPIENT_ADDRESS> <AMOUNT>
```

Example:
```bash
npm run airdrop -- 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK 100
```

### Transfer Script

Allows you to transfer IHR tokens from the script's keypair to any other wallet address:

```bash
npm run transfer -- <RECIPIENT_ADDRESS> <AMOUNT>
```

Example:
```bash
npm run transfer -- 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK 10
```

### Mint Tokens (For Token Creator Only)

For the token creator to mint new tokens to any wallet:

```bash
npm run mint -- <RECIPIENT_ADDRESS> <AMOUNT>
```

Example:
```bash
npm run mint -- 4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK 100
```

**Note:** This script requires the mint authority's private key in a file called `mint-authority.json`.

## Troubleshooting

### Error: You may not be the mint authority for this token

If you see this error, it means the keypair generated doesn't have permission to mint new IHR tokens.

#### Solution:

Contact the token creator to get the correct mint authority keypair or to have them airdrop tokens to your address.

### Error: Token account not found

If you see this error when trying to send tokens in the app, make sure to:

1. Click the "Create Account" button in the app first to create your token account
2. Run the `fix` script to create token accounts and attempt to send tokens
3. Contact the token creator to mint tokens to your address

## For the Token Creator

If you are the token creator (with address 7v8UUEYC151uXUtBXKe49tVWfPPosSKoJaAfxr4H7jBX), you can:

1. Create a file called `mint-authority.json` with your private key
2. Use the `mint` script to send tokens to any wallet address
3. Share the `check` and `create` scripts with users to help them set up their token accounts

## Important Notes

- These scripts only work on Solana's devnet
- The IHR token address is: `FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci`
- The mint authority is: `7v8UUEYC151uXUtBXKe49tVWfPPosSKoJaAfxr4H7jBX`
- Make sure your wallet is connected to devnet when using the tokens 