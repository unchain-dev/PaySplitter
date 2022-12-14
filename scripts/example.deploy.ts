import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

const main = async () => {
  const person_A = ethers.utils.getAddress(
    "0x724C2F25Ca65fef27B2737901FB82D3b86BB6AE3",
  );
  const person_B = ethers.utils.getAddress(
    "0x8e38C66278D6C3B83C5c38A9Da6b61e9E17656cd",
  );
  const person_C = ethers.utils.getAddress(
    "0x412224535421f980b576880c05fE7E81Bf8a20d4",
  );

  const weight_A: number = 400;
  const weight_B: number = 300;
  const weight_C: number = 300;

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
