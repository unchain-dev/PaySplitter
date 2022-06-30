import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export const calculateBalance = async (etherString: string, totalWeight: number, weight: number) => {
	let etherNumber: number = Number(etherString);
	etherNumber = etherNumber * weight / totalWeight;
	let wei: BigNumber = ethers.utils.parseEther(String(etherNumber))
	return wei;
};