# 1inch Fusion+ - Tezos

## Overview

This project is a cross-chain bridge implementation developed for [Unite Defi](https://ethglobal.com/events/unite). It provides a solution for executing 1inch Fusion+ cross-chain orders between Tezos and Ethereum networks.

### Features

- [x] **Hashlock and timelock functionality** - Preserved on the Tezos side to ensure secure cross-chain transactions
- [x] **Signature verification** - Implemented on the Tezos side for validating swap requests
- [x] **Bidirectional swaps** - Token swaps are supported in both directions (Tezos ↔ Ethereum)
- [x] **On-chain execution** - Deployed and tested on Tezos Ghostnet and Local EVM Node
- [x] **Resolver server** - A lightweight resolver implemented to launch cross-chain order execution
- [x] **User interface** - Console application for easy interaction
- [ ] **Partial fills** - Not implemented

The system consists of:
1. Smart contracts deployed on both EVM-compatible chains and Tezos
2. A resolver service that receives cross-chain orders from clients and executes them on Tezos and Ethereum
3. A command-line interface application that allows users to swap tokens between Tezos and Ethereum networks

## Project Structure

- **`packages/client`** - Command-line interface application that allows users to swap tokens between Tezos and Ethereum networks
- **`packages/server`** - Resolver service that receives cross-chain orders from clients and executes them on Tezos and Ethereum
> **Note:** In this project, for simplicity, the server is composed of three logical parts:
> - **1InchBackend** – Creates and stores cross-chain orders.
> - **Resolver** – Executes orders, originates escrow contracts, and calls `withdraw` / `cancel`.
> - **Relayer** – Tracks the state of escrow contracts and forwards the user's secret to the resolver.

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

   Or use the `-o` flag to override existing `.env` files:
```bash
npm run build -- -o
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

## Example of Swap: Tezos → Ethereum

Use the `Client` application to run the following commands

1. **Check initial balances for maker and taker**

   Run the command:

   ```bash
   balances-all 
   ```

   This command displays the balance of all available tokens for the user (a.k.a. the `maker` or `me`),  and the balance of all available tokens for the resolver (a.k.a the `taker`).

2. **Create a cross-chain order**

   Run the `swap` command in the following format:

   ```bash
   swap 123 tez:usdt 123 eth:usdc
   ```

   After executing this command:

   - A cross-chain order will be created on the server with all necessary parameters.
   - The server will deploy smart contracts:
     - On the Tezos network, an `escrow_src` contract will be originated with the maker's (user's) funds locked.
     - On the Ethereum network, an `escrow_dst` contract will be deployed with the taker's (resolver's) funds locked.

3. **Withdraw funds (you have 1 minute to do this)**

   Run the `withdraw` command:

   ```bash
   withdraw last
   ```

   After executing this command:

   - The resolver will use the user's secret to call `withdraw` on both escrow contracts deployed on Tezos and Ethereum networks.
   - Funds will be unlocked from the smart contracts, completing the swap.
     - Funds from the `escrow_src` contract will be transferred to the taker (resolver).
     - Funds from the `escrow_dst` contract will be transferred to the maker (user).

4. **Check balances for maker and taker after swap**

   Run the command:

   ```bash
   balances-all 
   ```

   Compare the balances with those from step 1.

   - The user's balance on **Tezos** should be decreased by the corresponding amount.
   - The user's balance on **Ethereum** should be increased by the corresponding amount.
   - The resolver's balance on **Tezos** should be increased by the corresponding amount.
   - The resolver's balance on **Ethereum** should be decreased by the corresponding amount.

 
## Example of Swap: Ethereum → Tezos

Use the `Client` application to run the following commands

1. **Check initial balances for maker and taker**

   Run the command:

   ```bash
   balances-all 
   ```

   This command displays the balance of all available tokens for the user (a.k.a. the `maker` or `me`),  and the balance of all available tokens for the resolver (a.k.a the `taker`).

2. **Create a cross-chain order**

   Run the `swap` command in the following format:

   ```bash
   swap 123 eth:usdc 123 tez:usdt 
   ```

   After executing this command:

   - A cross-chain order will be created on the server with all necessary parameters.
   - The server will deploy smart contracts:
     - On the Ethereum network, an `escrow_src` contract will be originated with the maker's (user's) funds locked.
     - On the Tezos network, an `escrow_dst` contract will be deployed with the taker's (resolver's) funds locked.

3. **Withdraw funds (you have 1 minute to do this)**

   Run the `withdraw` command:

   ```bash
   withdraw last
   ```

   After executing this command:

   - The resolver will use the user's secret to call `withdraw` on both escrow contracts deployed on Tezos and Ethereum networks.
   - Funds will be unlocked from the smart contracts, completing the swap.
     - Funds from the `escrow_src` contract will be transferred to the taker (resolver).
     - Funds from the `escrow_dst` contract will be transferred to the maker (user).

4. **Check balances for maker and taker after swap**

   Run the command:

   ```bash
   balances-all 
   ```

   Compare the balances with those from step 1.

   - The user's balance on **Tezos** should be increased by the corresponding amount.
   - The user's balance on **Ethereum** should be decreased by the corresponding amount.
   - The resolver's balance on **Tezos** should be decreased by the corresponding amount.
   - The resolver's balance on **Ethereum** should be increased by the corresponding amount.

 
## Example of Cancel: Tezos → Ethereum

Use the `Client` application to run the following commands

1. **Check initial balances for maker and taker**

   Run the command:

   ```bash
   balances-all 
   ```

   This command displays the balance of all available tokens for the user (a.k.a. the `maker` or `me`),  and the balance of all available tokens for the resolver (a.k.a the `taker`).

2. **Create a cross-chain order**

   Run the `swap` command in the following format:

   ```bash
   swap 123 tez:usdt 123 eth:usdc
   ```

   After executing this command:

   - A cross-chain order will be created on the server with all necessary parameters.
   - The server will deploy smart contracts:
     - On the Tezos network, an `escrow_src` contract will be originated with the maker's (user's) funds locked.
     - On the Ethereum network, an `escrow_dst` contract will be deployed with the taker's (resolver's) funds locked.

3. **Wait 70 seconds or more**

   Wait until the withdrawal period expires.

4. **Try withdraw funds**

   Run the `withdraw` command:

   ```bash
   withdraw last
   ```

   The corresponding error should be displayed in console.

5. **Cancel the swap**

   Run the `cancel` command:

   ```bash
   cancel last
   ```

   After executing this command:

   - The resolver will call `cancel` on both escrow contracts deployed on Tezos and Ethereum networks.
   - Funds will be returned back to the maker and taker respectively.
     - Funds from the `escrow_src` contract will be transferred to the maker (user).
     - Funds from the `escrow_dst` contract will be transferred to the taker (resolver).

6. **Check balances for maker and taker after swap**

   Run the command:

   ```bash
   balances-all 
   ```

   Compare the balances with those from step 1. Balanced should be the same.

## Example of Cancel: Ethereum → Tezos

Use the `Client` application to run the following commands

1. **Check initial balances for maker and taker**

   Run the command:

   ```bash
   balances-all 
   ```

   This command displays the balance of all available tokens for the user (a.k.a. the `maker` or `me`),  and the balance of all available tokens for the resolver (a.k.a the `taker`).

2. **Create a cross-chain order**

   Run the `swap` command in the following format:

   ```bash
   swap 123 eth:usdc 123 tez:usdt
   ```

   After executing this command:

   - A cross-chain order will be created on the server with all necessary parameters.
   - The server will deploy smart contracts:
     - On the Ethereum network, an `escrow_src` contract will be originated with the maker's (user's) funds locked.
     - On the Tezos network, an `escrow_dst` contract will be deployed with the taker's (resolver's) funds locked.

3. **Wait 70 seconds or more**

   Wait until the withdrawal period expires.

4. **Try withdraw funds**

   Run the `withdraw` command:

   ```bash
   withdraw last
   ```

   The corresponding error should be displayed in console.

5. **Cancel the swap**

   Run the `cancel` command:

   ```bash
   cancel last
   ```

   After executing this command:

   - The resolver will call `cancel` on both escrow contracts deployed on Tezos and Ethereum networks.
   - Funds will be returned back to the maker and taker respectively.
     - Funds from the `escrow_src` contract will be transferred to the maker (user).
     - Funds from the `escrow_dst` contract will be transferred to the taker (resolver).

6. **Check balances for maker and taker after swap**

   Run the command:

   ```bash
   balances-all 
   ```

   Compare the balances with those from step 1. Balanced should be the same.
