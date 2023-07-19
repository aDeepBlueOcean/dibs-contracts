import hre, { ethers, upgrades } from "hardhat";
import { PairRewarder__factory } from "../../typechain-types";

async function deploy(dibs: string) {
  const admin = await ethers.getSigner(
    "0x1cbA1fCf5aBf59dC4F6335A13Fd5771334B1803A"
  );

  const bytecode = PairRewarder__factory.bytecode;

  const factory = await ethers.getContractFactory("PairRewarderFactory", admin);

  const args = [dibs, bytecode];

  const pairRewarderFactory = await upgrades.deployProxy(factory, args);

  await pairRewarderFactory.deployed();

  console.log("PairRewarderFactory deployed to:", pairRewarderFactory.address);

  // get implementation address
  const implementation = await upgrades.erc1967.getImplementationAddress(
    pairRewarderFactory.address
  );

  console.log("PairRewarderFactory implementation:", implementation);

  // verify implementation if not on hardhat network

  if (hre.network.name !== "hardhat") {
    await hre.run("verify:verify", {
      address: pairRewarderFactory.address,
      constructorArguments: [],
    });
  }
}

deploy("0x21dd036CFAB09243eeffCFC24C47b3baA860f9b7")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
