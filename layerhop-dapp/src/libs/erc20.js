import { Contract } from 'ethers';
import { getProvider } from './web3Providers.js';
// import { ERC20Abi } from '@connext/vector-sdk';
import ERC20Abi from './erc20.json';

// import config from '../config.js';
var networkId;
var erc20Provider;
var contracts = {};

// const getContract = tokenAddress => {
//   // return this ERC20 contract if already created
//   if (contracts[tokenAddress]) return contracts[tokenAddress];
//   // otherwise create, store, and return it
//   // const contract = new Contract(tokenAddress, ERC20Abi, erc20Provider);
//   var testProvider = getProvider(networkId);
//   const contract = new Contract(tokenAddress, ERC20Abi, testProvider);
//   contracts[tokenAddress] = contract;
//   return contract;
// };

// export default ({ provider, networkId: thisNetworkId, }) => {
//   networkId = thisNetworkId;
//   // init on this network with provider
//   erc20Provider = provider
//     ? provider
//     : getProvider(networkId);  
//   return {
//     getContract,
//   };
// };

const getContract = (networkId, tokenAddress, signer) => {
  if (!networkId || !tokenAddress) throw new Error('networkId and tokenAddress params must be set');
  const provider = signer
    ? signer
    : getProvider(networkId);
  const contract = new Contract(tokenAddress, ERC20Abi, provider);
  return contract;
};

const balanceOf = async ({ networkId, tokenAddress, address, }) => {
  try {
    const contract = getContract(networkId, tokenAddress);
    const res = await contract.balanceOf(address);
    // console.log('got balanceOf', res);
    // @todo dynamic divide by decimals?
    return parseInt(res.toString()) / Math.pow(10, 18);
  } catch (e) {
    console.log(`Error getting token '${tokenAddress}':`, e);
  }
};

const approve = async ({ networkId, tokenAddress, spender, value, }) => {
  const contract = getContract(networkId, tokenAddress);
  return await contract.approve(spender, value);
};

const transferFrom = async ({ networkId, tokenAddress, from, to, value, }) => {
  const contract = getContract(networkId, tokenAddress);
  return await contract.transferFrom(from, to, value);
};

const allowance = async ({ networkId, tokenAddress, owner, spender, }) => {
  const contract = getContract(networkId, tokenAddress);
  const res = await contract.allowance(owner, spender);
  return parseInt(res.toString());
};

const increaseAllowance = async ({ networkId, tokenAddress, signer, spender, addedValue, }) => {
  const contract = getContract(networkId, tokenAddress, signer);
  const res = await contract.increaseAllowance(spender, addedValue);
  return res;
};

export default {
  balanceOf,
  approve,
  transferFrom,
  allowance,
  increaseAllowance,
};