# Solana Connect

A beautiful Next.js application for connecting to the Solana blockchain using the Solana wallet adapter. This app provides a clean, modern interface for users to connect their Solana wallets like Phantom, Solflare, and others.

## Features

- Beautiful gradient background with animated elements
- Responsive design that works on mobile and desktop
- Support for multiple Solana wallets
- Styled wallet connection modal
- Built with Next.js and TypeScript
- **Token Transfer**: Send SOL and SPL tokens to any Solana address
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
2. Send SPL tokens by providing the token mint address
3. View transaction status and history
4. Link directly to Solana Explorer for completed transactions

The app uses Solana's Devnet by default, so you can experiment without risking real funds.

## Configuration

The application connects to the Solana devnet by default. You can change this to testnet or mainnet-beta by modifying the `network` variable in `src/providers/WalletContextProvider.tsx`.

## Learn More

To learn more about the Solana wallet adapter:
- [Solana Wallet Adapter Documentation](https://github.com/solana-labs/wallet-adapter)
- [Solana Development Documentation](https://solana.com/developers)
- [SPL-Token Program Documentation](https://spl.solana.com/token)

## License

MIT
