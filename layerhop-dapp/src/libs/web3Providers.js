import { providers, ethers } from 'ethers';
import config from '../config.js';

let providerByNetworkId = {};

const getProvider = networkId => {
  if (typeof networkId === 'string') networkId = parseInt(networkId);
  if (providerByNetworkId[networkId]) return providerByNetworkId[networkId];
  var thisProvider;
  // ethers only has certain ethereum providers built-in
  if (networkId === 1) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('homestead'));
  } else if (networkId === 3) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('ropsten'));
  } else if (networkId === 4) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('rinkeby'));
  } else if (networkId === 5) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('goerli'));
  } else if (networkId === 42) {
    thisProvider = providers.getDefaultProvider(providers.getNetwork('kovan'));
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
  getProvider,
};