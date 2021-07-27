'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');

function transfer_item(item) {
    switch (item) {
        case 'Bitcoin':
            return 'Gold';
        case 'Dogecoin':
            return 'Silver';
        default:
            return 'Moutai';
    }
}

function transfer_order(json_order) {
    let user_start = json_order['creator'].search('CN=') + 3;
    let user_end = json_order['creator'].search('C=') - 3;
    json_order['creator'] = json_order['creator'].substring(user_start, user_end);

    json_order['order_id'] = parseInt(json_order['order_id']);

    let date = new Date();
    date.setTime(parseInt(json_order['create_time']['seconds']) * 1000);
    json_order['create_time'] = date.toLocaleString();
    if (json_order['deal_time']) {
        date.setTime(parseInt(json_order['deal_time']['seconds']) * 1000);
        json_order['deal_time'] = date.toLocaleString();
    }
    json_order['item'] = transfer_item(json_order['item']);
    // deal_time = date.toUTCString();
    json_order['deal'] = json_order['deal'].toString();
    json_order['share_info_visible'] = false;
    json_order['report_visible'] = false;

    return json_order;
}

// Main program function
exports.queryOrder = async function (username) {

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

        // Query DealOrder
        let queryResponse = await contract.evaluateTransaction('GetDealOrder');
        var DealOrder = JSON.parse(queryResponse)
        console.log('\n  GetDealOrder query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        // Query MatchOrder
        queryResponse = await contract.evaluateTransaction('GetMatchingOrder');
        var MatchOrder = JSON.parse(queryResponse)
        console.log('\n  GetMatchingOrder query complete.');
        console.log('-----------------------------------------------------------------------------------------\n\n');

        // Query DealOrders
        queryResponse = await contract.evaluateTransaction('GetDealedOrders');
        var DealedOrderList = JSON.parse(queryResponse);
        console.log(DealedOrderList)

        var OrderList = [];

        for (let record of DealOrder) {
            let order = record['Record'];
            OrderList.push(transfer_order(order));
        }

        for (let record of MatchOrder) {
            let order = record['Record'];
            OrderList.push(transfer_order(order));
        }

        OrderList.sort(function (a, b) { return parseInt(a.order_id) - parseInt(b.order_id); });

        /*
        // Extract Userful Infomation from raw JSON data
        var index = 0;

        while (DealOrder[index] != undefined) {
            var user_start = DealOrder[index]['Record']['creator'].search('CN=') + 3;
            var user_end = DealOrder[index]['Record']['creator'].search('C=') - 3;
            DealOrder[index]['Record']['creator'] = DealOrder[index]['Record']['creator'].substring(user_start, user_end);
            var date = new Date();
            date.setTime(parseInt(DealOrder[index]['Record']['create_time']['seconds']) * 1000);
            DealOrder[index]['Record']['create_time'] = date.toLocaleString();
            date.setTime(parseInt(DealOrder[index]['Record']['deal_time']['seconds']) * 1000);
            DealOrder[index]['Record']['deal_time'] = date.toLocaleString();
            DealOrder[index]['Record']['deal'] = DealOrder[index]['Record']['deal'].toString();
            DealOrder[index]['Record']['share_info_visible'] = false;
            DealOrder[index]['Record']['report_visible'] = false;
            OrderList.push(DealOrder[index]['Record']);
            index += 1
        }
        index = 0;
        while (MatchOrder[index] != undefined) {
            var user_start = MatchOrder[index]['Record']['creator'].search('CN=') + 3;
            var user_end = MatchOrder[index]['Record']['creator'].search('C=') - 3;
            MatchOrder[index]['Record']['creator'] = MatchOrder[index]['Record']['creator'].substring(user_start, user_end);
            var date = new Date();
            date.setTime(parseInt(MatchOrder[index]['Record']['create_time']['seconds']) * 1000);
            MatchOrder[index]['Record']['create_time'] = date.toLocaleString();
            MatchOrder[index]['Record']['share_info_visible'] = false;
            MatchOrder[index]['Record']['report_visible'] = false;
            OrderList.push(MatchOrder[index]['Record']);
            index += 1
        }
        */
        return {
            'OrderList': OrderList,
        }

    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}