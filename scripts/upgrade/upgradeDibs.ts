import hre, { upgrades, ethers } from "hardhat";

export async function upgrade(proxyAddress: string) {
  const Dibs = await ethers.getContractFactory("Dibs");
  const dibs = await upgrades.upgradeProxy(proxyAddress, Dibs);

  await dibs.deployed();

  await dibs.deployTransaction.wait(1);

  console.log("Dibs upgraded:", dibs.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibs.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgrade("0x21dd036CFAB09243eeffCFC24C47b3baA860f9b7")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
