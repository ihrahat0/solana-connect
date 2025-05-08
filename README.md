# Solana Connect

A beautiful Next.js application for connecting to the Solana blockchain using the Solana wallet adapter. This app provides a clean, modern interface for users to connect their Solana wallets like Phantom, Solflare, and others.

## Features

- Beautiful gradient background with animated elements
- Responsive design that works on mobile and desktop
- Support for multiple Solana wallets
- Styled wallet connection modal
- Built with Next.js and TypeScript

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter

## Getting Started

1. Clone the repository
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

## Configuration

The application connects to the Solana devnet by default. You can change this to testnet or mainnet-beta by modifying the `network` variable in `src/providers/WalletContextProvider.tsx`.

## Learn More

To learn more about the Solana wallet adapter:
- [Solana Wallet Adapter Documentation](https://github.com/solana-labs/wallet-adapter)
- [Solana Development Documentation](https://solana.com/developers)

## License

MIT
