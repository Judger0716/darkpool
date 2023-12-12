'use strict';

exports.RegUser = async function(username) {
    // Empty Username -> Invalid
    if(JSON.stringify(username)=='{}' || username==undefined){
        return 'NUL';
    }
    
    // Requirements
    const { Wallets } = require('fabric-network');
    const FabricCAServices = require('fabric-ca-client');
    const fs = require('fs');
    const path = require('path');
    const jsrsasign = require('jsrsasign');

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
        // console.log(`Wallet path: ${walletPath}`);
    
        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
          console.log('An identity for the user "' + username + '" already exists in the wallet');
          return 'REG_ARD';
        }
    
        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
          console.log('An identity for the admin user "admin" does not exist in the wallet');
          console.log('Run the enrollAdmin.js application before retrying');
          return;
        }
    
        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // 生产密钥对
        var date1 = new Date().getTime()
        var rsaKeypair = jsrsasign.KEYUTIL.generateKeypair("RSA", 512);
    //     console.log(new Date().getTime() - date1) //314
        // 密钥对象获取pem格式的密钥
        var pub = jsrsasign.KEYUTIL.getPEM(rsaKeypair.pubKeyObj);
        var prv = jsrsasign.KEYUTIL.getPEM(rsaKeypair.prvKeyObj, 'PKCS8PRV');
      //   console.log("pub:",pub)
    //     console.log("prv:",prv)
        // 保存私钥至本地
        const prvKeyPath = path.resolve(walletPath + '/' + username + '.prvKey')
        fs.writeFileSync(prvKeyPath,prv)
    
        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
          affiliation: 'org2.department1',
          enrollmentID: username,
          role: 'client',
          attrs: [{
            name: "pubKey",
            value: pub,
            ecert: true
          }]
        }, adminUser);
        const enrollment = await ca.enroll({
          enrollmentID: username,
          enrollmentSecret: secret
        });
        const x509Identity = {
          credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
          },
          mspId: 'Org2MSP',
          type: 'X.509',
        };
        await wallet.put(username, x509Identity);
        // console.log('Successfully registered and enrolled admin user "' + username + '" and imported it into the wallet');
        return pub;
    
    } catch (error) {
        console.error(`Failed to register user "${username}": ${error}`);
        process.exit(1);
    }
}