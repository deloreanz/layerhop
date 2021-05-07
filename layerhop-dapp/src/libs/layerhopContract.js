import { Contract, providers } from 'ethers';
import { getProvider } from './web3Providers.js';
import LayerHopAbi from './layerhop.json';

import config from '../config.js';

export default ({ networkId, loginProvider, }) => {
  const layerhopContractAddress = config.layerhop.networks[networkId].contractAddress;
  var provider = loginProvider
    ? loginProvider
    : getProvider(networkId);
  // provider = new providers.Web3Provider(window.ethereum);
  // provider = loginProvider;
  return new Contract(layerhopContractAddress, LayerHopAbi, provider);
};