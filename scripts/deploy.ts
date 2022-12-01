import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

const main = async () => {
  const PaySplitterFactory: ContractFactory = await ethers.getContractFactory(
    "PaySplitter",
  );
  const PaySplitterContract: Contract = await upgrades.deployProxy(
    PaySplitterFactory,
  );
  await PaySplitterContract.deployed();

  // retrieve contract variables
  const owner = await PaySplitterContract.signer.getAddress();

  console.log(
    "Payment splitter contract deployed! Contract address:",
    PaySplitterContract.address,
  );
  console.log("Contract admin:", owner);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
