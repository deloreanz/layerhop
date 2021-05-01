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
import { initConnext, getEstimatedFee } from './libs/connextVectorSDK.js';
import { useWallet } from './providers/WalletProvider.js';
import { getBalances } from './libs/covalentAPI.js';
import { balanceOf } from './libs/erc20.js';

import config from './config.js';

// setup superfluid
const windowProvider = new ethers.providers.Web3Provider(window.ethereum);
const sf = new SuperfluidSDK.Framework({
  ethers: windowProvider,
  tokens: [
    'fDAI',
    'fUSDC',
    'ETH',
    // '0xdd5462a7db7856c9128bc77bd65c2919ee23c6e1',
  ],
});


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
}));

// Update with the contract address logged out to the CLI when it was deployed 
// const greeterAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

export default () => {
  // store greeting in local state
  const classes = useStyles();
  const { provider, signer, address, connect, isConnected, balances: coinBalances, network, networkType, networkId, getNetwork } = useWallet();
  // const [fromNetworkId, setFromNetworkId] = useState();
  const [toNetworkId, setToNetworkId] = useState();
  const [estimate, setEstimate] = useState();
  const [fromBalances, setFromBalances] = useState();
  const [toBalances, setToBalances] = useState();
  // ACTIONS: plotCourse, ship, unlockCollateral
  // SHIP STATE: cargoReady, shipReady, shipArrived, cargoDelivered, collateralUnlocked
  const [shipState, setShipState] = useState();
  const [tokenToShip, setTokenToShip] = useState();
  // balances = { address1: balance1, address2: balance  }
  const [balances, setBalances] = useState({});

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
    if (networkId === config.networks.ethereum.testnets.kovan.id) {
      setToNetworkId(config.networks.polygon.testnets.mumbai.id);
    }
    // if using Ethereum/Kovan set 'to' network to Polygon/Mumbai
    if (networkId=== config.networks.polygon.testnets.mumbai.id) {
      setToNetworkId(config.networks.ethereum.testnets.kovan.id);
    }
  }, [networkId, config]);

  useEffect(() => {
    const interval = setInterval(() => {
      // console.log('balances ....', balances);
      if (!Object.keys(balances).length) return;
      const newBalances = {};
      // console.log('balance obj', Object.entries(balances));
      Object.entries(balances).forEach(([address, { balance, rate }]) => {
        // console.log('balance => ', balance);
        newBalances[address] = {
          balance: balance + (rate / Math.pow(10, 18)),
          rate,
        };
      });
      setBalances(newBalances);
    }, 1000);
    return () => clearInterval(interval);
  }, [balances]);

  useEffect(() => {
    if (!address) return;
    const init = async () => {
      // init SF
      const sfResult = await sf.initialize();
      const tokenAddress = sf.tokens.ETHx.address;
      // const tokenAddress = sf.tokens.fDAI.address;
      // const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const accountDAI = sf.user({
        address,
        token: tokenAddress,
      });
      const sfDetails = await accountDAI.details();
      const rate = parseInt(sfDetails.cfa.netFlow);
      console.log('accountDAI.details()', sfDetails);
      const balance = await balanceOf({ provider: windowProvider, tokenAddress, address });
      const test = {
        ...balances,
        [address]: {
          balance,
          rate,
        },
      };
      console.log('test', test);
      setBalances({
        ...balances,
        [address]: {
          balance,
          rate,
        },
      });

      console.log('balance', balance);
    };
    init();
  }, [address]);

  useEffect(() => {
    if (!provider || !network || !networkType || !tokenToShip) return;
    // @todo make this more dynamic, currently only setup for Polygon to Ethereum
    // const thisFromNetworkId = networkType === 'testnet' ? 80001 : 137;
    const thisToNetworkId = networkType === 'testnet' ? 5 : 1;
    // setFromNetworkId(network.id);
    setToNetworkId(thisToNetworkId);

    const init = async () => {

      // init the Connext Vector SDK
      const { offChainSenderChainAssetBalanceBn, offChainRecipientChainAssetBalanceBn } = await initConnext({
        connextNetwork: networkType,
        loginProvider: provider,
        fromNetworkId: network.id,
        toNetworkId: thisToNetworkId,
        senderAssetId: config.connext.network[networkType].tokens[tokenToShip][network.id],
        recipientAssetId: config.connext.network[networkType].tokens[tokenToShip][thisToNetworkId],
      });
      console.log(`offChainSenderChainAssetBalanceBn: ${offChainSenderChainAssetBalanceBn}`);
      console.log(`offChainRecipientChainAssetBalanceBn: ${offChainRecipientChainAssetBalanceBn}`);
      // now estimate a fee to test
      const res = await getEstimatedFee(100);
      console.log('Fee estimate:', res);
      setEstimate(res);

      // connect to Polygon
      // const polygon = ethers.getDefaultProvider('https://rpc-mainnet.maticvigil.com');
      // const test = await polygon.getBlockNumber();
      // connect to Ethereum
      // @todo
    };
    init();
  }, [provider, network, networkType, tokenToShip]);

  useEffect(() => {
    console.log('INFO', address, networkId, toNetworkId);
    if (!address || !networkId || !toNetworkId) return;
    const init = async () => {
      const resFrom = await getBalances(network.id, address);
      const resTo = await getBalances(toNetworkId, address);
      setFromBalances(resFrom.data.data.items);
      setToBalances(resTo.data.data.items);
    };
    init();
  }, [address, networkId, toNetworkId]);

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

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>

        <Grid container item spacing={3} justify='center' sm={12}>
          <Grid item sm={4}>
            <Typography variant='h4'>LayerHop</Typography>
          </Grid>
          <Grid item sm={2}>
            <Card>
              <CardContent>
                {network &&
                  <Typography>Wallet connected to {network.name} (ID = {network.id})</Typography>
                }
              </CardContent>
            </Card>
          </Grid>
          <Grid item sm={2}>
            <GasPrice />
          </Grid>
          <Grid item sm={2}>
            <Typography>{address}</Typography>
          </Grid>
        </Grid>

        <Grid container item justify='center' sm={12}>
          <Typography>Estimate</Typography>
          <Typography>{JSON.stringify(estimate)}</Typography>
        </Grid>

        <Grid container item spacing={3} justify='center' sm={12}>
          <Grid container item spacing={3} sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{network && network.name}</Typography>
              </Grid>
              <Grid item sm={12}>
                <Typography variant='h6'>Static 💰</Typography>
              </Grid>
              {Array.isArray(fromBalances) && fromBalances.map((entry, i) =>
                <Grid item container key={i}>
                  <Grid item sm={4}>
                    <Typography>{entry.contract_ticker_symbol}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    <Typography>{parseInt(entry.balance) / (Math.pow(10, entry.contract_decimals))}</Typography>
                    <Button
                      onClick={() => setTokenToShip(entry.contract_ticker_symbol)}
                    >Ship</Button>
                  </Grid>
                </Grid>
              )}
              <Grid item sm={12}>
                <Typography variant='h6'>Streams 🌊 </Typography>
              </Grid>
              {Object.entries(balances).map(([address, { balance, rate }]) =>
                <Grid item container key={address}>
                  <Grid item sm={4}>
                    <Typography>{address.substring(0, 8)}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    {/* <Typography>{parseInt(balance) / (Math.pow(10, 18))}</Typography> */}
                    <Typography>{balance}</Typography>
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
              </Grid>
              <Grid item sm={12}>
                <Button
                  variant="contained"
                  color="primary"
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
                    <Typography>{entry.contract_ticker_symbol}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    <Typography>{parseInt(entry.balance) / (Math.pow(10, entry.contract_decimals))}</Typography>
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