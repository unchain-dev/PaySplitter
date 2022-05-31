import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

// const split = async(instance:Contract, caller:Signer, recipient:Signer, raw_amount:number) => {

//     const callerAddr = await caller.getAddress();
//     const recipientAddr = await recipient.getAddress();
//     const amount = BigInt(raw_amount * 10 ** 18);

//     console.log("-------------------------")
//     console.log("mint function called by:", callerAddr)

//     // mint token
//     let txn = await instance.connect(caller).mint(recipientAddr, amount);
//     await txn.wait()
// }

// const main = async () => {
//     // split()
// }

// const runMain = async () => {
//     try {
//         await main();
//         process.exit(0);
//     } catch (error) {
//         console.log(error);
//         process.exit(1);
//     }
// };

// runMain();