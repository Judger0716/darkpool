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

function transfer_shares(shares) {
    let newShares = [];
    for (let name of Object.keys(shares)) {
        // let segments = [];
        let share = shares[name];
        for (let segment of Object.keys(share)) {
            newShares.push({
                name: name,
                seq: segment,
                data: share[segment]
            });
        }
    }
    return newShares;
}

function transfer_order(json_order) {
    let user_start = json_order['creator'].search('CN=') + 3;
    let user_end = json_order['creator'].search('C=') - 3;
    json_order['creator'] = json_order['creator'].substring(user_start, user_end);

    json_order['order_id'] = parseInt(json_order['order_id']);
    json_order['deal_order_id'] = parseInt(json_order['deal_order_id']);

    let date = new Date();
    date.setTime(parseInt(json_order['create_time']['seconds']) * 1000);
    json_order['create_time'] = date.toLocaleString();
    date.setTime(parseInt(json_order['deal_time']['seconds']) * 1000);
    json_order['deal_time'] = date.toLocaleString();
    json_order['item'] = transfer_item(json_order['item']);
    json_order['deal'] = json_order['deal'].toString();
    json_order['shares'] = transfer_shares(json_order['shares']);
    json_order['share_info_visible'] = false;

    return json_order;
}

// Main program function
exports.queryDealedOrder = async function (username) {

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

        // Query DealOrders
        let queryResponse = await contract.evaluateTransaction('GetDealedOrders');
        let queryResult = JSON.parse(queryResponse);

        let DealedOrderList = [];
        // Extract Userful Infomation from raw JSON data
        // var index = 0;
        // console.log('------------- Result ---------------', queryResult);
        for (let result of queryResult) {
            let record = result['Record'];
            let deal_id = parseInt(record['deal_id']);
            let related_comm = [];

            for (let c of record['context']['content']) {
                related_comm.push(c.name);
            }
            let deal_price = record['context']['content'][0]['matchResult']['price']

            let buy_orders = [], sell_orders = [];
            for (let order of record['buy']) {
                buy_orders.push(transfer_order(order));
            }
            for (let order of record['sell']) {
                sell_orders.push(transfer_order(order));
            }

            if (buy_orders.length === 0 || sell_orders.length === 0) {
                continue;
            }

            let deal_time = buy_orders[0]['deal_time'];
            let buyer = buy_orders[0]['creator'];
            let seller = sell_orders[0]['creator'];

            let buy_order = buy_orders;
            let sell_order = sell_orders;
            DealedOrderList.push({
                'deal_id': deal_id,
                'buyer': buyer,
                'seller': seller,
                'related_comm': related_comm,
                'deal_price': deal_price,
                'deal_time': deal_time,
                'buy_order': buy_order,
                'sell_order': sell_order,
                'report_visible': false,
                'report_result': [],
            });
        }
        /*
                while (queryResult[index] != undefined) {
                    var deal_id = queryResult[index]['Record']['deal_id'];
                    var related_comm = [];
                    for (var i = 0; i < queryResult[index]['Record']['context']['content'].length; i++) {
                        related_comm.push(queryResult[index]['Record']['context']['content'][i]['name']);
                    }
                    var deal_price = queryResult[index]['Record']['context']['price'];
                    var deal_time;
                    for (var i = 0; i < 2; i++) {
                        var user_start = queryResult[index]['Record']['order'][i]['creator'].search('CN=') + 3;
                        var user_end = queryResult[index]['Record']['order'][i]['creator'].search('C=') - 3;
                        queryResult[index]['Record']['order'][i]['creator'] = queryResult[index]['Record']['order'][i]['creator'].substring(user_start, user_end);
                        var date = new Date();
                        date.setTime(parseInt(queryResult[index]['Record']['order'][i]['create_time']['seconds']) * 1000);
                        queryResult[index]['Record']['order'][i]['create_time'] = date.toUTCString();
                        date.setTime(parseInt(queryResult[index]['Record']['order'][i]['deal_time']['seconds']) * 1000);
                        queryResult[index]['Record']['order'][i]['deal_time'] = date.toUTCString();
                        deal_time = date.toUTCString();
                        queryResult[index]['Record']['order'][i]['deal'] = queryResult[index]['Record']['order'][i]['deal'].toString();
                        queryResult[index]['Record']['order'][i]['share_info_visible'] = false;
                    }
                    var buyer = queryResult[index]['Record']['order'][0]['creator'];
                    var seller = queryResult[index]['Record']['order'][1]['creator'];
                    var buy_order = queryResult[index]['Record']['order'][0];
                    var sell_order = queryResult[index]['Record']['order'][1];
                    DealedOrderList.push({
                        'deal_id': deal_id,
                        'buyer': buyer,
                        'seller': seller,
                        'related_comm': related_comm,
                        'deal_price': deal_price,
                        'deal_time': deal_time,
                        'buy_order': buy_order,
                        'sell_order': sell_order,
                        'report_visible': false,
                    });
                    index += 1
                }
        */
        // console.log(DealedOrderList);
        DealedOrderList.sort(function (a, b) { return parseInt(a.deal_id) - parseInt(b.deal_id); });
        return {
            'DealedOrderList': DealedOrderList,
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