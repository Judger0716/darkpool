'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');

// Main program function
exports.QueryBalance = async function (username) {

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

        // Get addressability to commercial paper contract
        console.log('Use Token smart contract.');

        const contract = await network.getContract('tokenContract', 'Token');

        // queries - commercial paper
        console.log('-----------------------------------------------------------------------------------------');
        console.log('****** Submitting Token queries ****** \n\n ');

        /*
                let queryResponse = await contract.submitTransaction('SetOption', 'Dogecoin', 'DOGE', '6');
                console.log(queryResponse.toString());
                console.log('\n  SetOption query complete.');
                console.log('-----------------------------------------------------------------------------------------\n\n');
        */
        
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
        return {
            'symbol': symbol,
            'balance': balance
        };

        /*
           let queryResponse3 = await contract.evaluateTransaction('ClientAccountID');
           console.log(queryResponse3.toString());
           console.log('\n  ClientAccountID query complete.');
           console.log('-----------------------------------------------------------------------------------------\n\n');
   
      
   
           // 1 asset history
           console.log('1. Query Commercial Paper History....');
           console.log('-----------------------------------------------------------------------------------------\n');
           let queryResponse = await contract.evaluateTransaction('queryHistory', 'MagnetoCorp', '00001');
   
           let json = JSON.parse(queryResponse.toString());
           console.log(json);
           console.log('\n\n');
           console.log('\n  History query complete.');
           console.log('-----------------------------------------------------------------------------------------\n\n');
   
           // 2 ownership query
           console.log('2. Query Commercial Paper Ownership.... Papers owned by MagnetoCorp');
           console.log('-----------------------------------------------------------------------------------------\n');
           let queryResponse2 = await contract.evaluateTransaction('queryOwner', 'MagnetoCorp');
           json = JSON.parse(queryResponse2.toString());
           console.log(json);
   
           console.log('\n\n');
           console.log('\n  Paper Ownership query complete.');
           console.log('-----------------------------------------------------------------------------------------\n\n');
   
           // 3 partial key query
           console.log('3. Query Commercial Paper Partial Key.... Papers in org.papernet.papers namespace and prefixed MagnetoCorp');
           console.log('-----------------------------------------------------------------------------------------\n');
           let queryResponse3 = await contract.evaluateTransaction('queryPartial', 'MagnetoCorp');
   
           json = JSON.parse(queryResponse3.toString());
           console.log(json);
           console.log('\n\n');
   
           console.log('\n  Partial Key query complete.');
           console.log('-----------------------------------------------------------------------------------------\n\n');
   
   
           // 4 Named query - all redeemed papers
           console.log('4. Named Query: ... All papers in org.papernet.papers that are in current state of redeemed');
           console.log('-----------------------------------------------------------------------------------------\n');
           let queryResponse4 = await contract.evaluateTransaction('queryNamed', 'redeemed');
   
           json = JSON.parse(queryResponse4.toString());
           console.log(json);
           console.log('\n\n');
   
           console.log('\n  Named query "redeemed" complete.');
           console.log('-----------------------------------------------------------------------------------------\n\n');
   
   
           // 5 named query - by value
           console.log('5. Named Query:.... All papers in org.papernet.papers with faceValue > 4000000');
           console.log('-----------------------------------------------------------------------------------------\n');
           let queryResponse5 = await contract.evaluateTransaction('queryNamed', 'value');
   
           json = JSON.parse(queryResponse5.toString());
           console.log(json);
           console.log('\n\n');
   
           console.log('\n  Named query by "value" complete.');
           console.log('-----------------------------------------------------------------------------------------\n\n');
   
           */
    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}
