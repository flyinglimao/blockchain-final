// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Protocol = await hre.ethers.getContractFactory("Protocol");
  const protocol = await Protocol.deploy("0x64e0d30cfc2aa0533350ed5012b6ab0d4d475c2b");
  const ENX = await ethers.getContractAt('ENX', "0x64e0d30cfc2aa0533350ed5012b6ab0d4d475c2b");
  
  await protocol.deployed();
  await ENX.mint(ethers.utils.parseEther("10000"));
  await ENX.transfer(protocol.address, ethers.utils.parseEther("10000"));

  console.log("Protocol deployed to:", protocol.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
