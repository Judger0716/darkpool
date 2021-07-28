'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');
const tokenlist = ['Bitcoin', 'Dogecoin', 'Tether'];

// Main program function
async function report(username, type, order_id, price, deal_order_id) {

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
    console.log('Use Order smart contract.');

    const contract = await network.getContract('orderContract', 'Order');

    // queries - commercial paper
    console.log('-----------------------------------------------------------------------------------------');
    console.log('****** Submitting Order queries ****** \n\n ');


    let report_result = []
    let queryResponse = await contract.evaluateTransaction('Report', deal_order_id);
    let dealed_order_event = JSON.parse(Buffer.from(JSON.parse(queryResponse.toString())).toString());
    // console.log('Order_id: ', order_id, dealed_order_event);

    price = parseInt(price);

    for (let match_result of dealed_order_event.context.content) {
      // report_result.push()
      let result = {
        name: match_result.name,
        success: false
      }
      // console.log(typeof order_id)
      // console.log(match_result.matchResult.context[type]);
      if (match_result.matchResult.context[type].includes(order_id)) {
        //console.log(price, dealed_order_event.context.price);
        if ((type === 'sell' && price <= dealed_order_event.context.price) || (type === 'buy' && price >= dealed_order_event.context.price)) {
          let dealed_order_ids = Array.from(match_result.matchResult.deal_orders[type], (x) => x.id);
          //console.log(order_id, dealed_order_ids);
          if (!(dealed_order_ids.includes(order_id))) {
            result.success = true;
          }
        }
      }

      report_result.push(result);
    }
    console.log(report_result)
    return report_result;

  } catch (error) {

    console.log(`Error processing transaction. ${error}`);
    console.log(error.stack);
    return [];

  } finally {

    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.');
    gateway.disconnect();

  }
}
let res = report('will', 'sell', '467', '1', '74');
console.log(res);