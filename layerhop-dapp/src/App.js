import './App.css';
import React, { useEffect, useState } from 'react';
// MUI
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Grid,
  Typography,
  Paper,
} from '@material-ui/core';
import { ethers } from 'ethers';
// import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';
import GasPrice from './components/GasPrice.js';
import { initConnext, getEstimatedFee } from './libs/connextVectorSDK.js';
import { useWallet } from './providers/WalletProvider.js';
import { getBalances } from './libs/covalentAPI.js';

import config from './config.js';

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
    margin: 20,
    backgroundColor: '#d0d0d0',
  },
}));

// Update with the contract address logged out to the CLI when it was deployed 
// const greeterAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

export default () => {
  // store greeting in local state
  const classes = useStyles();
  const { provider, signer, address, connect, isConnected, balances: coinBalances, network, networkType } = useWallet();
  const [fromNetworkId, setFromNetworkId] = useState();
  const [toNetworkId, setToNetworkId] = useState();
  const [estimate, setEstimate] = useState();
  const [fromBalances, setFromBalances] = useState();
  const [toBalances, setToBalances] = useState();

  useEffect(() => {
    if (!provider || !network || !networkType) return;
    // @todo make this more dynamic, currently only setup for Polygon to Ethereum
    const thisFromNetworkId = networkType === 'testnet' ? 80001 : 137;
    const thisToNetworkId = networkType === 'testnet' ? 5 : 1;
    setFromNetworkId(thisFromNetworkId);
    setToNetworkId(thisToNetworkId);

    // const init = async () => {
    //   // init the Connext Vector SDK
    //   const { offChainSenderChainAssetBalanceBn, offChainRecipientChainAssetBalanceBn } = await initConnext({
    //     connextNetwork: networkType,
    //     loginProvider: provider,
    //     fromNetworkId: thisFromNetworkId,
    //     toNetworkId: thisToNetworkId,
    //     senderAssetId: config.connext.network[networkType].tokens.USDC[thisFromNetworkId],
    //     recipientAssetId: config.connext.network[networkType].tokens.USDC[thisToNetworkId],
    //   });
    //   console.log(`offChainSenderChainAssetBalanceBn: ${offChainSenderChainAssetBalanceBn}`);
    //   console.log(`offChainRecipientChainAssetBalanceBn: ${offChainRecipientChainAssetBalanceBn}`);
    //   // now estimate a fee to test
    //   const res = await getEstimatedFee(100);
    //   setEstimate(res);

    //   // connect to Polygon
    //   // const polygon = ethers.getDefaultProvider('https://rpc-mainnet.maticvigil.com');
    //   // const test = await polygon.getBlockNumber();
    //   // connect to Ethereum
    //   // @todo
    // };
    // init();
  }, [provider, network, networkType]);

  useEffect(() => {
    if (!address || !fromNetworkId || !toNetworkId) return;
    const init = async () => {
      const resFrom = await getBalances(fromNetworkId, address);
      const resTo = await getBalances(toNetworkId, address);
      setFromBalances(resFrom.data.data.items);
      setToBalances(resTo.data.data.items);
    };
    init();
  }, [address, fromNetworkId, toNetworkId]);

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
      <Grid container>

        <Grid container item justify='center' sm={12}>
          <Grid item sm={4}>
            <Typography variant='h4'>LayerHop</Typography>
          </Grid>
          <Grid item sm={2}>
            {network &&
              <Typography>Network: {network.name} ({network.id})</Typography>
            }
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
          <Typography>{estimate}</Typography>
        </Grid>

        <Grid container item justify='center' sm={12}>
          <Grid container item sm={3}>
            <Paper className={classes.networkBlock}>
              <Typography variant='h6'>Polygon</Typography>
              {Array.isArray(fromBalances) && fromBalances.map(entry =>
                <>
                  <Typography>coin: {entry.contract_ticker_symbol}</Typography>
                  <Typography>balance: {parseInt(entry.balance) / entry.contract_decimals}</Typography>
                </>
              )}
            </Paper>
          </Grid>
          <Grid container item sm={6}>
            <Typography justify='center'>BOAT HERE</Typography>
          </Grid>
          <Grid container item sm={3}>
            <Paper className={classes.networkBlock}>
              <Typography variant='h6'>Ethereum</Typography>
            </Paper>
          </Grid>
        </Grid>

      </Grid>
    </div>
  );
};