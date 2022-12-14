import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

import { calculateBalance } from "./utils/calculate";

// Mocha has four functions that let you hook into the the test runner's lifecyle: `before`, `beforeEach`, `after`, `afterEach`.

describe("Haku's PaySplitter", function () {
  let PaySplitterFactory: ContractFactory;
  let contract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let ownerAmount = 6;
  let Amount1 = 4;
  let Amount2 = 2;
  let Amount3 = 8;
  let totalAmount: number;
  let totalBalance: BigNumber;
  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    totalAmount = 0;
    totalBalance = BigNumber.from("0");
    PaySplitterFactory = await ethers.getContractFactory("PaySplitter_Haku");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract = await upgrades.deployProxy(PaySplitterFactory);
    let tx = await contract.addPayee(
      [owner.address, addr1.address],
      [ownerAmount, Amount1],
    );
    await tx.wait();
  });

  describe("Deployment", function () {
    it("Should set each Amounts correctly", async function () {
      expect(await contract.amount(owner.address)).to.equal(ownerAmount);
      expect(await contract.amount(addr1.address)).to.equal(Amount1);
    });
    it("Should set the right totalAmounts", async function () {
      expect(await contract.totalAmounts()).to.equal(ownerAmount + Amount1);
    });
    it("Should set the right role", async function () {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(adminRole, owner.address)).to.equal(true);
    });
  });

  describe("Transactions common", function () {
    it("Should deposit properly", async function () {
      await expect(
        contract.deposit({
          value: 1,
        }),
      ).not.to.be.reverted;
      await expect(
        contract.deposit({
          value: 9,
        }),
      ).not.to.be.reverted;
      await expect(
        contract.deposit({
          value: 1,
        }),
      ).to.be.reverted;
    });

    it("Should fallback() properly", async function () {
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: 1,
        }),
      ).not.to.be.reverted;
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: 9,
        }),
      ).not.to.be.reverted;
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: 1,
        }),
      ).to.be.reverted;
    });

    it("Should add payees properly", async function () {
      let tx = await contract.addPayee(
        [addr2.address, addr3.address],
        [Amount2, Amount3],
      );
      await tx.wait();
      expect(await contract.totalAmounts()).to.equal(
        ownerAmount + Amount1 + Amount2 + Amount3,
      );
      expect(await contract.amount(addr2.address)).to.equal(Amount2);
      expect(await contract.amount(addr3.address)).to.equal(Amount3);
    });

    it("Should delete a payee properly", async function () {
      let tx = await contract.deletePayee([addr1.address]);
      await tx.wait();
      expect(await contract.totalAmounts()).to.equal(ownerAmount);
      expect(await contract.amount(addr1.address)).to.equal(0);
    });

    it("Should claim properly", async function () {
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: 10,
        }),
      ).not.to.be.reverted;
      await expect(contract.claim()).not.to.be.reverted;
      await expect(contract.claim()).to.be.reverted;
    });
  });

  describe("Transactions deposit revert", function () {
    it("Should fail if sender doesn't send enough eth", async function () {
      let etherString = "0";
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: ethers.utils.parseEther(etherString),
        }),
      ).to.be.revertedWith("The value must be bigger than 0");
      await expect(
        addr1.sendTransaction({
          to: contract.address,
          value: ethers.utils.parseEther(etherString),
        }),
      ).to.be.revertedWith("The value must be bigger than 0");
    });
    it("Should fail if there is no payees when deposit", async function () {
      let tx = await contract.deletePayee([owner.address, addr1.address]);
      await tx.wait();
      let etherString = "1";
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: ethers.utils.parseEther(etherString),
        }),
      ).to.be.revertedWith("You need one payee at least");
    });
    it("Should fail if deposit value over amounts", async function () {
      await expect(
        owner.sendTransaction({
          to: contract.address,
          value: 11,
        }),
      ).to.be.revertedWith("msg.value over totalAmounts");
    });
  });

  describe("Transactions addPayee revert", function () {
    it("Should fail if non admin tries to do addPayee", async function () {
      let adminHexString: string = await contract.DEFAULT_ADMIN_ROLE();
      let errMsg = `AccessControl: account ${String(
        addr1.address.toLowerCase(),
      )} is missing role ${adminHexString}`;
      await expect(
        contract
          .connect(addr1)
          .addPayee([addr2.address, addr3.address], [3, 4]),
      ).to.be.revertedWith(errMsg);
    });
    it("Should fail if admin tries to do addPayee with diffrent length args", async function () {
      await expect(
        contract.addPayee([addr2.address, addr3.address], [3, 4, 5]),
      ).to.be.revertedWith("PaySplitter: payees and amounts length mismatch");
      await expect(
        contract.addPayee(
          [addr1.address, addr2.address, addr3.address],
          [3, 4],
        ),
      ).to.be.revertedWith("PaySplitter: payees and amounts length mismatch");
    });
    it("Should fail if admin tries to do addPayee with the address already added", async function () {
      await expect(
        contract.addPayee([addr2.address, addr1.address], [3, 4]),
      ).to.be.revertedWith("PaySplitter: account already has amounts");
      await expect(contract.addPayee([owner.address], [4])).to.be.revertedWith(
        "PaySplitter: account already has amounts",
      );
      let tx = await contract.addPayee([addr2.address, addr3.address], [3, 4]);
      await tx.wait();
      await expect(contract.addPayee([addr3.address], [4])).to.be.revertedWith(
        "PaySplitter: account already has amounts",
      );
    });
  });

  describe("Transactions deletePayee revert", function () {
    it("Should fail if non admin tries to do deletePayee", async function () {
      let adminHexString: string = await contract.DEFAULT_ADMIN_ROLE();
      let errMsg = `AccessControl: account ${String(
        addr1.address.toLowerCase(),
      )} is missing role ${adminHexString}`;
      await expect(
        contract.connect(addr1).deletePayee([addr1.address]),
      ).to.be.revertedWith(errMsg);
    });

    it("Should fail if there is no payees when deletePayee", async function () {
      let tx = await contract.deletePayee([owner.address, addr1.address]);
      await tx.wait();
      await expect(contract.deletePayee([owner.address])).to.be.revertedWith(
        "PaySplitter: no payees",
      );
    });
  });
});
