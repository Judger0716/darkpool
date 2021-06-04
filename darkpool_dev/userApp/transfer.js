'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');

// Main program function
exports.transfer = async function (from, to, amount) {

    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/wallet');

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Specify userName for network access
        const userName = from;

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

        let queryResponse = await contract.submitTransaction('Transfer', 'x509::/OU=org2/OU=client/OU=department1/CN=' + to + '::/C=US/ST=North Carolina/O=Hyperledger/OU=Fabric/CN=fabric-ca-server', amount.toString());
        console.log(queryResponse.toString());
        console.log('\n  Transfer complete.');
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
