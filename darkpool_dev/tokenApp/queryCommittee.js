/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to query the ledger
 * 5. Evaluate transactions (queries)
 * 6. Process responses
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');
const jsrsasign = require('jsrsasign');

const username = "g"

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

        const contract = await network.getContract('committeeContract', 'Committee');

        // queries - commercial paper
        console.log('-----------------------------------------------------------------------------------------');
        console.log('****** Submitting Committee queries ****** \n\n ');

        /*
                let queryResponse = await contract.submitTransaction('SetOption', 'Dogecoin', 'DOGE', '6');
                console.log(queryResponse.toString());
                console.log('\n  SetOption query complete.');
                console.log('-----------------------------------------------------------------------------------------\n\n');
        */

        let queryResponse = await contract.evaluateTransaction('GetCandidates');
        console.log(queryResponse.toString());
        console.log('\n  GetCandidates query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        queryResponse = await contract.evaluateTransaction('GetCreator');
        //jsrsasign.
        console.log(queryResponse.toString());
        let x = new jsrsasign.X509();
        x.readCertPEM(queryResponse.toString());
        console.log(x.getPublicKey().pubKeyHex);
        console.log('\n  GetCreator query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        /*
        queryResponse = await contract.submitTransaction('Apply', '50');
        console.log(queryResponse.toString());
        console.log('\n  Apply query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        queryResponse = await contract.evaluateTransaction('GetCandidates');
        console.log(queryResponse.toString());
        console.log('\n  GetCandidates query complete.');
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
main().then(() => {

    console.log('Queryapp program complete.');

}).catch((e) => {

    console.log('Queryapp program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});
