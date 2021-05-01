import { providers, Contract } from 'ethers';

const erc20Abi = require('./maker.json');

const balanceOf = async ({ provider, network, tokenAddress, address }) => {
  provider = provider
    ? provider
    : providers.getDefaultProvider(network);
  const contract = new Contract(tokenAddress, erc20Abi, provider);
  const balance = await contract.balanceOf(address);
  // @todo divide by decimals?
  return parseInt(balance.toString()) / Math.pow(10, 18);
};

// import testnetMappings from '../test/testnetMappings.js';
// @todo dynamically load these

// const contracts = [
//   {
//     id: 'dai',
//     address: '0x6b175474e89094c44da98b954eedeac495271d0f',
//     abi: erc20Abi,
//     decimals: 18,
//   },
//   {
//     id: 'maker',
//     address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
//     abi: erc20Abi,
//     decimals: 18,
//   },
//   {
//     id: '1inch',
//     address: '0x111111111117dc0aa78b770fa6a738034120c302',
//     abi: erc20Abi,
//     decimals: 18,
//   },
//   {
//     id: 'uniswap',
//     address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
//     abi: erc20Abi,
//     decimals: 18,
//   },
// ];

// export const balanceOf = async (web3, contractAddress, ownerAddress) => {
//   // convert the contract address to testnet if we're on it
//   // ROPSTEN === 3
//   if (window.ethereum.networkVersion !== '1') {
//     throw new Error('Only ethereum main net is supported.');
//     // find this contract in the main net listing
//     // const contractInfo = contracts.find(contract => contract.address === contractAddress);
//     // contractAddress = testnetMappings.coinIdToAddress[];
//   }
//   // const contract = contracts.find(contract => contract.address === contractAddress);
//   // if (!contract) throw new Error(`Contract not found: ${contractAddress}`);
//   // if (!contract.abi) throw new Error(`Contract ${contractAddress} missing ABI definition.`);

//   // const makerContract = new web3.eth.Contract(contract.abi, contractAddress);
//   const erc20Contract = new web3.eth.Contract(erc20Abi, contractAddress);
//   var balance = await erc20Contract.methods.balanceOf(ownerAddress).call().catch(err => {
//     throw new Error(`Unable to get balance from '${contractAddress}' contract.`);
//   });
//   // @todo consider decimals from coin info
//   const decimals = 18;
//   return balance / ( 10 ** decimals);
// };

export {
  balanceOf,
};