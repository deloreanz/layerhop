
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
} from '@material-ui/core';
import axios from 'axios';

// const defipulseApiKey = '';
// const urlEthGasStation = `https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=${defipulseApiKey}`;
const urlEthGasStation = `https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json`;

export default () => {
  const [gasPrice, setGasPrice] = useState();

  useEffect(() => {
    const getGasPrice = async () => {
      const { data } = await axios.get(urlEthGasStation);
      setGasPrice(data.average / 10);
    };
    getGasPrice();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography>Average Gas Price: {gasPrice} Gwei</Typography>
      </CardContent>
    </Card>
  );
};