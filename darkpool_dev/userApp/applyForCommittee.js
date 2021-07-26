'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');
const { json } = require('body-parser');

let argv = process.argv.slice(2);
let username = argv[0];
let amount = argv[1];

if(argv.length < 2) {
  console.log('Too few arguments....');
  process.exit(1);
}

// console.log(username);

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
    console.log('Use Committee smart contract.');

    const contract = await network.getContract('committeeContract', 'Committee');

    console.log('-----------------------------------------------------------------------------------------');
    console.log('****** Submitting Committee queries ****** \n\n ');

    let queryResponse = await contract.submitTransaction('Apply', amount);
    console.log(queryResponse.toString());
    console.log('\n  apply query complete.');
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

main();
