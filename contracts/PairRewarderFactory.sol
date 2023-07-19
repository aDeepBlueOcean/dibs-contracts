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

    function initialize(
        address dibs_,
        bytes memory bytecode_
    ) public initializer {
        dibs = dibs_;
        pairRewarderBytecode = bytecode_;
        _updateImplementationUsingBytecode();
        proxyAdmin = address(new ProxyAdmin());
    }

    function _updateImplementationUsingBytecode() internal {
        address implementation;
        bytes memory bytecode = pairRewarderBytecode;

        assembly {
            implementation := create(0, add(bytecode, 0x20), mload(bytecode))
        }

        pairRewarderImplementation = implementation;
    }

    function pairsLenght() external view returns (uint256) {
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

    function deployPairRewarder(
        address pair_,
        address admin_,
        address setter_
    ) external {
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
        if (pairRewarders[pair_].length == 0) pairs.push(pair_); // new pair
        pairRewarders[pair_].push(address(pairRewarderProxy));
        emit PairRewarderDeployed(pair_, address(pairRewarderProxy));
    }
}
