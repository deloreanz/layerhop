//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import { RedirectAll, ISuperToken, IConstantFlowAgreementV1, ISuperfluid } from "./RedirectAll.sol";
import { IWithdrawHelper, WithdrawData } from './IWithdrawHelper.sol';


/* Hello and welcome to your first Super App!
* In order to deploy this contract, you'll need a few things
* Get the deployed SF addresses here: https://docs.superfluid.finance/superfluid/resources/networks
* or using the js-sdk as shown here https://docs.superfluid.finance/superfluid/protocol-tutorials/setup-local-environment
*/


contract LayerHop is IWithdrawHelper {
// is RedirectAll {

    address owner;
    bytes32 name;
    // balances[ACCOUNT_ADDRESS][TOKEN_ADDRESS] = BALANCE
	mapping (address => mapping (address => uint256)) public balances;
	mapping (address => mapping (address => uint256)) public balancesLocked; 

	constructor(
	   // bytes32 _name
// 		address owner
// 		string memory _name,
// 		string memory _symbol,
// 		ISuperfluid host,
// 		IConstantFlowAgreementV1 cfa,
// 		ISuperToken acceptedToken
	)
// 		RedirectAll (
// 			host,
// 			cfa,
// 			acceptedToken,
// 			owner
// 		 ) { }
    {
        // name = _name;
        owner = msg.sender;
    }
    
    struct ManifestData{
        address tokenAddress;
        address accountAddress;
        uint256 amount;
        //fix data structure
        uint256 op_code;
    }

    //enum OP_CODES { DEPOSIT, DEPOSIT_STR, WITHDRAW}
    struct Manifest {
        // [ACCOUNT_ADDRESS, OP_CODE, PARAM_1, PARAM_2, PARAM_3, PARAM_4]
        //uint256[6][] plans;
        ManifestData[] manifestData;

    }
    // OP CODES - description - [PARAM_1_DESC, PARAM_2_DESC, PARAM_3_DESC, PARAM_4_DESC]
    // 0001 - deposit tokens - [TOKEN_ADDRESS, TOKEN_AMOUNT]
    // 0002 - deposit tokens and set stream rate to external address - [TOKEN_ADDRESS, TOKEN_AMOUNT, STREAM_RATE, STREAM_TO_ADDRESS]
    // 0003 - withdraw tokens to address - [TOKEN_ADDRESS, TOKEN_AMOUNT, WITHDRAW_ADDRESS]
    // 0004 - @todo
    // 0005 - @todo

    // @todo implement returning all balances
    // function getBalances() public view returns (mapping (address => mapping (address => uint256)) memory) {
    //     return balances;
    // }
    
    function getBalance(address accountAddress, address tokenAddress) public view returns (uint256) {
        return balances[accountAddress][tokenAddress];
    }

    function approveDeposit(address tokenAddress, uint256 tokenAmount) public returns (bool) {
        IERC20 instance = IERC20(tokenAddress);
        bool res = instance.approve(address(this), tokenAmount);
        return res;
    }
	
	function deposit(address tokenAddress, uint256 tokenAmount) public returns (bool) {
	    IERC20 instance = IERC20(tokenAddress);
        bool res = instance.transferFrom(msg.sender, address(this), tokenAmount);
        require(res);
        balances[msg.sender][tokenAddress] += tokenAmount;
        return res;
	}
	
	// withdraw to the message sender
	function withdraw(address tokenAddress, uint256 tokenAmount) public returns (bool) {
	    return withdrawTo(tokenAddress, msg.sender, tokenAmount);
	}
	
	// allow withdraw to an account other than the message sender
	function withdrawTo(address tokenAddress, address toAddress, uint256 tokenAmount) public returns (bool) {
	    require(balances[msg.sender][tokenAddress] >= tokenAmount);
	    // @todo centralize ERC20/account deposits/withdrawal logic
	    IERC20 instance = IERC20(tokenAddress);

        balances[msg.sender][tokenAddress] -= tokenAmount;
        bool res = instance.transfer(toAddress, tokenAmount);
        require(res);
        return res;


	}
	
	function depositToChannel(address tokenAddress, address payable channelAddress) public {
	    
	}
	
	// generate callData for use with the execute function
	function getCallData(WithdrawData calldata withdrawData) public pure returns (bytes memory) {
        return abi.encode(withdrawData);
    }   
	
	function execute(WithdrawData calldata withdrawData, uint256 bulkTokenAmount) override external {
	    // decode the calldata into a Manifest
	    Manifest memory manifest = abi.decode(withdrawData.callData, (Manifest));
	    
	    // // @todo expand this to allow iterating over the array of accounts, for now just get first plans
	    // address accountAddress = address(manifest.plans[0][0]);
	    // uint256 opCode = manifest.plans[0][1];
	    // address tokenAddress = address(manifest.plans[0][2]);
	    // uint256 tokenAmount = manifest.plans[0][3];
        require(manifest.manifestData.length >= 1);
        for(uint i=0; i < manifest.manifestData.length; i++){
            address accAddr = manifest.manifestData[i].accountAddress;
            uint256 opCode = manifest.manifestData[i].op_code;
            address tokAddr = manifest.manifestData[i].tokenAddress ;
            uint256 tokAmt = manifest.manifestData[i].amount;

            require(opCode == 0x0001 || opCode == 0x0002);
            if (opCode == 0x0001) {
                // deposit
                deposit(tokAddr, tokAmt);
                // ensure total token depsosit is greater than this plan's tokenAmount
                require(bulkTokenAmount >= tokAmt);
                balances[accAddr][tokAddr] += tokAmt;
            }
        }   
	}



}
