// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IDibs.sol";
import "./interfaces/IPairRewarder.sol";

contract PairRewarderFactory is Initializable {
    address public dibs;
    address public pairRewarderImplementation;
    bytes public pairRewarderBytecode;
    address public proxyAdmin;

    mapping(address => address[]) public pairRewarders; // pair => pairRewarders[]
    address[] public pairs;

    event PairRewarderDeployed(address indexed pair, address pairRewarder);
    event updatedImplementation(address indexed implementation);
    event PairRewarderUpgraded(address pairRewarder, address implementation);

    function initialize(
        address dibs_,
        bytes memory bytecode_
    ) public initializer {
        dibs = dibs_;
        pairRewarderBytecode = bytecode_;
        _updateImplementationFromBytecode();
        proxyAdmin = address(new ProxyAdmin());
    }

    /// ========================= getters =========================

    function pairsLength() external view returns (uint256) {
        return pairs.length;
    }

    function getAllPairs() external view returns (address[] memory) {
        return pairs;
    }

    function pairRewardersLength(
        address pair_
    ) external view returns (uint256) {
        return pairRewarders[pair_].length;
    }

    function getAllPairRewarders(
        address pair_
    ) external view returns (address[] memory) {
        return pairRewarders[pair_];
    }

    /// ===================== permission-less =====================

    /// @notice deploy a new pairRewarder
    /// @param pair_ address of pair
    /// @param admin_ address of admin
    /// @param setter_ address of setter
    function deployPairRewarder(
        address pair_,
        address admin_,
        address setter_
    ) external {
        // check for zero address
        require(
            pair_ != address(0) &&
                admin_ != address(0) &&
                setter_ != address(0),
            "PairRewarderFactory: zero address"
        );

        _deployPairRewarder(pair_, admin_, setter_);
    }

    /// ======================== restricted ========================

    function setPairRewarderBytecode(
        bytes memory bytecode_
    ) external onlySetter {
        pairRewarderBytecode = bytecode_;
        _updateImplementationFromBytecode();
    }

    /// @notice upgrade pairRewarders to new implementation
    /// ** this updates multiple pairRewarders, use with caution
    /// ** this does not update the pairRewarderImplementation for future deployments
    /// @param pairRewarders_ array of pairRewarders to upgrade
    /// @param implementation_ address of new implementation
    function upgradePairRewarders(
        address[] calldata pairRewarders_,
        address implementation_
    ) external onlySetter {
        for (uint256 i = 0; i < pairRewarders_.length; i++) {
            _upgradePairRewarder(pairRewarders_[i], implementation_);
        }
    }

    /// ========================= internal =========================

    function _updateImplementationFromBytecode() internal {
        address implementation;
        bytes memory bytecode = pairRewarderBytecode;

        assembly {
            implementation := create(0, add(bytecode, 0x20), mload(bytecode))
        }

        require(
            implementation != address(0),
            "PairRewarderFactory: bytecode deployment failed"
        );

        pairRewarderImplementation = implementation;

        emit updatedImplementation(implementation);
    }

    function _deployPairRewarder(
        address pair_,
        address admin_,
        address setter_
    ) internal {
        TransparentUpgradeableProxy pairRewarderProxy = new TransparentUpgradeableProxy(
                pairRewarderImplementation,
                proxyAdmin,
                abi.encodeWithSelector(
                    IPairRewarder(pairRewarderImplementation)
                        .initialize
                        .selector,
                    dibs,
                    pair_,
                    admin_,
                    setter_
                )
            );
        _addPairRewarder(pair_, address(pairRewarderProxy));
        emit PairRewarderDeployed(pair_, address(pairRewarderProxy));
    }

    function _addPairRewarder(address pair_, address pairRewarder_) internal {
        if (pairRewarders[pair_].length == 0) pairs.push(pair_); // new pair
        pairRewarders[pair_].push(pairRewarder_);
    }

    function _upgradePairRewarder(
        address pairRewarder_,
        address implementation_
    ) internal {
        ProxyAdmin(proxyAdmin).upgrade(
            TransparentUpgradeableProxy(payable(address(pairRewarder_))),
            implementation_
        );

        emit PairRewarderUpgraded(pairRewarder_, implementation_);
    }

    /// ========================= modifiers =========================

    modifier onlySetter() {
        require(
            IDibs(dibs).hasRole(IDibs(dibs).SETTER(), msg.sender),
            "PairRewarderFactory: only setter"
        );
        _;
    }
}
