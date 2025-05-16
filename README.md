# TRD Token

A Hardhat-based Ethereum project implementing the TRD ERC-20 token smart contract for Digital Exchange Mongolia JSC.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Compiling Contracts](#compiling-contracts)
- [Running Tests](#running-tests)
- [License](#license)

## Overview

This project contains the TRD ERC-20 token smart contract, a loyalty token for Digital Exchange Mongolia JSC. It is written in Solidity and uses Hardhat for development, testing, and deployment. The project leverages OpenZeppelin libraries for secure and standard token implementation.

## Project Structure

- `contracts/` — Solidity smart contracts (main: `TRD.sol`)
- `test/` — Hardhat test scripts (main: `TRD Test.ts`)
- `artifacts/` — Compiled contract artifacts
- `typechain-types/` — TypeScript typings for contracts
- `hardhat.config.ts` — Hardhat configuration

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure the environment:**
   - Edit `hardhat.config.ts` for network and account settings as needed.

## Compiling Contracts

To compile the smart contracts:

```bash
npx hardhat compile
```

## Running Tests

To run the test suite:

```bash
npx hardhat test
```

## License

This project is licensed under the MIT License.
