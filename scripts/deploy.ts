import { messagePrefix } from "@ethersproject/hash";
import { ethers, upgrades } from "hardhat";

const main = async () => {
    // Deploying
    const splitter = await ethers.getContractFactory("paysplit");
    const instance = await upgrades.deployProxy(splitter);
    await instance.deployed();

    // retrieve contract variables
    const owner = await instance.signer.getAddress();

    console.log("Payment splitter contract deployed! Contract address:", instance.address);
    console.log("Contract admin:", owner);
}

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