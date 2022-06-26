// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { calculateBalance, subtracteWei, addWei } from './utils/calculate'
import { string } from "hardhat/internal/core/params/argumentTypes";
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

	describe("Transactions common", function () {

		it("Should deposit properly", async function () {
			let etherString: string = "1";
			let wei: BigNumber = ethers.utils.parseEther(etherString)
			let tx = await contract.deposit({
					value: wei
				});
			await tx.wait();
			expect(await contract.totalBalance()).to.equal(wei);
			
			let totalWeight: number = ownerWeight + weight1;

			wei = await calculateBalance(etherString, totalWeight, ownerWeight);
			expect(await contract.balance(owner.address)).to.equal(wei);
			wei = await calculateBalance(etherString, totalWeight, weight1);
			expect(await contract.balance(addr1.address)).to.equal(wei);

		});

		it("Should add payees properly", async function () {
			let tx = await contract.addPayee([addr2.address, addr3.address], [weight2, weight3]);
			await tx.wait();
			expect(await contract.totalWeights()).to.equal(ownerWeight + weight1 + weight2 + weight3);
			expect(await contract.weight(addr2.address)).to.equal(weight2);
			expect(await contract.weight(addr3.address)).to.equal(weight3);
			expect(await contract.payee(2)).to.equal(addr2.address);
			expect(await contract.payee(3)).to.equal(addr3.address);
		});

		it("Should delete a payee properly", async function () {
			let tx = await contract.deletePayee(addr1.address);
			await tx.wait();
			expect(await contract.totalWeights()).to.equal(ownerWeight);
			expect(await contract.balance(addr1.address)).to.equal(0);
			expect(await contract.weight(addr1.address)).to.equal(0);
		});

		it("Should release properly", async function () {
			let etherString: string = "1";
			let wei: BigNumber = ethers.utils.parseEther(etherString);
			let tx = await contract.deposit({
				value: wei
			});
			let receipt = await tx.wait();
			let totalBalance: BigNumber = await contract.totalBalance();
			let totalWeight: number = ownerWeight + weight1;

			wei = await calculateBalance(etherString, totalWeight, ownerWeight);
			// let beforeReleaseBalance = await owner.getBalance();
			tx = await contract.release();
			receipt = await tx.wait();
			// let releaseGasUsed = receipt.gasUsed;
			// expect(await addWei(await owner.getBalance(), releaseGasUsed)).to.equal(await addWei(beforeReleaseBalance, wei))
			expect(await contract.balance(owner.address)).to.equal(0);
	
			expect(await contract.totalBalance()).to.equal(await subtracteWei(totalBalance, wei));
		});
	});

	describe("Transactions deposit revert", function () {

		it("Should fail if sender doesn’t send enough eth", async function () {
			let etherString: string = "0";
			await expect(
				contract.deposit({
					value: ethers.utils.parseEther(etherString)
				})
			).to.be.revertedWith("The value must be bigger than 0");
			await expect(
				addr1.sendTransaction({
					to: contract.address,
					value: ethers.utils.parseEther(etherString)
				})
			).to.be.revertedWith("The value must be bigger than 0");
		});
		it("Should fail if there is no payees when deposit", async function () {
			let tx = await contract.deletePayee(owner.address);
			await tx.wait()
			tx = await contract.deletePayee(addr1.address);
			await tx.wait()
			let etherString: string = "1";
			await expect(
				contract.deposit({
					value: ethers.utils.parseEther(etherString)
				})
			).to.be.revertedWith("You need one payee at least");
		});
	});

	describe("Transactions addPayee revert", function () {
		it("Should fail if non admin tries to do addPayee", async function () {
			let adminHexString: string = await contract.DEFAULT_ADMIN_ROLE();
			// let errMsg: string = "AccessControl: account " + String(ethers.utils.getAddress(addr1.address)) + " is missing role " + adminHexString;
			let errMsg: string = "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8" + " is missing role " + adminHexString;
			// console.log(errMsg);
			await expect(
				contract.connect(addr1).addPayee([addr2.address, addr3.address], [3,4])
			).to.be.revertedWith(errMsg);
		});
		it("Should fail if admin tries to do addPayee with diffrent length args", async function () {
			await expect(
				contract.addPayee([addr2.address, addr3.address], [3,4,5])
			).to.be.revertedWith("PaySplitter: payees and weights length mismatch");
			await expect(
				contract.addPayee([addr1.address, addr2.address, addr3.address], [3,4])
			).to.be.revertedWith("PaySplitter: payees and weights length mismatch");
		});
		it("Should fail if admin tries to do addPayee with the address already added", async function () {
			await expect(
				contract.addPayee([addr2.address, addr1.address], [3,4])
			).to.be.revertedWith("PaySplitter: account already has weights");
			await expect(
				contract.addPayee([owner.address], [4])
			).to.be.revertedWith("PaySplitter: account already has weights");
			let tx = await contract.addPayee([addr2.address, addr3.address], [3,4]);
			await tx.wait();
			await expect(
				contract.addPayee([addr3.address], [4])
			).to.be.revertedWith("PaySplitter: account already has weights");
		});
		it("Should fail if weights are not right", async function () {
			await expect(
				contract.addPayee([addr2.address, addr3.address], [0,4])
			).to.be.revertedWith("PaySplitter: 0 < weight <= 10000");
			await expect(
				contract.addPayee([addr2.address], [10001])
			).to.be.revertedWith("PaySplitter: 0 < weight <= 10000");
		});
	});
});