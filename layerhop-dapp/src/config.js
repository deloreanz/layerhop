export default {
  layerhop: {
    networks: {
      5: {
        contractAddress: '0xf3685b4F7a984157e143DAce957272bCa4f094C5',
      },
      80001: {
        contractAddress: '',
      },
    },
  },
  superfluid: {
    tokenByNetwork: {
      mainnet: {

      },
      testnet: {
        5: {
          // '0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa': {
          //   symbol: 'TEST',
          //   name: 'Test Token',
          // },
          '0x88271d333c72e51516b67f5567c728e702b3eee8': {
            symbol: 'fDAI',
            name: 'fDAI Fake Token',
          },
          '0xc94dd466416a7dfe166ab2cf916d3875c049ebb7': {
            symbol: 'fUSDC',
            name: 'fUSDC Fake Token',
          },
          '0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00': {
            symbol: 'fDAIx',
            name: 'Super fDAI Fake Token',
          },
          '0x8ae68021f6170e5a766be613cea0d75236ecca9a': {
            symbol: 'fUSDCx',
            name: 'Super fUSDC Fake Token',
          },
        },
        80001: {
          // '0xfe4f5145f6e09952a5ba9e956ed0c25e3fa4c7f1': {
          //   symbol: 'DERC20',
          //   name: 'Dummy ERC20',
          // },
          '0x15f0ca26781c3852f8166ed2ebce5d18265cceb7': {
            symbol: 'fDAI',
            name: 'fDAI Fake Token',
          },
          '0x5d8b4c2554aeb7e86f387b4d6c00ac33499ed01f': {
            symbol: 'fDAIx',
            name: 'Super fDAI Fake Token',
          },
          '0xbe49ac1eadac65dccf204d4df81d650b50122ab2': {
            symbol: 'fUSDC',
            name: 'fUSDC Fake Token',
          },
          '0x42bb40bf79730451b11f6de1cba222f17b87afd7': {
            symbol: 'fUSDCx',
            name: 'Super fUSDC Fake Token',
          },
        },
      },
    },
  },
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
        // publicId: 'vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q',
        publicId: 'vector5AdAkSFUXbZw132qwXMhREQKea5H4vsHttYsaRq7S3vC651KzE',
        tokens: {
          fDAI: {
            5: '0x88271d333c72e51516b67f5567c728e702b3eee8',
            80001: '0x15f0ca26781c3852f8166ed2ebce5d18265cceb7',
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
        kovan: {
          id: 42,
          name: 'Ethereum/Kovan',
          providerUrl: 'https://kovan.infura.io/v3/c5c672b375a64649849d05cab7a3ef01',
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
          // providerUrl: 'https://rpc-mumbai.matic.today',
          providerUrl: 'https://rpc-endpoints.superfluid.dev/mumbai',
        },
      },
    },
  },
};