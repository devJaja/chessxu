# Chessxu Frontend

This is the React-based chess interface for Chessxu, integrated with the Stacks and Celo blockchains.

## Features
- **PvP Matchmaking**: Stake STX or CHESS tokens to challenge other players.
- **On-chain Validation**: Move strings and board states are recorded on the Stacks mainnet.
- **Stacks Authentication**: Integrated with Leather and Xverse wallets using `@stacks/connect`.

## Core Components
- `stacksService.js`: All contract interactions (create, join, move) are handled here.
- `UserContext`: Manages the global authentication state.
- `Board`: Standard chess board logic, synced with on-chain states for PvP mode.

## Development
1. Install dependencies: `npm install`
2. Run locally: `npm run dev`
3. Build for production: `npm run build`

## Requirements
- Stacks Wallet (Leather or Xverse)
- Some STX for transaction fees
