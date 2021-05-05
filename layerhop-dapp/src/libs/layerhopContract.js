import { Contract } from 'ethers';
import { getProvider } from './web3Providers.js';
import LayerHopAbi from './layerhop.json';

import config from '../config.js';

export default ({ networkId, }) => {
  const layerhopContractAddress = config.layerhop.networks[networkId].contractAddress;
  const provider = getProvider(networkId);
  return new Contract(layerhopContractAddress, LayerHopAbi, provider);
};