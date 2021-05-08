//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { RedirectAll, ISuperToken, IConstantFlowAgreementV1, ISuperfluid } from "./RedirectAll.sol";
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
    uint256 constant decimals = 1000000000000000000;
	constructor(
	    ISuperfluid host,
        IConstantFlowAgreementV1 cfa) {
        assert(address(host) != address(0));
        assert(address(cfa) != address(0));
        //assert(!_host.isApp(ISuperApp(receiver)));

        _host = host;
        _cfa = cfa;

        uint256 configWord =
            SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
        owner = msg.sender;
    }
    
    struct ManifestData{
        address tokenAddress;
        address accountAddress;
        uint256 amount;
        //fix data type
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

	
	function deposit(address tokenAddress, uint256 tokenAmount, address reciever) public returns (bool) {
	    IERC20 instance = IERC20(tokenAddress);
        approveDeposit(address tokenAddress, uint256 tokenAmount);
        bool res = instance.transferFrom(msg.sender, address(this), tokenAmount);
        require(res);
        balances[reciever][tokenAddress] += tokenAmount;
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


    // function updateStream(bytes calldata ctx, ISuperfluidToken token, address receiver){

    // }


    function createStream(bytes calldata ctx, ISuperfluidToken token, address receiver)
        private
        returns (bytes memory newCtx)
    {
        newCtx = ctx;
        //todo - implement custom flowrate
        uint flowRate = getMaximumFlowRateFromDeposit(token, balance[token][receiver] );
        (newCtx, ) = _host.callAgreementWithContext(
              _cfa,
              abi.encodeWithSelector(
                  _cfa.createFlow.selector,
                  token,
                  receiver,
                  flowRate,
                  new bytes(0) // placeholder
              ),
              "0x",
              newCtx
          );
    }

    // Temp. solution to managing balance

    function liquidateFlow(
        ISuperfluidToken token,
        address sender,
        address receiver
    ){
        (uint256 timeStamp, int96 flowRate,,) = getFlow(token, address(this), receiver);
        uint256 period = now - timeStamp;
        uint totalFlow = (period * flowRate)/decimals;
        if(balances[token][reciever] <= totalFlow){
            //deleteFlow(token,sender, receiver, new bytes(0));
            (newCtx, ) = host.callAgreementWithContext(
                cfa,
                abi.encodeWithSelector(
                    cfa.deleteFlow.selector,
                    token,
                    address(this),
                    receiver,
                    new bytes(0)
                ),
                new bytes(0),
                newCtx
            );
        }

    }

    function createBatchStream(){

    }
	
	// generate callData for use with the execute function
	function getCallData(WithdrawData calldata withdrawData) public pure returns (bytes memory) {
        return abi.encode(withdrawData);
    }   
	
	function execute(WithdrawData calldata withdrawData, bytes calldata ctx, uint256 bulkTokenAmount) override external {
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
            } else if (opCode == 0x0002) {
                //deposit
                deposit(tokAddr, tokAmt);
                createStream();
                return;
            }
        }

    





}
