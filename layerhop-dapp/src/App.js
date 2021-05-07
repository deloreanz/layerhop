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
  TextField,
} from '@material-ui/core';
import AppDialog from './components/AppDialog.js';
import { ethers, providers, BigNumber, utils, } from 'ethers';
import SuperfluidSDK from '@superfluid-finance/js-sdk/src';
// import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';
import GasPrice from './components/GasPrice.js';
import { initConnext, getEstimatedFee, preTransferCheck, crossChainSwap, withdraw, getWithdrawAddress, } from './libs/connextVectorSDK.js';
import { useWallet } from './providers/WalletProvider.js';
import { getBalances } from './libs/covalentAPI.js';
// import erc20 from './libs/erc20.js';
import erc20 from './libs/erc20.js';
import layerhopContractLib from './libs/layerhopContract.js';
import { windowProvider, getProvider } from './libs/web3Providers.js';

import config from './config.js';

// var erc20From, erc20To;
const getSuperfluidTokenSymbols = (config, networkId) => {
  // @todo cleanup how testnets are detected
  const networkType = [1, 137].includes(networkId) ? 'mainnet' : 'testnet';
  return Object.entries(config.superfluid.tokenByNetwork[networkType][networkId]).map(([tokenAddress, token]) => {
    return token.symbol;
  });
};

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
    // padding: theme.spacing(2),
    // padding: 10,
  },
  control: {
    padding: theme.spacing(2),
  },
  networkBlock: {
    height: 300,
    width: '100%',
    // margin: 20,
    backgroundColor: '#d0d0d0',
    padding: 10,
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
  const [toNetworkAddress, setToNetworkAddress] = useState();
  // const [fromNetworkId, setFromNetworkId] = useState();
  const [networkIdTo, setNetworkIdTo] = useState();
  const [estimate, setEstimate] = useState();
  const [fromBalances, setFromBalances] = useState();
  const [toBalances, setToBalances] = useState();
  // ACTIONS: plotCourse, ship, unlockCollateral
  // SHIP STATE: cargoReady, shipReady, shipArrived, cargoDelivered, collateralUnlocked
  const [appState, setAppState] = useState('init');
  const [tokenToShipAddress, setTokenToShipAddress] = useState();
  const [tokenToShip, setTokenToShip] = useState();
  const [tokenToShipAmount, setTokenToShipAmount] = useState(4 * Math.pow(10, 18));
  const [tokenAddressTo, setTokenAddressTo] = useState();
  // balances = { address1: balance1, address2: balance  }
  const [fromSuperBalances, setFromSuperBalances] = useState([]);
  const [toSuperBalances, setToSuperBalances] = useState([]);
  // mirrors the balances stored in the LayerHop smart contract on the network the browser wallet is connected to
  const [layerhopBalancesFrom, setLayerhopBalancesFrom] = useState();
  // balances on the 'to' network
  const [layerhopBalancesTo, setLayerhopBalancesTo] = useState();
  // contracts on 'from' and 'to' networks
  const [layerhopContractFrom, setLayerhopContractFrom] = useState();
  const [layerhopContractTo, setLayerhopContractTo] = useState();
  const [tokenAllowanceFrom, setTokenAllowanceFrom] = useState();
  // dialog
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [dialogToken, setDialogToken] = useState();
  

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

  // init erc20 contracts for 'from' network
  // useEffect(() => {
  //   if (!loginProvider || !networkId) return;
  //   // init erc20 on this network with provider
  //   // erc20From = erc20({ provider: loginProvider, networkId });
  //   setErc20From(erc20({ provider: loginProvider, networkId }));
  // }, [loginProvider, networkId]);
  // // same for 'to' network
  // useEffect(() => {
  //   if (!networkIdTo) return;
  //   // init erc20 on this network with provider
  //   // erc20To = erc20({ provider: getProvider(networkIdTo), networkIdTo });
  //   setErc20To(erc20({ provider: getProvider(networkIdTo), networkId: networkIdTo }));
  // }, [networkIdTo]);

  // keep layerhop balances updated from smart contract
  useEffect(() => {
    if (!networkId || !networkType || !config || !tokenToShipAddress) return;
    if (!config.layerhop.networks[networkId].contractAddress) return;
    const layerhopContractFrom = layerhopContractLib({ networkId, loginProvider: signer, });
    setLayerhopContractFrom(layerhopContractFrom);
    // @todo check on an interval
    // get balances
    const getBalances = async () => {
      setLayerhopBalancesFrom(await layerhopContractFrom.getBalance(address, tokenToShipAddress));
    };
    getBalances();
    // set the 'to' network token address
    setTokenAddressTo(config.connext.network[networkType].tokens[tokenToShip][networkIdTo]);
  }, [networkId, config, tokenToShipAddress]);
  // layerhop 'to' network contract
  useEffect(() => {
    if (!networkIdTo || !networkType || !config || !tokenAddressTo) return;
    if (!config.layerhop.networks[networkIdTo].contractAddress) return;
    const layerhopContractTo = layerhopContractLib({ networkId: networkIdTo, });
    setLayerhopContractTo(layerhopContractTo);
    // @todo check on an interval
    // get balances
    const getBalances = async () => {
      let balance = await layerhopContractTo.getBalance(address, tokenAddressTo);
      // balance = balance.div(Math.pow(10, 18).toString());//.toFixed(6)};
      setLayerhopBalancesTo(balance);
    };
    getBalances();
  }, [networkIdTo, networkType, config, tokenAddressTo]);

  // get allowance for layerhop on the 'from' chain for the selected erc20 token
  useEffect(() => {
    if (!config || !tokenToShipAddress || !address || !networkId) return;
    var layerhopContractAddress = config.layerhop.networks[networkId].contractAddress;
    const init = async () => {
      const allowance = await erc20.allowance({
        networkId,
        tokenAddress: tokenToShipAddress,
        // owner
        owner: address,
        // spender
        // config.layerhop.networks[networkId].contractAddress);
        spender: layerhopContractAddress,
      });
      console.log('from network token allowance:', allowance);
      setTokenAllowanceFrom(allowance);
    };
    init();
  }, [config, tokenToShipAddress, address, networkId]);

  // set the default token to ship
  useEffect(() => {
    // only run when tokenToShip is not set initially
    if (tokenToShip || !config || !networkType || !networkId) return;
    const defaultTokenSymbol = 'fDAI';
    const defaultTokenToShipAddress = Object.entries(config.superfluid.tokenByNetwork[networkType][networkId])
      .filter(([tokenAddress, entry]) => entry.symbol === defaultTokenSymbol);
    const thisAddress = defaultTokenToShipAddress[0][0];
    console.log(`Setting default token to ship to address = ${thisAddress}`);
    setTokenToShip(defaultTokenSymbol);
    setTokenToShipAddress(thisAddress);
  }, [config, networkType, networkId]);

  // assume the 'to' network address is the same as the 'from' network address
  // @todo make this flexible 
  useEffect(() => {
    if (!address) return;
    setToNetworkAddress(address);
  }, [address]);

  useEffect(() => {
    if (!networkId || !config) return;
    // console.log('config', config);
    // if using Ethereum/Kovan set 'to' network to Polygon/Mumbai
    if (networkId === config.networks.ethereum.testnets.goerli.id) {
      setNetworkIdTo(config.networks.polygon.testnets.mumbai.id);
    }
    // if using Ethereum/Kovan set 'to' network to Polygon/Mumbai
    if (networkId=== config.networks.polygon.testnets.mumbai.id) {
      setNetworkIdTo(config.networks.ethereum.testnets.goerli.id);
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
    if (!address || !config || !networkType || !networkId || !networkIdTo) return;
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
        const balance = await erc20.balanceOf({ networkId, tokenAddress, address });
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
  }, [address, config, networkType, networkId, networkIdTo]);

  useEffect(() => {
    if (!address || !networkId || !networkIdTo || !networkType) return;
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
      let fromBalances = await Promise.all(allTokenEntriesFrom.map(async ([tokenAddress, entry]) => {
        if (!enabledTokenSymbols[networkType].has(entry.symbol)) return;
        const balance = await erc20.balanceOf({
          networkId,
          tokenAddress,
          address,
        });
        return {
          tokenAddress,
          symbol: entry.symbol,
          balance,
          // @todo fix hardcode decimals
          decimals: 18,
        };
      }));
      const allTokenEntriesTo = Object.entries(config.superfluid.tokenByNetwork[networkType][networkIdTo]);
      let toBalances = await Promise.all(allTokenEntriesTo.map(async ([tokenAddress, entry]) => {
        if (!enabledTokenSymbols[networkType].has(entry.symbol)) return;
        const balance = await erc20.balanceOf({
          networkId: networkIdTo,
          tokenAddress,
          address,
        });
        return {
          tokenAddress,
          symbol: entry.symbol,
          balance,
          // @todo fix hardcode decimals
          decimals: 18,
        };
      }));

      // remove any super tokens from the normal balances arrays
      fromBalances = fromBalances.filter(entry => !entry.symbol.endsWith('x'));
      toBalances = toBalances.filter(entry => !entry.symbol.endsWith('x'));

      setFromBalances(fromBalances);
      setToBalances(toBalances);
    };
    init();
  }, [address, networkId, networkIdTo, networkType]);

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

  // 1- APPROVE (SHIPPER ACTION)
  const approveERC20 = async () => {
    // prep value as big number
    const allowanceIncreaseBn = BigNumber.from(
      // utils.parseUnits(input, connextSdk.senderChain.assetDecimals)
      getNeededAllowance() + '', 18
    );
    console.log('allowanceIncreaseBn', allowanceIncreaseBn);
    const layerhopContractAddress = config.layerhop.networks[networkId].contractAddress;
    const res = await erc20.increaseAllowance({
      networkId,
      tokenAddress: tokenToShipAddress,
      signer,
      spender: layerhopContractAddress,
      addedValue: allowanceIncreaseBn,
    });
    console.log('increaseAllowance res', res);
    return res;
  };

  // 2 - PREP CARGO (SHIPPER ACTION)
  const depositTokensToLayerhop = async () => {
    // prep value as big number
    const tokenToShipAmountBn = BigNumber.from(
      // utils.parseUnits(input, connextSdk.senderChain.assetDecimals)
      tokenToShipAmount + '', 18
    );
    console.log('tokenToShipAmountBN', tokenToShipAmountBn.toString());
    const res = await layerhopContractFrom.deposit(tokenToShipAddress, tokenToShipAmountBn);
    console.log('depositTokensToLayerhop res', res);
    return res;
  };

  // 3 - REQUEST BOAT (CAPTAIN ACTION)
  const openStateChannel = async () => {
    if (!loginProvider || !networkId || !networkType || !tokenToShip || !networkIdTo) {
      console.log(loginProvider, networkId, networkType, tokenToShip, networkIdTo);
      throw new Error('missing params needed when calling openStateChannel');
    };
    
      // init the Connext Vector SDK
    const { offChainSenderChainAssetBalanceBn, offChainRecipientChainAssetBalanceBn } = await initConnext({
      connextNetwork: networkType,
      loginProvider,
      fromNetworkId: networkId,
      toNetworkId: networkIdTo,
      // lookup connext asset addresses using the token symbol on both networks
      senderAssetId: config.connext.network[networkType].tokens[tokenToShip][networkId],
      recipientAssetId: config.connext.network[networkType].tokens[tokenToShip][networkIdTo],
    });
    console.log('openStateChannel:');
    console.log(`offChainSenderChainAssetBalanceBn: ${offChainSenderChainAssetBalanceBn}`);
    console.log(`offChainRecipientChainAssetBalanceBn: ${offChainRecipientChainAssetBalanceBn}`);
    // now estimate a fee to deposit
    const thisEstimate = await getEstimatedFee(tokenToShipAmount);
    console.log('Fee estimate:', thisEstimate);
    setEstimate(thisEstimate);
  };

  // 4 - LOAD CARGO ON BOAT (CAPTAIN ACTION)
  const depositToChannel = async () => {
    // const tokenToShipAmountBn = BigNumber.from(
    //   // utils.parseUnits(input, connextSdk.senderChain.assetDecimals)
    //   tokenToShipAmount + '', 18
    // );
    const res = await preTransferCheck(tokenToShipAmount + '');
    console.log('depositToChannel res', res);
    setAppState('depositComplete');
    return res;
  };

  // 5 - SHIP CARGO (CAPTAIN ACTION)
  const channelWithdraw = async () => {
    // if (!estimate.transferQuote) throw new Error('estimate.transferQuote is required to perform a cross chain swap');
    
    const tokenToShipAmountBn = BigNumber.from(
      // utils.parseUnits(input, connextSdk.senderChain.assetDecimals)
      tokenToShipAmount + '', 18
    );

    console.log('Generating withdrawCallData for withdraw onto other chain...');
    const withdrawCallData = await layerhopContractFrom.getCallData({
      plans: [
        [
          // param1 - accountAddress
          address,
          // param2 - opCode
          0x0001,
          // param3 - tokenAddress
          tokenAddressTo,
          // param4 - tokenAmount
          // @todo fix this to only be for user 1 once batching is enabled
          // tokenToShipAmount / Math.pow(10, 18),
          // no idea why this needs to be divided 10^18
          // tokenToShipAmountBn.div(Math.pow(10, 18).toString()).toString(),
          tokenToShipAmountBn.toString(),
          // param5 - null
          0x0,
          // param6 - null
          0x0,
        ],
        // @todo batch plans here
      ],
    });
    console.log('withdrawCallData:', withdrawCallData);

    // browserNode fields:
    // public routerPublicIdentifier = "";
    // public senderChainChannelAddress = "";
    // public recipientChainChannelAddress = "";
    // public crossChainTransferId = "";
    // public senderChainChannel?: FullChannelState;
    // public recipientChainChannel?: FullChannelState;
    // public senderChain?: ChainDetail;
    // public recipientChain?: ChainDetail;
    // public browserNode?: BrowserNode;

    // const params = {
    //   recipientAddress: config.layerhop.networks[networkIdTo].contractAddress,
    //   transferQuote: estimate.transferQuote,
    //   // withdrawCallTo: config.layerhop.networks[networkIdTo].contractAddress,
    //   // withdrawCallData,
    //   // generateCallData,
    //   onTransferred: () => console.log(`cross chain swap transfered: `),
    //   onFinished: (txHash, amountUi, amountBn) => console.log(`cross chain swap finished: `, txHash, amountUi, amountBn), // onFinished callback function,
    // };
    const withdrawParams = {
      tokenAmount: tokenToShipAmountBn.toString(),
      tokenAddress: tokenAddressTo,
      recipientAddress: config.layerhop.networks[networkIdTo].contractAddress,
      // fee,
      callTo: config.layerhop.networks[networkIdTo].contractAddress,
      callData: withdrawCallData,
    };
    console.log('calling withdraw with withdrawParams:');
    console.log(withdrawParams);

    // const connextWithdraw = await crossChainSwap(params);

    // const amount = BigNumber.from((3 * Math.pow(10, 18)).toString()).toString();
    const { isError, error, value } = await withdraw(withdrawParams);
    console.log('channelWithdraw res');
    if (isError || error) throw new Error('Error in withdraw:', error);
    if (value) {
      console.log('connextWithdraw success!');
      console.log('value', value);
      const txHash = value.transactionHash;
      console.log('txHash', txHash);
      return value;
    }

    // const connextWithdraw = await withdraw({
    //   assetId: tokenToShipAddress,
    //   amount: tokenToShipAmountBn,
    //   channelAddress: getWithdrawAddress(), //fromChannel.channelAddress,
    //   callData,
    //   callTo: config.layerhop.networks[networkIdTo].contractAddress,
    //   // @todo allow user to change this to their address on the other chain if they don't want to deposit into the layerhop contract
    //   recipient: config.layerhop.networks[networkIdTo].contractAddress,
    //   // fee,
    // });
    // if (connextWithdraw.isError) {
    //   throw connextWithdraw.getError();
    // }
    // console.log(`connextWithdraw complete: `, connextWithdraw.getValue());
    // make sure tx is sent
    // let tx = connextWithdraw.getValue().transactionHash;
    // const providerFrom = getProvider(networkId);
    // let receipt = await providerFrom.waitForTransaction(tx);
    // console.log('connextWithdraw receipt: ', receipt);
  };

  const getTokenSymbolByAddress = tokenAddress => {
    if (!config || !networkType) return '';
    return config.superfluid.tokenByNetwork[networkType][networkId][tokenAddress.toLowerCase()].symbol;
  };

  const getRateArrow = rate => {
    if (rate > 0) return <Typography className={classes.rateUpArrow}>▲</Typography>;
    if (rate < 0) return <Typography className={classes.rateDownArrow}>▼</Typography>;
  };

  const getNeededAllowance = () => {
    if (!tokenToShipAmount || tokenAllowanceFrom === undefined) return '0';
    const toShipBn = BigNumber.from(tokenToShipAmount + '');
    const allowanceBn = BigNumber.from(tokenAllowanceFrom + '');
    // no additional allowance needed if allowance greater than shipping total
    if (allowanceBn.gte(toShipBn)) return '0';
    // otherwise return the deficit
    const result = toShipBn.sub(allowanceBn).toString();
    // console.log('getNeededAllowance', result);
    return result;
  };

  const moreAllowanceNeeded = () => {
    return ![0, '0'].includes(getNeededAllowance());
  };

  const getNetworkName = networkId => {
    // @todo fix config and refernce it here instead of hard code
    if (networkId === 5) return 'Ethereum/Goerli';
    if (networkId === 80001) return 'Polygon/Mumbai';
    throw new Error(`Unsupported network id '${networkId}'.`);
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
              <Typography>SHIPPING ESTIMATE</Typography>
              <Typography>{JSON.stringify(estimate)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid container item spacing={5} justify='center' sm={12}>
          <Grid container item sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{network && network.name}</Typography>
              </Grid>
              <Grid item sm={12}>
                <Typography variant='h6'>Stream Tokens 🌊 </Typography>
              </Grid>
              {Object.values(fromSuperBalances).map(({ tokenAddress, balance, rate }) =>
                <Grid item container key={tokenAddress}>
                  <Grid item sm={4}>
                    <Typography>{getTokenSymbolByAddress(tokenAddress)}</Typography>
                  </Grid>
                  <Grid item sm={4}>
                    <Typography>{balance.toFixed(6)}</Typography>
                  </Grid>
                  <Grid item sm={1}>{getRateArrow(rate)}</Grid>
                  <Grid item sm={3}>
                    <Button
                      onClick={() => {
                        setTokenToShipAddress(tokenAddress);
                        setTokenToShip(getTokenSymbolByAddress(tokenAddress));
                        setDialogIsOpen(true);
                      }}
                    >Plan</Button>
                  </Grid>
                </Grid>
              )}
              <Grid item sm={12}>
                <Typography variant='h6'>Static Tokens 💰</Typography>
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
                      onClick={() => {
                        setTokenToShipAddress(entry.tokenAddress);
                        setTokenToShip(getTokenSymbolByAddress(entry.tokenAddress));
                        setDialogIsOpen(true);
                      }}
                    >Plan</Button>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>

          <Grid container item sm={2}></Grid>

          <Grid container item sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{networkIdTo && getNetworkName(networkIdTo)}</Typography>
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

        <Grid container item spacing={3} justify='center' sm={12}>
          <Grid container item spacing={3} sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{networkId && getNetworkName(networkId)} LayerHop Balances</Typography>
              </Grid>
              {/* @todo make this work for more than one token */}
              <Grid item sm={12}>
                <Typography variant='h6'>{tokenToShip}:</Typography>
              </Grid>
              {layerhopBalancesFrom && (parseInt(layerhopBalancesFrom) / Math.pow(10, 18)).toFixed(6)}

              <Typography variant='h6' justify='center'>Shipping Plans 📋</Typography>
              📦📦📦
              {layerhopBalancesFrom && layerhopBalancesFrom[tokenToShipAddress] && 
              Object.entries(layerhopBalancesFrom[tokenToShipAddress]).map(([accountAddress, balance]) =>
                <Grid container item sm={12}>
                  <Grid item sm={3}>
                    <Typography variant='h6'>{accountAddress}</Typography>
                  </Grid>
                  <Grid item sm={3}>
                    <Typography variant='h6'>{balance}</Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>

          <Grid container item sm={2}>
            <Paper className={classes.networkBlock}>
              <Grid item justify='center' sm={12}>
                <Typography>Ship ⚓</Typography>
              </Grid>
              
              <Grid item sm={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => openStateChannel()}
                >Captain</Button>
              </Grid>
              {estimate && estimate.transferQuote &&
                <Grid item sm={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!estimate || !estimate.transferQuote}
                    onClick={() => depositToChannel()}
                  >Load Cargo</Button>
                </Grid>
              }
              {appState === 'depositComplete' &&
                <Grid item sm={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!estimate || !estimate.transferQuote}
                    onClick={async() => await channelWithdraw()}
                  >Ship Cargo!</Button>
                </Grid>
              }

              {/* <Grid item sm={12}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={async () => {
                    // now estimate a fee to deposit
                    const thisEstimate = await getEstimatedFee(tokenToShipAmount);
                    console.log('Fee estimate:', thisEstimate);
                    setEstimate(thisEstimate);
                  }}
                >Get Estimate</Button>
              </Grid> */}
            </Paper>
          </Grid>

          <Grid container item spacing={3} sm={3}>
            <Paper className={classes.networkBlock}>
              <Grid item sm={12}>
                <Typography variant='h6'>{networkIdTo && getNetworkName(networkIdTo)} LayerHop Balances</Typography>
              </Grid>
              {/* @todo make this work for more than one token */}
              <Grid item sm={12}>
                <Typography variant='h6'>{tokenToShip}:</Typography>
              </Grid>
              {layerhopBalancesTo && utils.formatEther(layerhopBalancesTo.toString())}
              {/* / Math.pow(10, 18)).toFixed(6)} */}
              {layerhopBalancesTo && layerhopBalancesTo[tokenAddressTo] && 
              Object.entries(layerhopBalancesTo[tokenAddressTo]).map(([accountAddress, balance]) =>
                <Grid container item sm={12}>
                  <Grid item sm={3}>
                    <Typography variant='h6'>{accountAddress}</Typography>
                  </Grid>
                  <Grid item sm={3}>
                    <Typography variant='h6'>{balance}</Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>

        </Grid>

      </Grid>

      <AppDialog
        dialogToken={dialogToken}
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        // onClose={}
        tokenAllowanceFrom={tokenAllowanceFrom}
        moreAllowanceNeeded={moreAllowanceNeeded}
        getNeededAllowance={getNeededAllowance}
        approveERC20={approveERC20}
        tokenToShip={tokenToShip}
        tokenToShipAmount={tokenToShipAmount}
        setTokenToShipAmount={setTokenToShipAmount}
        depositTokensToLayerhop={depositTokensToLayerhop}
      />

    </div>
  );
};