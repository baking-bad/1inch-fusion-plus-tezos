# 1inch Fusion+ - Tezos

## Overview

This project is a cross-chain bridge implementation developed for a [Unite Defi](https://ethglobal.com/events/unite). It provides a solution for executing 1inch Fusion+ cross-chain orders between Tezos and Ethereum networks.

The system consists of:
1. Smart contracts deployed on both EVM-compatible chains and Tezos
2. A resolver service that receives cross-chain orders from clients and executes them on Tezos and Ethereum
3. A command-line interface application that allows users to swap tokens between Tezos and Ethereum networks

## Project Structure

- **`packages/client`** - Command-line interface application that allows users to swap tokens between Tezos and Ethereum networks
- **`packages/server`** - Resolver service that receives cross-chain orders from clients and executes them on Tezos and Ethereum
- **`packages/common`** - Shared utilities, types, and configuration helpers used across client, server and local-evm-node packages
- **`packages/local-evm-node`** - Local EVM node for testing that deploys escrow factory and resolver contracts on EVM-compatible chains
- **`contracts/evm`** - 1Finch Fusion+ Solidity smart contracts from https://github.com/1inch/cross-chain-resolver-example
- **`contracts/tezos`** - CameLIGO smart contracts for Tezos blockchain, including escrow and escrow factory contracts
- **`scripts`** - Build scripts and development utilities

## Requirements

- **Node.js**: >= 22.0.0
- **npm**: >= 10.9.0

## Installation

1. Clone the repository:
```bash
git clone https://github.com/baking-bad/1inch-fusion-plus-tezos.git
cd 1inch-fusion-plus-tezos
```

2. Install dependencies and build the project:
```bash
npm run build
```

## Run the Services

To run the system locally, follow these steps:

1. **Start the local EVM node**

   This service runs a local EVM environment and allows testing of swap execution on the EVM side.

   ```bash
   cd packages/local-evm-node
   npm start
   ```

2. **Start the resolver server**

   This service listens for cross-chain orders and executes them on both Tezos and Ethereum.

   ```bash
   cd packages/server
   npm start
   ```

3. **Start the client application**

   The CLI client allows you to initiate and finalize cross-chain swaps.

   ```bash
   cd packages/client
   npm start
   ```
