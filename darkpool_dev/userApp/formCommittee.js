'use strict';

// Main program function
exports.FormCommittee = async function () {

    // Bring key classes into scope, most importantly Fabric SDK network class
    const fs = require('fs');
    const yaml = require('js-yaml');
    const { Wallets, Gateway } = require('fabric-network');
    const { exit } = require('process');

    const username = "admin"

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

        await gateway.connect(connectionProfile, connectionOptions);
        const network = await gateway.getNetwork('mychannel');
        const contract = await network.getContract('committeeContract', 'Committee');

        let queryResponse = await contract.submitTransaction('FormCommittee');

        return JSON.parse(queryResponse.toString());
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

