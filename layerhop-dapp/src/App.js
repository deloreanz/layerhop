import './App.css';
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Grid,
  Typography,
  Paper,
} from '@material-ui/core';
import { ethers } from 'ethers';
import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';

// Update with the contract address logged out to the CLI when it was deployed 
const greeterAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    textAlign: 'center',
  },
  paper: {
    height: 140,
    width: 100,
  },
  control: {
    padding: theme.spacing(2),
  },
}));

export default () => {
  // store greeting in local state
  const classes = useStyles();
  const [greeting, setGreetingValue] = useState();

  // request access to the user's MetaMask account
  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  // call the smart contract, read the current greeting value
  async function fetchGreeting() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(greeterAddress, Greeter.abi, provider);
      try {
        const data = await contract.greet();
        console.log('data: ', data);
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }

  // call the smart contract, send an update
  async function setGreeting() {
    if (!greeting) return;
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(greeterAddress, Greeter.abi, signer);
      const transaction = await contract.setGreeting(greeting);
      await transaction.wait();
      fetchGreeting();
    }
  }

  return (
    <Grid container className={classes.root} spacing={2} sm={12}>
      <Grid container item justify='center' sm={12}>
        <Paper className={classes.paper}>
          {/* <Typography>{greeting}</Typography> */}
          <Button
            type='primary'
            onClick={fetchGreeting}>Fetch Greeting!</Button>
          <Button
            onClick={setGreeting}>Set Greeting</Button>
          <input onChange={e => setGreetingValue(e.target.value)} placeholder="Set greeting" />
        </Paper>
      </Grid>
    </Grid>
  );
};