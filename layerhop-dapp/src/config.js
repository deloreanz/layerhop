export default {
  connext: {
    network: {
      mainnet: {
        publicId: 'vector892GMZ3CuUkpyW8eeXfW2bt5W73TWEXtgV71nphXUXAmpncnj8',
        tokens: {
          TEST: {
            1: '0x9E86dd60e0B1e7e142F033d1BdEf734c6b3224Bb',
            137: '0x9E86dd60e0B1e7e142F033d1BdEf734c6b3224Bb',
          },
          DAI: {
            1: '',
            137: '',
          },
          USDC: {
            1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
          },
        },
      },
      testnet: {
        publicId: 'vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q',
        tokens: {
          TEST: {
            5: '0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa',
            80001: '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1',
          },
        },
      },
    },
  },
  // infuraProjectId: 'c5c672b375a64649849d05cab7a3ef01',
  networks: {
    ethereum: {
      mainnet: {
        id: 1,
        name: 'Ethereum/Mainnet',
        providerUrl: 'https://mainnet.infura.io/v3/c5c672b375a64649849d05cab7a3ef01',
      },
      testnets: {
        goerli: {
          id: 5,
          name: 'Ethereum/Goerli',
          providerUrl: 'https://goerli.infura.io/v3/c5c672b375a64649849d05cab7a3ef01',
        },
      },
    },
    polygon: {
      mainnet: {
        id: 137,
        name: 'Polygon/Mainnet',
        providerUrl: 'https://rpc-mainnet.maticvigil.com/',
      },
      testnets: {
        mumbai: {
          id: 80001,
          name: 'Polygon/Mumbai',
          providerUrl: 'https://rpc-mumbai.matic.today',
        },
      },
    },
  },
};