# Paysplit

Paysplit is an ethereum smart contract which allows the secure distribution of ETH and any ERC20 tokens.

## Clone the repository

```zsh
git clone git@github.com:unchain-dev/brightmoments-paymentsplitter.git
```

## Usage

Generate contract typings

```
yarn typechain
```

test the contracts:

```
yarn test
```

Deploy contract:

```zsh
hardhat run --network [YOUR_NETWORK] scripts/deploy.ts
```

Verify on Etherscan:

```zsh
npx hardhat verify --network [YOUR_NETWORK] [DEPLOYED_CONTRACT_ADDRESS]
```

TODO:

- [x] write markdown
- [x] create shortcut scripts
- [ ] create repo for tomo
