//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.1.0/contracts/token/ERC20/IERC20.sol";
// import { RedirectAllMany, ISuperToken, IConstantFlowAgreementV1, ISuperfluid } from "./RedirectAllMany.sol";
import { RedirectAll, ISuperToken, IConstantFlowAgreementV1, ISuperfluid } from "./RedirectAll.sol";
import { IWithdrawHelper, WithdrawData } from './IWithdrawHelper.sol';


/* Hello and welcome to your first Super App!
* In order to deploy this contract, you'll need a few things
* Get the deployed SF addresses here: https://docs.superfluid.finance/superfluid/resources/networks
* or using the js-sdk as shown here https://docs.superfluid.finance/superfluid/protocol-tutorials/setup-local-environment
*/


contract LayerHop is IWithdrawHelper, RedirectAll {

    // address owner;
    bytes32 name;
    // balances[ACCOUNT_ADDRESS][TOKEN_ADDRESS] = BALANCE
	mapping (address => mapping (address => uint256)) public balances;
	mapping (address => mapping (address => uint256)) public balancesLocked;
	Plan[] public planCache;

	constructor(
	   // bytes32 _name
		address owner,
// 		string memory _name,
// 		string memory _symbol,
		ISuperfluid host,
		IConstantFlowAgreementV1 cfa,
		ISuperToken acceptedToken
	)
	// NOTE: for now only support streaming of fUSDx, then migrate to RedirectAllMany
	    RedirectAll (
            host,
            cfa,
            acceptedToken,
            owner
        )
    {
        name = 'LayerHop';
        owner = msg.sender;
    }
    
    struct Manifest {
        // [ACCOUNT_ADDRESS, OP_CODE, PARAM_1, PARAM_2, PARAM_3, PARAM_4]
        // uint256[6][] plans;
        Plan[] plans;
    }
    
    struct Plan {
        address accountAddress;
        uint256 opCode;
        uint256 param1;
        uint256 param2;
        uint256 param3;
        uint256 param4;
        int128 streamRate;
    }
    
    // OP CODES - description - params = [PARAM_1_DESC, PARAM_2_DESC, PARAM_3_DESC, PARAM_4_DESC] / streamRate = STREAM_RATE
    // 0001 - deposit tokens and optionally send to another address - params = [TOKEN_ADDRESS, TOKEN_AMOUNT, SEND_TOKEN, SEND_TO_ADDRESS]
    // 0002 - deposit tokens and set stream rate to external address - params = [TOKEN_ADDRESS, TOKEN_AMOUNT, STREAM_TOKEN, STREAM_TO_ADDRESS] / streamRate = STREAM_RATE
    // 0003 - withdraw tokens to address - params = [TOKEN_ADDRESS, TOKEN_AMOUNT, WITHDRAW_ADDRESS]
    // 0004 - @todo
    // 0005 - @todo
    
    // Events
    event GetFlowInSetStream(ISuperToken _acceptedToken, address accountAddress, address streamToAddress, uint256 timestamp, int96 flowRate, uint256 deposit, uint256 owedDeposit);
    event Info(string info);

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
	
	// NOTE: deposit amounts are shared between the account calling this method and the plan sending tokens to the other network
	// this means param1 and param2 are uesd for this user deposit into layerhop contract AND the transfer on the other network
// 	function depositPlan(uint256 opCode, uint256 param1, uint256 param2, uint256 param3, uint256 param4, int128 streamRate) public returns (bool) {
    function depositPlan(Plan memory plan) public returns (bool) {
	    address tokenAddress = address(uint160(plan.param1));
        uint256 tokenAmount = plan.param2;
        // NOTE: since only 0x0001 and 0x0002 are suported, this step ERC20 transfer is shared
	    if (tokenAmount != 0) {
    	    IERC20 instance = IERC20(tokenAddress);
            bool res = instance.transferFrom(msg.sender, address(this), tokenAmount);
            if (res == true) {
                balances[msg.sender][tokenAddress] += tokenAmount;
            }
	    }
	    // store plan
	   // Plan memory p1 = Plan({
	   //     accountAddress: uint256(uint160(msg.sender)),
	   //     opCode
	   //     params: [, param1, param2, param3, param4],
	   //     streamRate: streamRate
	   // });
	   // NOTE: overwrite, don't allow user to set plans for other accounts
	    plan.accountAddress = msg.sender;
	    planCache.push(plan);
	    
        return true;
	}
	
	// @todo make deposit method to share code
	
	function clearPlanCache() public returns (bool) {
	    delete planCache;
	    return true;
	}
	
	// withdraw to the message sender
	function withdraw(address tokenAddress, uint256 tokenAmount) public returns (bool) {
	    return withdraw(tokenAddress, msg.sender, tokenAmount);
	}
	
	// allow withdraw to an account other than the message sender
	function withdraw(address tokenAddress, address toAddress, uint256 tokenAmount) public returns (bool) {
	    require(balances[msg.sender][tokenAddress] >= tokenAmount);
	    // @todo centralize ERC20/account deposits/withdrawal logic
	    IERC20 instance = IERC20(tokenAddress);
        bool res = instance.transfer(toAddress, tokenAmount);
        if (res == true) {
            balances[msg.sender][tokenAddress] -= tokenAmount;
        }
        return res;
	}
	
	function setStream(address streamToAddress, address streamTokenAddress, int96 streamRate) public returns (bool) {
	    return setStream(msg.sender, streamTokenAddress, streamToAddress, streamRate);
	}
	
	// NOTE: this function can only be called internally since it allows changing any arbitrary address stream
	function setStream(address accountAddress, address streamTokenAddress, address streamToAddress, int96 streamRate) private returns (bool) {
	    // @todo use streamTokenAddress instead of _acceptedToken
	    // see if stream exists
	   // (uint256 timestamp, int96 flowRate, uint256 deposit, uint256 owedDeposit) = _cfa.getFlow(_acceptedToken, accountAddress, streamToAddress);
    //     emit GetFlowInSetStream(_acceptedToken, accountAddress, streamToAddress, timestamp, flowRate, deposit, owedDeposit);
	   // if (timestamp == 0) {
	        _cfa.createFlow(
	            _acceptedToken,
	            streamToAddress,
	            streamRate, '0x');
            emit Info('createFlow');
	   // } else {
	   //     _cfa.updateFlow(_acceptedToken, streamToAddress, streamRate, '0x');
	   //     emit Info('updateFlow');
	   // }
	    return true;
	}
	
	function getStream(ISuperToken token, address sender, address receiver) private returns (bool) {
	   // _cfa.getFlow
	}
	
	function depositToChannel(address payable channelAddress, address tokenAddress, uint256 tokenAmount) public returns (bool) {
	    IERC20 instance = IERC20(tokenAddress);
	    bool res = instance.transfer(channelAddress, tokenAmount);
        return res;
	}
	
	// generate callData for use with the execute function
// 	function getCallData(Plan[] calldata plans) public pure returns (bytes memory) {
//         return abi.encode(plans);
//     }
    function getCallData(Manifest calldata manifest) public pure returns (bytes memory) {
        return abi.encode(manifest);
    }
	
	function execute(WithdrawData calldata withdrawData, uint256 bulkTokenAmount) override external {
	    // decode the calldata into a Manifest
	   // Plan[] memory plans = abi.decode(withdrawData.callData, (Plan[]));
	    Manifest memory manifest = abi.decode(withdrawData.callData, (Manifest));
	    Plan[] memory plans = manifest.plans;
	    
	    // @todo expand this to allow iterating over the array of accounts, for now just get first plans
	    address accountAddress = address(uint160(plans[0].accountAddress));
	    uint256 opCode = plans[0].opCode;
	    
	    
	    // only support deposits, and deposits plus streams
	    require(opCode == 0x0001 || opCode == 0x0002);
	    
	    if (opCode == 0x0001) {
	        // deposit tokens
	        address tokenAddress = address(uint160(plans[0].param1));
	        uint256 tokenAmount = plans[0].param2;
	       // uint256 sendToAddress = plans[0].params[2];
	        // ensure total token depsosit is greater than this plan's tokenAmount
	        require(bulkTokenAmount >= tokenAmount);
            balances[accountAddress][tokenAddress] += tokenAmount;
            // @todo implement sendToAddress instead of deposit locally
            // use param3 and param4
	    } else if (opCode == 0x0002) {
	        // deposit and stream tokens
	        address tokenAddress = address(uint160(plans[0].param1));
	        uint256 tokenAmount = plans[0].param2;
	        address streamTokenAddress = address(uint160(plans[0].param3));
	        address streamToAddress = address(uint160(plans[0].param4));
	        int96 streamRate = int96(plans[0].streamRate);
	        require(bulkTokenAmount >= tokenAmount);
	        // update balance in contract
	        balances[accountAddress][tokenAddress] += tokenAmount;
	        
	        // @todo implement sendToAddress instead of deposit locally
	       // if (tokenAmount != 0) {
        // 	    IERC20 instance = IERC20(tokenAddress);
        //         bool res = instance.transferFrom(msg.sender, address(this), tokenAmount);
        //         if (res == true) {
        //             balances[msg.sender][tokenAddress] += tokenAmount;
        //         }
    	   // }
	        
	        
	        // @todo confirm token is super token
	        setStream(accountAddress, streamTokenAddress, streamToAddress, streamRate);
	    }
	}



}
