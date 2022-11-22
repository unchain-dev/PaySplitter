# Paysplit

Paysplit is an ethereum smart contract which allows the secure distribution of ETH and any ERC20 tokens.

## Clone the repository

```zsh
git clone git@github.com:unchain-dev/brightmoments-paymentsplitter.git
```

- コントラクト: `contracts/PaySplitter.sol`
- デプロイスクリプト: `scripts/deploy.ts`
- テストスクリプト: `test/1.paysplit.test.ts`

## 支払いの受け取り分配コントラクトを完成させよう！

1. コントラクトをバージョンアップする可能性を見越し、`PaySplitter`コントラクトは ` Initializable` と `AccessControlUpgradeable` と `UUPSUpgradeable` を継承している。他にも継承したい規格などがあれば自由に追加しよう。
2. `PaySplitter.sol` 45 行目には、コントラクトをインスタンス化する際の初期設定を記述しよう。例えば、deploy する時に payee と weight を入力したい、といったような設定である。
3. `PaySplitter.sol` 49 行目には、スマートコントラクトを用いた収益分配のロジックを実装しよう。セキュリティと使いやすさの両方を意識した実装が求められる。(用途: recipient 達のアドレス、及び受け取り割合の指定された入金に対し、それぞれの recipient は任意のタイミングで自身の分配を受け取れる)

## 判定項目（優先順）

1. 安全性
2. 分かりやすさ/使いやすさ
3. ガス最適化

## 使用法

型生成

```
yarn typechain
```

テスト実行

```
yarn test
```

コントラクトをデプロイ

```zsh
hardhat run --network [YOUR_NETWORK] scripts/deploy.ts
```

Etherscan 認証

```zsh
npx hardhat verify --network [YOUR_NETWORK] [DEPLOYED_CONTRACT_ADDRESS]
```
