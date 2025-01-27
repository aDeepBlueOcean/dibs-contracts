// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IDibs {
    function claim(
        address from,
        address token,
        uint256 amount,
        address to,
        uint256 accumulativeBalance
    ) external;

    function dibsLottery() external view returns (address);

    function PROJECT_ID() external view returns (bytes32);

    function muonInterface() external view returns (address);

    function firstRoundStartTime() external view returns (uint32);

    function roundDuration() external view returns (uint32);

    function blacklisted(address) external view returns (bool);

    function claimExcessTokens(
        address token,
        address to,
        uint256 accumulativeBalance,
        uint256 amount
    ) external;

    // roles

    function SETTER() external view returns (bytes32);

    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}
