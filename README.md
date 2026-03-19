# ♟️ Stackchess - Onchain Chess on Stacks

> **Complete React + Clarity integration documentation**
> Play chess and wager STX securely on the Stacks blockchain ⚡

[![Stacks](https://img.shields.io/badge/Stacks-Ready-purple)](https://stacks.co) [![Clarity](https://img.shields.io/badge/Clarity-2.0-blue)](https://clarity-lang.org) [![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)

Welcome to **Stackchess**, a fully decentralized chess application built on the Stacks blockchain. Stackchess enables players to engage in PvP chess matches, completely tracked and resolved using a Clarity smart contract state-machine, with STX token wagers on the line.

---

## 🏗️ Project Structure

The repository is organized into a monorepo containing both the frontend web application and the Clarity smart contracts.

```text
stackchess/
├── frontend/      # React + Vite web application
└── contract/      # Clarinet project with Clarity smart contracts
```

---

## 🚀 Quick Start

### 1. Running the Frontend

The frontend is a modern React application powered by Vite, providing the chess logic, UI, and Stacks wallet integration.

```bash
git clone https://github.com/morelucks/stackchess.git
cd stackchess/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Your client will be running locally at `http://localhost:5173` with optimistic updates and seamless blockchain connectivity.

### 2. Developing the Smart Contract

The core game logic and STX wagering system are managed by a Clarity smart contract (`stackchess.clar`). You need [Clarinet](https://github.com/hirosystems/clarinet) installed to interact with it.

```bash
cd stackchess/contract

# Check the syntax of the Clarity contracts
clarinet check

# Run the Clarinet console to interact locally
clarinet console
```

---

## 📚 Technical Architecture

### **The Frontend (`frontend/`)**
- **Framework**: React + Vite + TypeScript
- **Styling**: TailwindCSS
- **State Management**: React `useReducer` for complex chess logic, combined with Context API.
- **Blockchain Integration**: (Planned) `@stacks/connect` for wallet authentication and transaction signing.

### **The Smart Contract (`contract/`)**
- **Language**: Clarity
- **Core Features**:
  1. **Game Creation**: Players escrow STX to initialize a match (`create-game`).
  2. **Matchmaking**: Opponents match the wager to join (`join-game`).
  3. **State Machine**: Sequential validation of turns using FEN/ASCII board states (`submit-move`).
  4. **Resolution**: Securely handles forfeits (`resign`) or mutually/Oracle-agreed game resolutions (`resolve-game`).

---

## 🎯 What You'll Learn

By exploring this repository, you'll see how to:
- Structure a monorepo for Stacks DApp development.
- Build complex game state handlers in React.
- Write robust, trustless state-machines in Clarity to track off-chain game progression securely.

---

## 🛠️ Tech Stack

```
Frontend:  React + Vite + TypeScript + TailwindCSS
State:     Context API + useReducer
Wallet:    Stacks Wallet (Leather/Xverse)
Contract:  Clarity + Clarinet
```

---

## 🌟 Key Features

**⚡ Instant Feedback**
- Playable purely in the browser with local move validation.
- Background blockchain confirmation without interrupting gameplay.

**🔧 Developer Experience**
- Complete TypeScript integration for strict type-safety.
- Separated boundaries between the `contract` and `frontend`.
- Zero-error ESLint configuration and production-ready `npm run build` process.

---

**Ready to build the future of onchain gaming?** Jump into the `frontend/` and `contract/` directories to begin! 🚀
