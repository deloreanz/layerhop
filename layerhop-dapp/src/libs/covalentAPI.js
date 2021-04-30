
import axios from 'axios';

const getBalances = async (networkId, address) => {
  return await axios.get(`https://api.covalenthq.com/v1/${networkId}/address/${address}/balances_v2/?`);
};

export {
  getBalances,
};