'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');
const tokenlist = ['Bitcoin','Dogecoin','Tether','Ethereum','Cardano','Litecoin','Cosmos','Decred']; // 20220719, consist with index.js
// const tokenlist = ['Bitcoin', 'Dogecoin', 'Tether'];

// Main program function
exports.createOrder = async function (username, type, amount, itemname, shares) {

    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/wallet');

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Specify userName for network access
        const userName = username;

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../organization/darkpool/gateway/connection-org2.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }

        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');

        await gateway.connect(connectionProfile, connectionOptions);

        // Access PaperNet network
        console.log('Use network channel: mychannel.');

        const network = await gateway.getNetwork('mychannel');

        // Check the available
        /*
        var res = {};  // Account Info
        for (var t = 0; t < tokenlist.length; t++) {
            // Get addressability to commercial paper contract
            console.log('Use Token smart contract.');
            const contract = await network.getContract('tokenContract', tokenlist[t]);
            // queries - commercial paper
            console.log('-----------------------------------------------------------------------------------------');
            console.log('****** Submitting Token queries ****** \n\n ');
            let queryResponse = await contract.evaluateTransaction('Symbol');
            var symbol = queryResponse.toString();
            console.log(symbol);
            console.log('\n  Symbol query complete.');
            console.log('-----------------------------------------------------------------------------------------\n\n');
            queryResponse = await contract.evaluateTransaction('ClientAccountID');
            console.log(queryResponse.toString());
            console.log('\n  ClientAccountID query complete.');
            console.log('-----------------------------------------------------------------------------------------\n\n');
            let ID = queryResponse.toString();
            queryResponse = await contract.evaluateTransaction('BalanceOf', ID);
            var balance = queryResponse.toString();
            console.log(balance);
            console.log('\n  BalanceOf query complete.');
            console.log('-----------------------------------------------------------------------------------------\n\n');
            queryResponse = await contract.evaluateTransaction('GetFreezedBalance', ID);
            var freezedtoken = queryResponse.toString();
            res[tokenlist[t]] = balance - freezedtoken;
        }

        // If not available, error
        if (res[itemname] < amount) {
            return 'NotAvailable';
        }
        */
        // Get addressability to commercial paper contract
        console.log('Use Order smart contract.');

        const contract = await network.getContract('orderContract', 'Order');

        // queries - commercial paper
        console.log('-----------------------------------------------------------------------------------------');
        console.log('****** Submitting Order queries ****** \n\n ');

        let queryResponse = await contract.submitTransaction('CreateOrder', type, amount, itemname, shares);
        console.log(queryResponse.toString());  // NULL
        console.log('\n  CreateOrder query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');
        return true;

    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        return false;

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}
