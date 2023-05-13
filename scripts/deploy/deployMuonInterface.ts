import hre, { ethers, upgrades } from "hardhat";
import { MuonInterfaceV1 } from "../../typechain-types";

export async function deployMuonInterface(
  dibs: string
): Promise<MuonInterfaceV1> {
  const [admin] = await ethers.getSigners();

  const setter = admin;
  const appId =
    "29996138867610942848855832240712459333931278134263772663951800460922233661812";
  const validGateway = "0xf56b6C94F17fe81023a31cb6FAa2592c49292215";

  const publicKey = [
    "0x4d8bf64cdc8651641833910995bfe0aed9b61037721f3d2305d1f87e8f3ad815",
    "0",
  ];

  const MuonInterfaceV1 = await ethers.getContractFactory("MuonInterfaceV1");

  const args = [
    admin.address,
    setter.address,
    dibs,
    validGateway,
    appId,
    publicKey,
  ];

  const muonInterface = await upgrades.deployProxy(MuonInterfaceV1, args);

  await muonInterface.deployed();

  console.log("MuonInterface deployed to:", muonInterface.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    muonInterface.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify muon interface
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });

  return muonInterface as MuonInterfaceV1;
}