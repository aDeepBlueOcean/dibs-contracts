import { MockContract, deployMockContract } from "ethereum-waffle";
import {
  Dibs__factory,
  PairRewarder2,
  PairRewarder2__factory,
  PairRewarderFactory,
} from "../typechain-types";
import { PairRewarder__factory } from "../typechain-types/factories/contracts/PairRewarder.sol";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from "hardhat";
import { upgrade } from "../scripts/upgrade/upgradeDibs";
import { expect } from "chai";

describe("PairRewarderFactory", () => {
  let pairRewarderFactory: PairRewarderFactory;
  let dibs: MockContract;
  const bytecode = PairRewarder__factory.bytecode;
  const newBytecode = PairRewarder2__factory.bytecode;
  let admin: SignerWithAddress;
  let setter: SignerWithAddress;
  let user: SignerWithAddress;

  const pair0 = "0x0000000000000000000000000000000000000010";
  const pair1 = "0x0000000000000000000000000000000000000001";
  const pair2 = "0x0000000000000000000000000000000000000002";

  beforeEach(async () => {
    [admin, setter, user] = await ethers.getSigners();
    dibs = await deployMockContract(admin, Dibs__factory.abi);

    const factory = await ethers.getContractFactory("PairRewarderFactory");

    pairRewarderFactory = (await upgrades.deployProxy(factory, [
      dibs.address,
      bytecode,
    ])) as PairRewarderFactory;

    await pairRewarderFactory.deployed();

    const setter_role =
      "0x8e4f01b2ef10e587f670bbfd448bba9a57a36fd9c81549b587269120cb62b24d";

    await dibs.mock.SETTER.returns(setter_role);
    await dibs.mock.hasRole.withArgs(setter_role, setter.address).returns(true);
  });

  it("should create a new pair rewarder", async () => {
    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    const pairsLength = await pairRewarderFactory.pairsLength();
    expect(pairsLength).to.equal(1);

    const allPairs = await pairRewarderFactory.getAllPairs();
    expect(allPairs).to.deep.equal([pair0]);

    const pairRewarder = await pairRewarderFactory.pairRewarders(pair0, 0);
    expect(pairRewarder).to.not.equal(ethers.constants.AddressZero);

    const pairRewardersLength = await pairRewarderFactory.pairRewardersLength(
      pair0
    );
    expect(pairRewardersLength).to.equal(1);

    const pairRewarders = await pairRewarderFactory.getAllPairRewarders(pair0);
    expect(pairRewarders).to.deep.equal([pairRewarder]);
  });

  it("should create a new pair rewarder and upgrade it", async () => {
    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    const pairRewarder = await pairRewarderFactory.pairRewarders(pair0, 0);
    expect(pairRewarder).to.not.equal(ethers.constants.AddressZero);

    const newImplementation = await (
      await ethers.getContractFactory("PairRewarder2")
    ).deploy();

    await pairRewarderFactory
      .connect(setter)
      .upgradePairRewarders([pairRewarder], newImplementation.address);

    const isUpgraded = await (
      await ethers.getContractAt("PairRewarder2", pairRewarder)
    ).isUpgraded();

    expect(isUpgraded).to.be.true;
  });

  it("should deploy multiple pair rewarders", async () => {
    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    await pairRewarderFactory.deployPairRewarder(
      pair1,
      admin.address,
      setter.address
    );

    await pairRewarderFactory.deployPairRewarder(
      pair2,
      admin.address,
      setter.address
    );

    const pairsLength = await pairRewarderFactory.pairsLength();
    expect(pairsLength).to.equal(3);

    const allPairs = await pairRewarderFactory.getAllPairs();
    expect(allPairs).to.deep.equal([pair0, pair1, pair2]);

    const pairRewarder0 = await pairRewarderFactory.pairRewarders(pair0, 0);
    const pairRewarder1 = await pairRewarderFactory.pairRewarders(pair1, 0);
    const pairRewarder2 = await pairRewarderFactory.pairRewarders(pair2, 0);

    expect(pairRewarder0).to.not.equal(ethers.constants.AddressZero);
    expect(pairRewarder1).to.not.equal(ethers.constants.AddressZero);
    expect(pairRewarder2).to.not.equal(ethers.constants.AddressZero);

    const pairRewardersLength0 = await pairRewarderFactory.pairRewardersLength(
      pair0
    );
    const pairRewardersLength1 = await pairRewarderFactory.pairRewardersLength(
      pair1
    );
    const pairRewardersLength2 = await pairRewarderFactory.pairRewardersLength(
      pair2
    );

    expect(pairRewardersLength0).to.equal(1);
    expect(pairRewardersLength1).to.equal(1);
    expect(pairRewardersLength2).to.equal(1);

    const pairRewarders0 = await pairRewarderFactory.getAllPairRewarders(pair0);
    const pairRewarders1 = await pairRewarderFactory.getAllPairRewarders(pair1);
    const pairRewarders2 = await pairRewarderFactory.getAllPairRewarders(pair2);

    expect(pairRewarders0).to.deep.equal([pairRewarder0]);
    expect(pairRewarders1).to.deep.equal([pairRewarder1]);
    expect(pairRewarders2).to.deep.equal([pairRewarder2]);
  });

  it("should deploy multiple rewarders for the same pair", async () => {
    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    const pairsLength = await pairRewarderFactory.pairsLength();
    expect(pairsLength).to.equal(1);

    const allPairs = await pairRewarderFactory.getAllPairs();
    expect(allPairs).to.deep.equal([pair0]);

    const pairRewarder0 = await pairRewarderFactory.pairRewarders(pair0, 0);
    const pairRewarder1 = await pairRewarderFactory.pairRewarders(pair0, 1);
    const pairRewarder2 = await pairRewarderFactory.pairRewarders(pair0, 2);

    expect(pairRewarder0).to.not.equal(ethers.constants.AddressZero);
    expect(pairRewarder1).to.not.equal(ethers.constants.AddressZero);
    expect(pairRewarder2).to.not.equal(ethers.constants.AddressZero);

    const pairRewardersLength0 = await pairRewarderFactory.pairRewardersLength(
      pair0
    );

    expect(pairRewardersLength0).to.equal(3);

    const pairRewarders0 = await pairRewarderFactory.getAllPairRewarders(pair0);

    expect(pairRewarders0).to.deep.equal([
      pairRewarder0,
      pairRewarder1,
      pairRewarder2,
    ]);
  });

  it("change bytecode after one deployment and verifies that the new bytecode is used", async () => {
    await pairRewarderFactory.deployPairRewarder(
      pair1,
      admin.address,
      setter.address
    );

    await pairRewarderFactory
      .connect(setter)
      .setPairRewarderBytecode(newBytecode);

    await pairRewarderFactory.deployPairRewarder(
      pair0,
      admin.address,
      setter.address
    );

    const pairRewarder0 = await pairRewarderFactory.pairRewarders(pair0, 0);
    const pairRewarder1 = await pairRewarderFactory.pairRewarders(pair1, 0);

    const isUpgraded = await (
      await ethers.getContractAt("PairRewarder2", pairRewarder0)
    ).isUpgraded();

    expect(isUpgraded).to.be.true;

    const tx = (
      await ethers.getContractAt("PairRewarder2", pairRewarder1)
    ).isUpgraded();

    await expect(tx).to.be.reverted;
  });
});
