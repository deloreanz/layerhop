import { providers, ethers } from 'ethers';
import config from '../config.js';

let providerByNetworkId = {};

// get the browser web3 provider
const windowProvider = new ethers.providers.Web3Provider(window.ethereum);

const getProvider = networkId => {
  if (typeof networkId === 'string') networkId = parseInt(networkId);
  if (providerByNetworkId[networkId]) return providerByNetworkId[networkId];
  var thisProvider;
  const apiKeys = {
    etherscan: 'GBCRFPCPZFAPCSKJ5G3I9TV9EJK4M4ZFRM',
    infura: 'c5c672b375a64649849d05cab7a3ef01',
  };
  // ethers only has certain ethereum providers built-in
  if (networkId === 1) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('homestead'), apiKeys);
  } else if (networkId === 3) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('ropsten'), apiKeys);
  } else if (networkId === 4) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('rinkeby'), apiKeys);
  } else if (networkId === 5) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('goerli'), apiKeys);
  } else if (networkId === 42) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('kovan'), apiKeys);
  } else if (networkId === 137) {
    // polygon
    thisProvider = new ethers.providers.JsonRpcProvider(config.networks.polygon.mainnet.providerUrl);
  } else if (networkId === 80001) {
    // polygon
    thisProvider = new ethers.providers.JsonRpcProvider(config.networks.polygon.testnets.mumbai.providerUrl);
  } else {
    throw new Error(`Unable to get provider for unknown network id '${networkId}'.`);
  }
  providerByNetworkId[networkId] = thisProvider;
  return thisProvider;
};

export {
  windowProvider,
  getProvider,
};