import './App.css';
import React, { useEffect, useState } from 'react';
// MUI
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
} from '@material-ui/core';
import { ethers } from 'ethers';
import SuperfluidSDK from '@superfluid-finance/js-sdk/src';
// import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';
import GasPrice from './components/GasPrice.js';
import { initConnext, getEstimatedFee, preTransferCheck, } from './libs/connextVectorSDK.js';
import { useWallet } from './providers/WalletProvider.js';
import { getBalances } from './libs/covalentAPI.js';
import { balanceOf } from './libs/erc20.js';

import config from './config.js';

const getSuperfluidTokenSymbols = (config, networkId) => {
  // @todo cleanup how testnets are detected
  const networkType = [1, 137].includes(networkId) ? 'mainnet' : 'testnet';
  return Object.entries(config.superfluid.tokenByNetwork[networkType][networkId]).map(([tokenAddress, token]) => {
    return token.symbol;
  });
};

// get the browser web3 provider
const windowProvider = new ethers.providers.Web3Provider(window.ethereum);

// MUI styles
const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    // textAlign: 'center',
    height: '100%',
  },
  paper: {
    height: 140,
    width: 100,
  },
  control: {
    padding: theme.spacing(2),
  },
  networkBlock: {
    height: 300,
    width: '100%',
    // margin: 20,
    backgroundColor: '#d0d0d0',
  },
  rateUpArrow: {
    color: 'green',
  },
  rateDownArrow: {
    color: 'red',
  },
}));

// Update with the contract address logged out to the CLI when it was deployed 
// const greeterAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

