import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, utils } from "ethers";
import { ethers, upgrades } from "hardhat";

import type { PaySplitter_Tomo } from "../contracts/types/contracts/tomo/PaySplitter.sol";
import { calculateBalance } from "./utils/calculate";

// テストを書くと動作確認をより網羅的且つシステマチックに行うことができるので良いです。
// Boilerplateとしてセットアップだけ記述しておきます - sho

describe("Tomo's PaySplitter", function () {
  let PaySplitterFactory: ContractFactory;
  let contract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let ownerWeight = 6;
  let weight1 = 4;
  let weight2 = 2;
  let weight3 = 8;
  let totalWeight: number;
  let totalBalance: BigNumber;
  let id: number;
  let alice: PaySplitter_Tomo.PayeeStruct;
  let bob: PaySplitter_Tomo.PayeeStruct;
  let charlie: PaySplitter_Tomo.PayeeStruct;
  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    totalWeight = 0;
    totalBalance = BigNumber.from("0");

    PaySplitterFactory = await ethers.getContractFactory("PaySplitter_Tomo");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    contract = await upgrades.deployProxy(PaySplitterFactory);
  });

  describe("Deployment", function () {
    it("Should set the right totalWeight", async function () {
      expect(await contract.totalWeight(0)).to.equal(totalWeight);
    });
    it("Should set the right role", async function () {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(adminRole, owner.address)).to.equal(true);
    });
  });

  describe("Setup", function () {
    // usecaseとしてはpayment IDはコントラクトが発行/管理してほしい。
    // 現状DEFAULT_ADMIN_ROLEユーザーがaddPayee()時に指定しなければいけないが、
    // このようにコントラクトownerのみがpaymentを発行することができる状態だと、
    // つまり支払い者が各自このcontractをdeployしなければならないので、使いづらい。

    it("add payment Id with correct total weight", async function () {
      id = 0;
      [alice, bob, charlie] = [
        {
          w: 50,
          a: addr1.address,
          n: utils.formatBytes32String("Alice"),
        },
        {
          w: 37,
          a: addr2.address,
          n: utils.formatBytes32String("Bob"),
        },
        {
          w: 13,
          a: addr3.address,
          n: utils.formatBytes32String("Charlie"),
        },
      ];
      expect(await contract.totalWeight(id)).to.equal(0);

      await contract.addPayee(id, [alice, bob, charlie]);
      expect(await contract.totalWeight(id)).to.equal(
        Number(await alice.w) + Number(await bob.w) + Number(await charlie.w),
      );

      expect(await contract.isPayee[0][await alice.a]).to.equal(true);
      expect(await contract.isPayee[0][await bob.a]).to.equal(true);
      expect(await contract.isPayee[0][await charlie.a]).to.equal(true);
    });

    it("Should reassign weights properly", async function () {
      id = 0;
      [alice, bob, charlie] = [
        {
          w: 50,
          a: addr1.address,
          n: utils.formatBytes32String("Alice"),
        },
        {
          w: 37,
          a: addr2.address,
          n: utils.formatBytes32String("Bob"),
        },
        {
          w: 13,
          a: addr3.address,
          n: utils.formatBytes32String("Charlie"),
        },
      ];
      await contract.addPayee(id, [alice, bob, charlie]);
      await contract.changeWeight(id, addr1.address, 50 + 20);
      console.log(await contract.totalWeight(id));
      expect(await contract.totalWeight(id)).to.equal(
        Number(await alice.w) +
          Number(await bob.w) +
          Number(await charlie.w) +
          20,
      );
    });
  });

  ///////////////////////////////////
  ////   以下テスト              //////
  ///////////////////////////////////
});
