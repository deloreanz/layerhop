import React from 'react';
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

const useStyles = makeStyles({
  avatar: {
    backgroundColor: blue[100],
    color: blue[600],
  },
  frame: {
    padding: 20,
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
    tokenAllowanceFrom,
    moreAllowanceNeeded,
    getNeededAllowance,
    approveERC20,
    tokenToShip,
    tokenToShipAmount,
    setTokenToShipAmount,
    depositTokensToLayerhop,
  } = props;

  const handleClose = () => {
    setIsOpen(false);
  };

  // const handleListItemClick = (value) => {
  //   onClose(value);
  // };

  return (
    <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={isOpen}>
      <DialogTitle id="simple-dialog-title">Create Cargo Plan</DialogTitle>

      <Grid container spacing={3} className={classes.frame}>
        <Grid item sm={12}>
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
            onClick={() => depositTokensToLayerhop()}
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