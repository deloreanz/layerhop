
import { useEffect, useState } from 'react';
import axios from 'axios';

const urlEthGasStation = 'https://ethgasstation.info/api/ethgasAPI.json';

export default () => {
  const [gasPrice, setGasPrice] = useState();

  useEffect(() => {
    const getGasPrice = async () => {
      const res = await axios.get(urlEthGasStation);
      console.log(res);
    };
    getGasPrice();
  }, []);

  return (
    <div>
      {gasPrice}
    </div>
  );
};