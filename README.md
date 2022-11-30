# Paysplit

Paysplit is an ethereum smart contract which allows the secure distribution of ETH and any ERC20 tokens.

## Clone the repository

```zsh
git clone git@github.com:unchain-dev/PaySplitter.git
```

- コントラクト: `contracts/PaySplitter.sol`
- デプロイスクリプト: `scripts/deploy.ts`
- テストスクリプト: `test/1.paysplit.test.ts`

## 支払いの受け取り分配コントラクトを完成させよう！

1. コントラクトをバージョンアップする可能性を見越し、`PaySplitter`コントラクトは ` Initializable` と `AccessControlUpgradeable` と `UUPSUpgradeable` を継承している。他にも継承したい規格などがあれば自由に追加しよう。
2. `PaySplitter.sol` 45 行目には、コントラクトをインスタンス化する際の初期設定を記述しよう。(payee, weight を設定しよう)
3. `PaySplitter.sol` 49 行目には、スマートコントラクトを用いた収益分配のロジックを実装しよう。セキュリティと使いやすさの両方を意識した実装が求められる。\
   要件定義:
   - a) sender は、recipientA が **X $TOKEN**, recipientB が **Y $TOKEN**、recipientC が Z $TOKEN を、それぞれ claim できるよう **K $TOKEN** 入金できる。この時、以下が成り立つ。
     - **K** = (**X**+**Y**+**Z**)
     - {**K**,**X**,**Y**,**Z**} ∈ **ℝ**
     - 0 < {**K**,**X**,**Y**,**Z**}
   - b) 全ての recipient はそれぞれの任意のタイミングで自身の分け前を claim できる

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
