import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

const main = async () => {
  const spu = ethers.utils.getAddress(
    "0x8dFB9266A18efcDBC1c570248CC47e520D9307B0"
  );
  const cohurin = ethers.utils.getAddress(
    "0x724C2F25Ca65fef27B2737901FB82D3b86BB6AE3"
  );
  const misaki = ethers.utils.getAddress(
    "0x6d567CB120d640CE0fd5Ee65893Bd8A70f37D6e3"
  );

  const w_spu: number = 400;
  const w_cohurin: number = 300;
  const w_misaki: number = 300;

  const PaySplitterFactory: ContractFactory = await ethers.getContractFactory(
    "PaySplitter"
  );
  const PaySplitterContract: Contract = await upgrades.deployProxy(
    PaySplitterFactory,
    [
      [spu, cohurin, misaki],
      [w_spu, w_cohurin, w_misaki],
    ]
  );
  await PaySplitterContract.deployed();

  // retrieve contract variables
  const owner = await PaySplitterContract.signer.getAddress();

  console.log(
    "Payment splitter contract deployed! Contract address:",
    PaySplitterContract.address
  );
  console.log("Contract admin:", owner);
  console.log("Sho address:", cohurin);
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
