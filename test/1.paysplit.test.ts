// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.
// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.

describe("PaySplitter contract", function () {
 // Mocha has four functions that let you hook into the the test runner's
 // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.
 // They're very useful to setup the environment for tests, and to clean it
 // up after they run.
 // A common pattern is to declare some variables, and assign them in the
 // `before` and `beforeEach` callbacks.
 let PaySplitter;
 let contract: Contract;
 let owner: SignerWithAddress;
 let addr1: SignerWithAddress;
 let addr2: SignerWithAddress;
 let addr3: SignerWithAddress;
 let addrs: SignerWithAddress[];
 let ownerWeight: number = 6;
 let weight1: number = 4;
 let weight2: number = 2;
 let weight3: number = 8;
 // `beforeEach` will run before each test, re-deploying the contract every
 // time. It receives a callback, which can be async.
 
 beforeEach(async function () {
   // Get the ContractFactory and Signers here.
   PaySplitter = await ethers.getContractFactory("PaySplitter");
   [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

   contract = await PaySplitter.deploy([owner.address, addr1.address], [ownerWeight,weight1]);
 });
 
 describe("Deployment", function () {
   
   it("Should set the right each weights", async function () {
     expect(await contract.weight(owner.address)).to.equal(ownerWeight);
     expect(await contract.weight(addr1.address)).to.equal(weight1);
   });
   it("Should set the right totalWeights", async function () {
     expect(await contract.totalWeights()).to.equal(ownerWeight + weight1);
   });
   it("Should set the right address", async function () {
     expect(await contract.payee(0)).to.equal(owner.address);
     expect(await contract.payee(1)).to.equal(addr1.address);
   });
   it("Should set the right role", async function () {
	 const adminRole = await contract.DEFAULT_ADMIN_ROLE();
	 const upgraderRole = await contract.UPGRADER_ROLE();
     expect(await contract.hasRole(adminRole, owner.address)).to.equal(true);
     expect(await contract.hasRole(upgraderRole, owner.address)).to.equal(true);
   });
 });
 
 describe("Transactions", function () {
   
   it("Should deposit properly", async function () {
	 let etherString: string = "1";
	 let wei: BigNumber = ethers.utils.parseEther(etherString)
     await contract.deposit({
		 value: wei
	 });
     expect(await contract.totalBalance()).to.equal(wei);
   });
   
//    it("Should fail if sender doesn’t have enough tokens", async function () {
//      const initialOwnerBalance = await contract.balanceOf(owner.address);
//      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
//      // `require` will evaluate false and revert the transaction.
//      await expect(
//        contract.connect(addr1).transfer(owner.address, 1)
//      ).to.be.revertedWith("Not enough tokens");
//      // Owner balance shouldn't have changed.
//      expect(await contract.balanceOf(owner.address)).to.equal(
//        initialOwnerBalance
//      );
//    });
   
//    it("Should update balances after transfers", async function () {
//      const initialOwnerBalance = await contract.balanceOf(owner.address);
//      // Transfer 100 tokens from owner to addr1.
//      await contract.transfer(addr1.address, 100);
//      // Transfer another 50 tokens from owner to addr2.
//      await contract.transfer(addr2.address, 50);
//      // Check balances.
//      const finalOwnerBalance = await contract.balanceOf(owner.address);
//      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);
//      const addr1Balance = await contract.balanceOf(addr1.address);
//      expect(addr1Balance).to.equal(100);
//      const addr2Balance = await contract.balanceOf(addr2.address);
//      expect(addr2Balance).to.equal(50);
//    });
 });
});