import { ConnextSdk } from '@connext/vector-sdk';
import { providers } from 'ethers';
import config from '../config.js';

const connextSdk = new ConnextSdk();
// const webProvider = new providers.Web3Provider(window.ethereum);

const initConnext = async ({ connextNetwork, loginProvider, fromNetworkId, toNetworkId, senderAssetId, recipientAssetId }) => {
  // input validation
  if (!['mainnet', 'testnet'].includes(connextNetwork)) throw new Error(`Invalid Connext network '${connextNetwork}'.`);
  let fromChainProviderUrl, toChainProviderUrl;
  // @todo support more chain combos
  if (fromNetworkId === 137) {
    fromChainProviderUrl = config.networks.polygon.mainnet.providerUrl;
  } else if (fromNetworkId === 80001) {
    fromChainProviderUrl = config.networks.polygon.testnets.mumbai.providerUrl; 
  } else {
    throw new Error(`Unsupported 'from' network id: ${fromNetworkId}`);
  }
  if (toNetworkId === 1) {
    toChainProviderUrl = config.networks.ethereum.mainnet.providerUrl;
  } else if (toNetworkId === 5) {
    toChainProviderUrl = config.networks.ethereum.testnets.goerli.providerUrl; 
  } else {
    throw new Error(`Unsupported 'to' network id: ${toNetworkId}`);
  }
  try {
    console.log(config.connext);
    console.log(connextNetwork);
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

const getEstimatedFee = async (input, isRecipientAssetInput=true) => {
  if (!input) throw new Error('input param required');
  if (typeof input !== 'string') {
    input = input + '';
  }
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


export {
  initConnext,
  getEstimatedFee,
  // deposit,
};