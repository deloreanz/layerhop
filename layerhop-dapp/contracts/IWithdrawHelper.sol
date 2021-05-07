// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

struct WithdrawData {
    address channelAddress;
    address assetId;
    address payable recipient;
    uint256 amount;
    uint256 nonce;
    address callTo;
    bytes callData;
}

interface IWithdrawHelper {
    function execute(WithdrawData calldata wd, uint256 actualAmount) external;
}