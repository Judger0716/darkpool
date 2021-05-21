'use strict';

exports.LoginUser = async function(username) {
    // Requirements
    const { Wallets } = require('fabric-network');
    const FabricCAServices = require('fabric-ca-client');
    const fs = require('fs');
    const path = require('path');

    try {
        // load the network configuration
        const ccpPath = path.resolve('../organization/darkpool/gateway/connection-org2.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
        const ca = new FabricCAServices(caURL);
    
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
    
        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
          console.log('An identity for the user "' + username + '" already exists in the wallet');
          return 'LOG_SUC';
        }
        else return 'LOG_ERR';
    
    } catch (error) {
        console.error(`Failed to login user "${username}": ${error}`);
        process.exit(1);
    }
}
