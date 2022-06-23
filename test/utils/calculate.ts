import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export const calculateBalance = async (etherString: string, totalWeight: number, weight: number) => {
	let etherNumber: number = Number(etherString);
	etherNumber = etherNumber * weight / totalWeight;
	let wei: BigNumber = ethers.utils.parseEther(String(etherNumber))
	return wei;
};

export const subtracteWei =  async (a: BigNumber, b: BigNumber) => {
	let aEtherString: string = ethers.utils.formatEther(a);
	let bEtherString: string = ethers.utils.formatEther(b);
	let ether: number = Number(aEtherString) - Number(bEtherString);
	return ethers.utils.parseEther(String(ether));
}

export const addWei =  async (a: BigNumber, b: BigNumber) => {
	let aEtherString: string = ethers.utils.formatEther(a);
	let bEtherString: string = ethers.utils.formatEther(b);
	let ether: number = Number(aEtherString) + Number(bEtherString);
	return ethers.utils.parseEther(String(ether));
}