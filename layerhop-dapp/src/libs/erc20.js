import { Contract } from 'ethers';
import { getProvider } from './web3Providers.js';
import { ERC20Abi } from '@connext/vector-sdk';

// import config from '../config.js';

const getContract = (networkId, tokenAddress) => {
  const provider = getProvider(networkId);
  const contract = new Contract(tokenAddress, ERC20Abi, provider);
  return contract;
};

const balanceOf = async ({ networkId, tokenAddress, address }) => {
  const contract = getContract(networkId, tokenAddress);
  const res = await contract.balanceOf(address);
  // @todo dynamic divide by decimals?
  return parseInt(res.toString()) / Math.pow(10, 18);
};

const approve = async ({ networkId, tokenAddress, spender, value }) => {
  const contract = getContract(networkId, tokenAddress);
  return await contract.approve(spender, value);
};

const transferFrom = async ({ networkId, tokenAddress, from, to, value }) => {
  const contract = getContract(networkId, tokenAddress);
  return await contract.transferFrom(from, to, value);
};

// export default async ({ networkId, }) => {
//   const layerhopContractAddress = config.layerhop.networks[networkId].contractAddress;
//   const provider = getProvider(networkId);
//   return new Contract(layerhopContractAddress, LayerHopAbi, provider);
// };

export {
  balanceOf,
  approve,
  transferFrom,
};