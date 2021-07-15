'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');

var argv = process.argv.splice(2);

const username = argv[0];
const tokenname = argv[1];
const amount = argv[2];

// Main program function
async function main() {

    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/wallet');


    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Specify userName for network access
        const userName = username;

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../organization/token/gateway/connection-org1.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: "admin",
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

        const contract = await network.getContract('tokenContract', tokenname);

        // queries - commercial paper
        console.log('-----------------------------------------------------------------------------------------');
        console.log('****** Submitting Token queries ****** \n\n ');


        let queryResponse = await contract.submitTransaction('SetOption', 'TokenName', 'TokenSymbol', '6');
        console.log(queryResponse.toString());
        console.log('\n  SetOption query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');


        queryResponse = await contract.evaluateTransaction('Symbol');
        console.log(queryResponse.toString());
        console.log('\n  Symbol query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        queryResponse = await contract.evaluateTransaction('ClientAccountID');
        console.log(queryResponse.toString());
        console.log('\n  ClientAccountID query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        let ID = queryResponse.toString();

        queryResponse = await contract.evaluateTransaction('BalanceOf', ID);
        console.log(queryResponse.toString());
        console.log('\n  BalanceOf query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        queryResponse = await contract.submitTransaction('Mint', amount.toString());
        console.log(queryResponse.toString());
        console.log('\n  Mint query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        queryResponse = await contract.evaluateTransaction('BalanceOf', ID);
        console.log(queryResponse.toString());
        console.log('\n  BalanceOf query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        queryResponse = await contract.submitTransaction('Transfer', 'x509::/OU=client/OU=org2/OU=department1/CN=' + userName + '::/C=US/ST=North Carolina/O=Hyperledger/OU=Fabric/CN=fabric-ca-server', amount.toString());
        console.log(queryResponse.toString());
        console.log('\n  Mint query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}
main().then(() => {

    console.log('Queryapp program complete.');

}).catch((e) => {

    console.log('Queryapp program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});
