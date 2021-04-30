// libs
import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import config from '../config';
// import { balanceOf } from '../contracts/erc20.js';
// vars
// exports
export const WalletContext = React.createContext();
export const useWallet = () => useContext(WalletContext);
export default ({ children }) => {
  const [walletState, setWalletState] = useState({});

  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [address, setAddress] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState();
  const [account, setAccount] = useState();
  const [balances, setBalances] = useState({});
  const [network, setNetwork] = useState();
  const [networkType, setNetworkType] = useState();

  useEffect(() => {
    // this returns the provider, or null if it wasn't detected
    // detect connection on load
    // console.log('checking selectedAddress');
    // // window.ethereum.on('accountsChanged', (accounts) => {
    //   window.ethereum.on('connect', (accounts) => {
    //   if (accounts.length) {
    //     setConnected(true);
    //   }
    //   // Handle the new accounts, or lack thereof.
    //   // "accounts" will always be an array, but it can be empty.
    // });

    if (!window.ethereum) throw new Error('window.ethereum is not defined');
    const init = async () => {   
      // ask user to confirm
      await window.ethereum.enable();
      // setup provider
      const thisProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(thisProvider);
      const thisSigner = thisProvider.getSigner();
      setSigner(thisSigner);
      setAddress(await thisSigner.getAddress());
      // get network id
      const { chainId: networkId } = await thisProvider.getNetwork();
      lookupAndSetNetwork(networkId);
    };
    init();

    // handle disconnect
    window.ethereum.on('accountsChanged', accounts => {
      console.log(`wallet account changed`);
      // Time to reload your interface with accounts[0]!
      if (!accounts.length) {
        setIsConnected(false);
      } else {
        setAccount(accounts[0]);
      }
    });
    window.ethereum.on('networkChanged', networkId => {
      // Time to reload your interface with the new networkId
      console.log(`wallet network changed to network id = ${networkId}`);
      lookupAndSetNetwork(networkId);
    })
  }, []);

  useEffect(() => {
    if (!provider) return;
    // @todo try to do this in a cleaner way
    const interval = setInterval(async () => {
      if (!window.ethereum.selectedAddress) return;
      setAccount(window.ethereum.selectedAddress);
      console.log('Connected!');
      setIsConnected(true);
      clearInterval(interval);

      // test getting info from contract
      // const makerAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      // var balance = await balanceOf(web3, makerAddress, window.ethereum.selectedAddress);
      // setBalances({
      //   ...balances,
      //   [makerAddress]: balance,
      // });

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccounts(accounts);
      console.log('accounts', accounts);
    }, 100);
  }, [provider]);

  const lookupAndSetNetwork = networkId => {
    const thisNetwork = getNetwork(networkId);
    setNetwork(thisNetwork);
    // setNetworkName(thisNetwork.name);
    // @todo fix hardcoded mainnet ids
    const thisNetworkType = [1, 137].includes(networkId)
      ? 'mainnet'
      : 'testnet';
    setNetworkType(thisNetworkType);
  };

  const connect = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      .catch(err => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('User rejected connection!');
        } else {
          console.error(err);
        }
      });
    setAccounts(accounts);
    console.log('Connection Success!');
    setIsConnected(true);
  };

  // @todo fix this function to make it more dynamic
  const getNetwork = networkId => {
    // Ethereum
    if (networkId === 1) {
      return config.networks.ethereum.mainnet;
    }
    if (networkId === 5) {
      return config.networks.ethereum.testnets.goerli;
    }
    // Polygon
    if (networkId === 137) {
      return config.networks.polygon.mainnet;
    }
    if (networkId === 80001) {
      return config.networks.polygon.testnets.mumbai;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletState,
        provider,
        signer,
        address,
        connect,
        isConnected,
        balances,
        accounts,
        account,
        network,
        networkType,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};