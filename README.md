# Solana Connect

A beautiful Next.js application for connecting to the Solana blockchain using the Solana wallet adapter. This app provides a clean, modern interface for users to connect their Solana wallets like Phantom, Solflare, and others.

## Features

- Beautiful gradient background with animated elements
- Responsive design that works on mobile and desktop
- Support for multiple Solana wallets
- Styled wallet connection modal
- Built with Next.js and TypeScript
- **Token Transfer**: Send SOL and SPL tokens to any Solana address
- **Custom Token**: Support for the IHR token created specifically for this app
- Support for embedded YouTube tutorial videos

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter
- Solana Web3.js
- Solana SPL-Token

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/solana-connect.git
   cd solana-connect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
```bash
npm run dev
   ```

## Wallet Support

This app supports several popular Solana wallets:

- Phantom
- Solflare
- Coinbase Wallet
- Torus Wallet
- Ledger Hardware Wallet

## Token Transfer

After connecting your wallet, you can:

1. Send SOL (native Solana token)
2. Send IHR tokens (our custom token)
3. Send other SPL tokens by providing the token mint address
4. View transaction status and history
5. Link directly to Solana Explorer for completed transactions

The app uses Solana's Devnet by default, so you can experiment without risking real funds.

## IHR Token

The app includes support for a custom token called "IH RAHAT" (IHR) deployed on Solana's devnet:

- **Token Address**: `FTGo5F681LepoU2qTasLtk325T2iX6F6onFHpvo5Hvci`
- **Decimals**: 9
- **Supply**: 1,000,000 IHR

### Using the IHR Token

1. Connect your wallet to Solana devnet
2. Click the "Create Account" button in the IHR token section to create your token account
3. Use the airdrop script to receive test tokens (see below)
4. Once you have tokens, you can send them to other addresses

### Token Scripts

The `scripts` directory contains helpful scripts for working with IHR tokens:

#### Airdrop Script

Allows you to airdrop IHR tokens to any wallet address on Solana's devnet.

1. Navigate to the scripts directory:
   ```bash
   cd scripts
   ```

2. Install script dependencies:
   ```bash
   npm install
   ```

3. Run the airdrop script:
   ```bash
   npm run airdrop -- <YOUR_WALLET_ADDRESS> <AMOUNT>
   ```

   Example:
   ```bash
   npm run airdrop -- 7KFAhQnBQ7qqQMfKvuuqBGUBzBfTjPLozKMo7jSiUgbN 100
   ```

#### Transfer Script

Allows you to transfer IHR tokens from the script's keypair to any other wallet address.

```bash
npm run transfer -- <RECIPIENT_ADDRESS> <AMOUNT>
```

Example:
```bash
npm run transfer -- 7KFAhQnBQ7qqQMfKvuuqBGUBzBfTjPLozKMo7jSiUgbN 10
```

### Troubleshooting Token Issues

If you encounter a `TokenAccountNotFoundError` when trying to send tokens:

1. Make sure you've clicked the "Create Account" button in the app first
2. Run the airdrop script to get some test tokens
3. Ensure your wallet is connected to Solana's devnet network
4. Check that you have sufficient token balance before sending

If the airdrop script fails with "You may not be the mint authority for this token":
- This is because the keypair generated doesn't have permission to mint new IHR tokens
- Use the transfer script instead to send tokens from an existing account

## Configuration

The application connects to the Solana devnet by default. You can change this to testnet or mainnet-beta by modifying the `network` variable in `src/providers/WalletContextProvider.tsx`.

## Learn More

To learn more about the Solana wallet adapter:
- [Solana Wallet Adapter Documentation](https://github.com/solana-labs/wallet-adapter)
- [Solana Development Documentation](https://solana.com/developers)
- [SPL-Token Program Documentation](https://spl.solana.com/token)

## License

MIT
