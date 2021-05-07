import { ConnextSdk, ERC20Abi } from '@connext/vector-sdk';
import { providers, BigNumber, utils, constants, Contract, } from 'ethers';
import config from '../config.js';

const connextSdk = new ConnextSdk();
var thisLoginProvider;
// const webProvider = new providers.Web3Provider(window.ethereum);

const initConnext = async ({ connextNetwork, loginProvider, fromNetworkId, toNetworkId, senderAssetId, recipientAssetId }) => {
  // input validation
  if (!['mainnet', 'testnet'].includes(connextNetwork)) throw new Error(`Invalid Connext network '${connextNetwork}'.`);
  let fromChainProviderUrl, toChainProviderUrl;
  thisLoginProvider = loginProvider;
  // @todo support more chain combos
  if (fromNetworkId === 137) {
    fromChainProviderUrl = config.networks.polygon.mainnet.providerUrl;
  } else if (fromNetworkId === 80001) {
    fromChainProviderUrl = config.networks.polygon.testnets.mumbai.providerUrl; 
  } else if (fromNetworkId === 5) {
    fromChainProviderUrl = config.networks.ethereum.testnets.goerli.providerUrl; 
  } else {
    throw new Error(`Unsupported 'from' network id: ${fromNetworkId}`);
  }
  if (toNetworkId === 1) {
    toChainProviderUrl = config.networks.ethereum.mainnet.providerUrl;
  } else if (toNetworkId === 5) {
    toChainProviderUrl = config.networks.ethereum.testnets.goerli.providerUrl; 
  } else if (toNetworkId === 80001) {
    toChainProviderUrl = config.networks.polygon.testnets.mumbai.providerUrl; 
  } else {
    throw new Error(`Unsupported 'to' network id: ${toNetworkId}`);
  }
  try {
    const connextRes = await connextSdk.init({
      routerPublicIdentifier: config.connext.network[connextNetwork].publicId, // Router Public Identifier
      loginProvider, // Web3/JsonRPCProvider
      senderChainProvider: fromChainProviderUrl, // Rpc Provider Link
      senderAssetId, // Asset/Token Address on Sender Chain
      recipientChainProvider: toChainProviderUrl, // Rpc Provider Link
      recipientAssetId, // Asset/Token Address on Recipient Chain
      // routerPublicIdentifier: 'vector8Uz1BdpA...', // Router Public Identifier
      // loginProvider: webProvider, // Web3/JsonRPCProvider
      // senderChainProvider: 'https://<Sender-Chain>.infura.io/v3/<YOUR_PROJECT_ID', // Rpc Provider Link
      // senderAssetId: '0xbd69fC70FA1...', // Asset/Token Address on Sender Chain
      // recipientChainProvider: 'https://<Recipient-Chain>.infura.io/v3/<YOUR_PROJECT_ID', // Rpc Provider Link
      // recipientAssetId: '0xbd69fC70FA1...', // Asset/Token Address on Recipient Chain
    });
    console.log('Initialized Connext Vector SDK!');

    return connextRes;
  } catch (e) {
    const message = 'Error initalizing';
    console.log(e, message);
    throw e;
  }
};

// const getStateChannels = async () => connextSdk.getStateChannels();

const getEstimatedFee = async (input, isRecipientAssetInput=true) => {
  if (!input) throw new Error('input param required');
  if (typeof input !== 'string') {
    input = input + '';
  }
  // NOTE: estimateFees expects a ETH, not wei value
  input = BigNumber.from(input).div(Math.pow(10, 18).toString()).toString();
  try {
    const res = await connextSdk.estimateFees({
      transferAmount: input,
      isRecipientAssetInput,
    });
    // console.log('Fee Estimate', res);
    if (res.error) throw new Error(`Error estimating fee: ${res.error}`);
    return res;
  } catch (e) {
    const message = 'Error Estimating Fees';
    console.log(message, e);
  }
};

const preTransferCheck = async transferAmount => {
  if (typeof transferAmount !== 'string') throw new Error('transferAmount param must be a string');
  // if (transferAmount instanceof BigNumber === false) {
  //   throw new Error('preTransferCheck requires BigNumber as input amount');
  // }
  // @todo not sure why this is needed, but have to divide by 18, perhaps 'deposit' expects this
  transferAmount = BigNumber.from(transferAmount + '');
  transferAmount = transferAmount.div(Math.pow(10, 18) + '');
  transferAmount = transferAmount.toString();
  try {
    return await connextSdk.deposit({
      transferAmount,
      webProvider: thisLoginProvider,
      onDeposited: txHash => {
        console.log('txHash', txHash);
      },
    });
  } catch (e) {
    if (e.message.includes('User denied transaction signature')) {
      return;
    }
    console.log('Error at deposit', e);
  }
};

const crossChainSwap = async ({ withdrawalAddress, transferQuote }) => {
  if (!transferQuote) throw new Error('param transferQuote is required');
  try {
    // connextSdk.withdraw({  })
    await connextSdk.crossChainSwap({
      transferQuote,
      recipientAddress: withdrawalAddress, // Recipient Address
      // onTransferred:
      onTransferred: (a, b, c) => console.log(`cross chain swap transfered: `, a, b, c),
      onFinished: (toNetworkTxHash, x, y, z) => console.log(`cross chain swap finished: `, toNetworkTxHash, x, y, z), // onFinished callback function
    });
  } catch (e) {
    console.log('Error at withdraw', e);
    throw e;
  }
};

const getDepositAddress = () => {
  return connextSdk.senderChainChannelAddress;
};

const getWithdrawAddress = () => {
  return connextSdk.recipientChainChannelAddress;
};

const depositToChannel = async (webProvider, transferAmount) => {
  try {
    await connextSdk.preTransferCheck(transferAmount);
  } catch (e) {
    console.log('Error at preCheck', e);
  }

  const transferAmountBn = BigNumber.from(
    utils.parseUnits(transferAmount, connextSdk.senderChain.assetDecimals)
  );
  console.log(transferAmountBn);

  try {
    const signer = webProvider.getSigner();
    const depositAddress = getDepositAddress();

    const depositTx =
      connextSdk.senderChain.assetId === constants.AddressZero
        ? await signer.sendTransaction({
            to: depositAddress,
            value: transferAmountBn,
          })
        : await new Contract(
            connextSdk.senderChain.assetId,
            ERC20Abi,
            signer
          ).transfer(depositAddress, transferAmountBn);

    console.log('depositTx', depositTx.hash);

    const receipt = await depositTx.wait(1);
    console.log('deposit mined:', receipt.transactionHash);
  } catch (e) {
    console.log('Error during deposit', e);
  }
};

const withdraw = async amount => {
  // get browsre node
  const node = connextSdk.browserNode;
  if (typeof amount !== 'string') {
    amount = amount.toString();
  }

  const channelAddress = '0x770Dc065140827632c4b413c037b7f9Bb86E9D65';
  // const amount = BigNumber.from(amount.toString()).toString();
  const result = await node.withdraw({
    channelAddress,
    amount,
    assetId: '0x15f0ca26781c3852f8166ed2ebce5d18265cceb7',
    recipient: '0x547f796Ca7079765Bf6f6d4c00094a394E665948',
    fee: '0',
  });
  return result;
};

export {
  initConnext,
  // getStateChannels,
  getEstimatedFee,
  getDepositAddress,
  getWithdrawAddress,
  depositToChannel,
  preTransferCheck,
  crossChainSwap,
  withdraw,
};