export default () => {
  // store greeting in local state
  const classes = useStyles();
  const { loginProvider, signer, address, connect, isConnected, balances: coinBalances, network, networkType, networkId, getNetwork } = useWallet();
  // const [fromNetworkId, setFromNetworkId] = useState();
  const [toNetworkId, setToNetworkId] = useState();
  const [estimate, setEstimate] = useState();
  const [fromBalances, setFromBalances] = useState();
  const [toBalances, setToBalances] = useState();
  // ACTIONS: plotCourse, ship, unlockCollateral
  // SHIP STATE: cargoReady, shipReady, shipArrived, cargoDelivered, collateralUnlocked
  const [shipState, setShipState] = useState();
  const [tokenToShip, setTokenToShip] = useState('fDAI');
  const [tokenToShipAmount, setTokenToShipAmount] = useState(1);
  // balances = { address1: balance1, address2: balance  }
  const [fromSuperBalances, setFromSuperBalances] = useState([]);
  const [toSuperBalances, setToSuperBalances] = useState([]);

  // const ticker = () => {
  //   console.log('balances ....', balances);
  //   if (!Object.keys(balances).length) return;
  //   const newBalances = {};
  //   console.log('balance obj', Object.entries(balances));
  //   Object.entries(balances).forEach(([address, { balance, rate }]) => {
  //     console.log('balance => ', balance);
  //     newBalances[address] = {
  //       balance: balance + rate,
  //       rate,
  //     };
  //   });
  //   setBalances(newBalances);
  // };

  useEffect(() => {
    if (!networkId || !config) return;
    // console.log('config', config);
    // if using Ethereum/Kovan set 'to' network to Polygon/Mumbai
    if (networkId === config.networks.ethereum.testnets.goerli.id) {
      setToNetworkId(config.networks.polygon.testnets.mumbai.id);
    }
    // if using Ethereum/Kovan set 'to' network to Polygon/Mumbai
    if (networkId=== config.networks.polygon.testnets.mumbai.id) {
      setToNetworkId(config.networks.ethereum.testnets.goerli.id);
    }
  }, [networkId, config]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(fromSuperBalances).length) {
        const newFromSuperBalances = {};
        Object.entries(fromSuperBalances).forEach(([tokenAddress, { balance, rate }]) => {
          newFromSuperBalances[tokenAddress] = {
            tokenAddress,
            balance: balance + (rate / Math.pow(10, 18)),
            rate,
          };
        });
        setFromSuperBalances(newFromSuperBalances);
      }
      if (Object.keys(toSuperBalances).length) {
        const newToSuperBalances = {};
        Object.entries(toSuperBalances).forEach(([tokenAddress, { balance, rate }]) => {
          newToSuperBalances[tokenAddress] = {
            tokenAddress,
            balance: balance + (rate / Math.pow(10, 18)),
            rate,
          };
        });
        setFromSuperBalances(newToSuperBalances);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [fromSuperBalances, toSuperBalances]);

  useEffect(() => {
    if (!address || !config || !networkType || !networkId || !toNetworkId) return;
    const init = async () => {
      // init SF 'from' balance/rate
      const sfFrom = new SuperfluidSDK.Framework({
        ethers: windowProvider,
        tokens: getSuperfluidTokenSymbols(config, networkId),
      });
      await sfFrom.initialize();
      const fromTokens = config.superfluid.tokenByNetwork[networkType][networkId];
      const newFromSuperBalancesArray = (await Promise.all(Object.entries(fromTokens).map(async ([tokenAddress, entry]) => {
        // @todo handle detecting super tokens better than this
        if (!entry.symbol.endsWith('x')) return null;
        const account = sfFrom.user({
          address,
          token: tokenAddress,
        });
        const details = await account.details();
        const rate = parseInt(details.cfa.netFlow);
        const balance = await balanceOf({ networkId, tokenAddress, address, });
        return {
          tokenAddress,
          balance,
          rate,
        };
      }))).filter(entry => entry !== null);
      var newFromSuperBalances = {};
      newFromSuperBalancesArray.forEach(entry => newFromSuperBalances[entry.tokenAddress] = entry);
      setFromSuperBalances(newFromSuperBalances);
      // init SF 'to' balance/rate
      // const sfTo = new SuperfluidSDK.Framework({
      //   ethers: windowProvider,
      //   tokens: getSuperfluidTokenSymbols(config, networkId),
      // });
      // await sfTo.initialize();
      // const toTokens = config.superfluid.tokenByNetwork[networkType][toNetworkId];
      // const newToSuperBalances = await Promise.all(Object.entries(toTokens).map(async ([tokenAddress, entry]) => {
      //   const account = sfTo.user({
      //     address,
      //     token: tokenAddress,
      //   });
      //   const details = await account.details();
      //   const rate = parseInt(details.cfa.netFlow);
      //   const balance = await balanceOf({ networkId, tokenAddress, address, });
      //   return ({
      //     ...toSuperBalances,
      //     [tokenAddress]: {
      //       balance,
      //       rate,
      //     },
      //   });
      // }));
      // setToSuperBalances(newToSuperBalances);

      console.log('done updating super balances');
    };
    init();
  }, [address, config, networkType, networkId, toNetworkId]);

  useEffect(() => {
    console.log(loginProvider, networkId, networkType, tokenToShip, toNetworkId);
    if (!loginProvider || !networkId || !networkType || !tokenToShip || !toNetworkId) return;
    // @todo make this more dynamic, currently only setup for Polygon to Ethereum
    // const thisToNetworkId = networkType === 'testnet' ? 80001 : 1;
    // setFromNetworkId(network.id);
    // setToNetworkId(thisToNetworkId);

    const init = async () => {

      // init the Connext Vector SDK
      const { offChainSenderChainAssetBalanceBn, offChainRecipientChainAssetBalanceBn } = await initConnext({
        connextNetwork: networkType,
        loginProvider,
        fromNetworkId: networkId,
        toNetworkId: toNetworkId,
        senderAssetId: config.connext.network[networkType].tokens[tokenToShip][networkId],
        recipientAssetId: config.connext.network[networkType].tokens[tokenToShip][toNetworkId],
      });
      console.log(`offChainSenderChainAssetBalanceBn: ${offChainSenderChainAssetBalanceBn}`);
      console.log(`offChainRecipientChainAssetBalanceBn: ${offChainRecipientChainAssetBalanceBn}`);
      // now estimate a fee to test
      const res = await getEstimatedFee(tokenToShipAmount);
      console.log('Fee estimate:', res);
      setEstimate(res);

      // connect to Polygon
      // const polygon = ethers.getDefaultProvider('https://rpc-mainnet.maticvigil.com');
      // const test = await polygon.getBlockNumber();
      // connect to Ethereum
      // @todo
    };
    init();
  }, [loginProvider, network, toNetworkId, networkType, tokenToShip]);

  useEffect(() => {
    if (!address || !networkId || !toNetworkId || !networkType) return;
    const init = async () => {
      // if (networkId === 5 || toNetworkId === 5) {
      //   // goerli not supported
      //   return;
      // }
      // const resFrom = await getBalances(networkId, address);
      // const resTo = await getBalances(toNetworkId, address);
      // setFromBalances(resFrom.data.data.items);
      // setToBalances(resTo.data.data.items);

      // enabled tokens
      const enabledTokenSymbols = {
        mainnet: new Set([
          'DAI', 'DAIx', 'USDC', 'USDCx',
        ]),
        testnet: new Set([
          'fDAI', 'fDAIx', 'fUSDC', 'fUSDCx',
        ]),
      };
      // get correct token addresses for this network
      const allTokenEntriesFrom = Object.entries(config.superfluid.tokenByNetwork[networkType][networkId]);
      const fromBalances = await Promise.all(allTokenEntriesFrom.map(async ([tokenAddress, entry]) => {
        if (!enabledTokenSymbols[networkType].has(entry.symbol)) return;
        const balance = await balanceOf({ networkId, tokenAddress, address });
        return {
          tokenAddress,
          symbol: entry.symbol,
          balance,
          // @todo fix hardcode decimals
          decimals: 18,
        };
      }));
      const allTokenEntriesTo = Object.entries(config.superfluid.tokenByNetwork[networkType][toNetworkId]);
      const toBalances = await Promise.all(allTokenEntriesTo.map(async ([tokenAddress, entry]) => {
        if (!enabledTokenSymbols[networkType].has(entry.symbol)) return;
        const balance = await balanceOf({ networkId: toNetworkId, tokenAddress, address });
        return {
          tokenAddress,
          symbol: entry.symbol,
          balance,
          // @todo fix hardcode decimals
          decimals: 18,
        };
      }));

      setFromBalances(fromBalances);
      setToBalances(toBalances);
    };
    init();
  }, [address, networkId, toNetworkId, networkType]);

  // request access to the user's Metamask account
  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  // call the smart contract, read the current greeting value
  // const fetchGreeting = async () => {
  //   if (typeof window.ethereum !== 'undefined') {
  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     const contract = new ethers.Contract(greeterAddress, Greeter.abi, provider);
  //     try {
  //       const data = await contract.greet();
  //       setGreetingValue(data);
  //     } catch (err) {
  //       console.log("Error: ", err);
  //     }
  //   }
  // }

  // // call the smart contract, send an update
  // async function setGreeting() {
  //   if (!greeting) return;
  //   if (typeof window.ethereum !== 'undefined') {
  //     await requestAccount();
  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     const signer = provider.getSigner();
  //     const contract = new ethers.Contract(greeterAddress, Greeter.abi, signer);
  //     const transaction = await contract.setGreeting(greeting);
  //     await transaction.wait();
  //     fetchGreeting();
  //   }
  // }

  const shipTokens = async transferAmount => {
    const res = await preTransferCheck(transferAmount);
    console.log('shipTokens res', res);
  };

  const getTokenSymbolByAddress = tokenAddress => {
    if (!config || !networkType) return '';
    return config.superfluid.tokenByNetwork[networkType][networkId][tokenAddress.toLowerCase()].symbol;
  };

  const getRateArrow = rate => {
    if (rate >= 0) return <Typography className={classes.rateUpArrow}>▲</Typography>;
    else return <Typography className={classes.rateDownArrow}>▼</Typography>;
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>

        <Grid container item spacing={3} justify='center' sm={12}>
          <Grid item sm={4}>
            <Typography variant='h4'>LayerHop</Typography>
          </Grid>
          <Grid item sm={2}>
            <GasPrice />
          </Grid>
          <Grid item sm={4}>
            <Card>
              <CardContent>
                {network &&
                  <Typography>Wallet connected to {network.name} (ID = {network.id})</Typography>
                }
              </CardContent>
              <Typography>{address}</Typography>
            </Card>
          </Grid>
        </Grid>

        <Grid container item justify='center' sm={12}>
          <Card>
            <CardContent>
              <Typography>SHIPPING ESTIMATE HERE</Typography>
              <Typography>{JSON.stringify(estimate)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid container item spacing={3} justify='center' sm={12}>
          <Grid container item spacing={3} sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{network && network.name}</Typography>
              </Grid>
              <Grid item sm={12}>
                <Typography variant='h6'>Streams 🌊 </Typography>
              </Grid>
              {Object.values(fromSuperBalances).map(({ tokenAddress, balance, rate }) =>
                <Grid item container key={tokenAddress}>
                  <Grid item sm={4}>
                    <Typography>{getTokenSymbolByAddress(tokenAddress)}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    <Typography>{balance.toFixed(6)}</Typography>
                  </Grid>
                  <Grid>{getRateArrow(rate)}</Grid>
                </Grid>
              )}
              <Grid item sm={12}>
                <Typography variant='h6'>Static 💰</Typography>
              </Grid>
              {Array.isArray(fromBalances) && fromBalances.map((entry, i) =>
                <Grid item container key={i}>
                  <Grid item sm={4}>
                    <Typography>{entry.symbol}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    <Typography>{entry.balance.toFixed(6)}</Typography>
                  </Grid>
                  <Grid item sm={3}>
                    <Button
                      onClick={() => setTokenToShip(entry.tokenAddress)}
                    >{'Ship =>'}</Button>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
          <Grid container item sm={2}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography justify='center'>Ship ⚓</Typography>
              </Grid>
              <Grid item sm={12}>
                <Typography justify='center'>Manifest 📋 📦📦📦</Typography>
                <Typography>{tokenToShip}</Typography>
              </Grid>
              <Grid item sm={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => shipTokens(tokenToShipAmount)}
                >Ship!</Button>
              </Grid>

              
            </Paper>
          </Grid>
          <Grid container item sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{toNetworkId}</Typography>
              </Grid>
              {Array.isArray(toBalances) && toBalances.map((entry, i) =>
                <Grid item container key={i}>
                  <Grid item sm={4}>
                    <Typography>{entry.symbol}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    <Typography>{entry.balance.toFixed(6)}</Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>

      </Grid>
    </div>
  );
};