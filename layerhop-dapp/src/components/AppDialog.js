import React, { useEffect, useState, } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Grid,
  TextField,
} from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import { ethers, providers, BigNumber, utils, } from 'ethers';
import erc20 from '../libs/erc20.js';

const useStyles = makeStyles({
  avatar: {
    backgroundColor: blue[100],
    color: blue[600],
  },
  frame: {
    padding: 20,
  },
  toAddress: {
    width: '100%',
  },
});

export default props => {
  const classes = useStyles();
  const {
    onClose,
    selectedValue,
    isOpen,
    setIsOpen,
    // from App
    // tokenAllowanceFrom,
    // moreAllowanceNeeded,
    // getNeededAllowance,
    // approveERC20,
    tokenToShip,
    tokenToShipAddress,
    depositTokensToLayerhop,
    address,
    config,
    networkId,
    signer,
  } = props;

  const [tokenToShipAmount, setTokenToShipAmount] = useState(1);
  // NOTE: default the stream to address to this address on the other network
  const [streamToAddress, setStreamToAddress] = useState();
  const [streamRate, setStreamRate] = useState(0);
  const [tokenAllowanceFrom, setTokenAllowanceFrom] = useState();

  useEffect(() => {
    setStreamToAddress(address);
  }, [address]);

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

  const handleClose = () => {
    setIsOpen(false);
  };

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

  const getPlan = () => {
    let opCode;
    let param3 = 0x0, param4 = 0x0;
    let streamRateParam = 0x0;
    if (tokenToShip.endsWith('x')) {
      // super token deposit and stream
      opCode = '0x0002';
      // param5 = stream to address
      // @todo remove this hard code and use drop down, or auto-map if default is to send same token on other network
      param3 = '0x5d8b4c2554aeb7e86f387b4d6c00ac33499ed01f'; // fDAIx on Mumbai
      param4 = streamToAddress;
      const streamRateBn = BigNumber.from(
        // utils.parseUnits(input, connextSdk.senderChain.assetDecimals)
        streamRate.toString(), 18
      );
      streamRateParam = streamRateBn;
    } else {
      // static token deposit
      opCode = '0x0001';
    }
    // prep value as big number
    const tokenToShipAmountBn = BigNumber.from(
      // utils.parseUnits(input, connextSdk.senderChain.assetDecimals)
      tokenToShipAmount.toString(), 18
    );
    return {
      accountAddress: address,
      opCode,
      // param1 - accountAddress
      // address, // NOTE: omitted since signer dictates the account address
      // param2 - opCode
      // opCode,
      // param3 - variable - tokenAddress
      param1: tokenToShipAddress,
      // param4 - tokenAmount
      // @todo fix this to only be for user 1 once batching is enabled
      // tokenToShipAmount / Math.pow(10, 18),
      // no idea why this needs to be divided 10^18
      // tokenToShipAmountBn.div(Math.pow(10, 18).toString()).toString(),
      param2: tokenToShipAmountBn.toString(),
      // param5 - variable
      param3,
      // param6 - variable
      param4,
      streamRate: streamRateParam,
    };
  };

  if (!tokenToShip) return <></>;

  return (
    <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={isOpen}>
      <DialogTitle id="simple-dialog-title">Create Cargo Plan</DialogTitle>

      <Grid container spacing={3} className={classes.frame}>

        <Grid item sm={6}>
          <Typography>{tokenToShip} to ship:</Typography>
          <TextField
            id="outlined-basic" 
            label="Outlined"
            variant="outlined"
            value={tokenToShipAmount / Math.pow(10, 18)}
            onChange={event => {
              let value = parseFloat(event.currentTarget.value);
              if (isNaN(value)) value = 0;
              console.log('setting tokens to ship to: ', value);
              setTokenToShipAmount(value * Math.pow(10, 18));
            }}
          />
        </Grid>
        <Grid item sm={6}>
          {tokenToShip.endsWith('x') &&
            <>
              <Typography>Stream Rate per Day</Typography>
              <TextField
                id="outlined-basic" 
                label="Outlined"
                variant="outlined"
                value={(streamRate / Math.pow(10, 18)) * (60 * 60 * 24)}
                onChange={event => {
                  // normalize value to wei value, then divide by seconds in a day (since this value is rate per day)
                  let value = (parseFloat(event.currentTarget.value) * Math.pow(10, 18)) / (60 * 60 * 24);
                  setStreamRate(parseInt(value));
                }}
              />
              <Typography>{streamRate * (30) / Math.pow(10, 18) } / month</Typography>
              {/* <Typography>{streamRate / (60 * 60)} / hr</Typography>
              <Typography>{streamRate / (60 * 60 * 24)} / day</Typography>
              <Typography>{streamRate / (60 * 60 * 24 * 30)} / month</Typography> */}
            </>
          }
        </Grid>
        {tokenToShip.endsWith('x') &&
          <Grid sm={12}>
            <Typography>To Address</Typography>
            <TextField
              id="outlined-basic"
              label="Outlined"
              variant="outlined"
              value={streamToAddress}
              className={classes.toAddress}
              onChange={event => {
                setStreamToAddress(event.currentTarget.value);
              }}
            />
          </Grid>
        }

        <Grid item sm={12}>
          <Typography>Allowance: {tokenAllowanceFrom / Math.pow(10, 18)}</Typography>
          {/* <Typography>can transfer: {moreAllowanceNeeded() ? 'no' : 'yes'}</Typography> */}
          {moreAllowanceNeeded() &&
            <>
              <Typography>Need to approve: {getNeededAllowance() / Math.pow(10, 18)}</Typography>
                <Button
                variant="contained"
                color="primary"
                disabled={!moreAllowanceNeeded()}
                onClick={() => approveERC20()}
              >Approve</Button>
            </>
          }
        </Grid>
        <Grid item sm={12}>
          <Button
            variant="contained"
            color="primary"
            disabled={moreAllowanceNeeded()}
            onClick={() => depositTokensToLayerhop(getPlan())}
          >Deposit Cargo & Plan</Button>
        </Grid>
      </Grid>

    </Dialog>
  );
}

// AppDialog.propTypes = {
//   // onClose: PropTypes.func.isRequired,
//   isOpen: PropTypes.bool.isRequired,
//   // selectedValue: PropTypes.string.isRequired,
// };