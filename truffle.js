/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */


// Deploy
 require('dotenv').config({path: '.env.local'});
 const Web3 = require("web3");
 const web3 = new Web3();
 const WalletProvider = require("truffle-wallet-provider");
 const Wallet = require('ethereumjs-wallet');

 module.exports = {
//   // See <http://truffleframework.com/docs/advanced/configuration>
//   // for more about customizing your Truffle configuration!
  networks: {
    development: {
        host: "127.0.0.1", //localhost
        port: 7545,
        network_id: "*" // Match any network id
    },
    // live: {
    //   host: "178.25.19.88", // Random IP for example purposes (do not use)
    //   port: 80,
    //   network_id: 1,        // Ethereum public network
    //   // optional config values:
    //   // gas
    //   // gasPrice
    //   // from - default address to use for any transaction Truffle makes during migrations
    //   // provider - web3 provider instance Truffle should use to talk to the Ethereum network.
    //   //          - function that returns a web3 provider instance (see below.)
    //   //          - if specified, host and port are ignored.
    // },
    ropsten: {
       provider: function(){
        var ropstenPrivateKey = new Buffer(process.env["ROPSTEN_PRIVATE_KEY"], "hex")
        var ropstenWallet = Wallet.fromPrivateKey(ropstenPrivateKey);
        return new WalletProvider(ropstenWallet, "https://ropsten.infura.io/");
       },
       gas: 4600000,
       gasPrice: web3.toWei("10", "gwei"),
       network_id: '3',
    }
  }
};
