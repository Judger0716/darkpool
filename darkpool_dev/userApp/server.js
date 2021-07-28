'use strict';

//global variable
var transfer_list = [];
var block_list = [];

// Requirements
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');

// Express Framework
const express = require('express');
var app = express();
const bodyParser = require('body-parser');

// Load HTML resources
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.engine('.html', require('ejs').renderFile);

// Load other nodejs files
const RegisterUser = require('./RegisterUser');
const LoginUser = require('./LoginUser');
const QueryToken = require('./queryToken');
const Transfer = require('./transfer');
const QueryOrder = require('./queryOrder');
const CreateOrder = require('./createOrder');
const QueryCommittee = require('./queryCommittee');
const ElectCommittee = require('./electCommittee');
const FormCommittee = require('./formCommittee');
const QueryDealedOrder = require('./queryDealedOrders');
const Report = require('./report');
// import { kLineDataList as GOLD_SLIVER } from '@/public/kline/kline_gold_sliver'
// import { kLineDataList as GOLD_CARBON } from '@/public/kline/kline_gold_carbon'
// const GOLD_SLIVER = require('./public/kline/kline_gold_sliver');
// const GOLD_CARBON = require('./public/kline/kline_gold_carbon');

// Shamir Secret Sharing
const sss = require('shamirs-secret-sharing')
// RSA
const jsrsasign = require('jsrsasign');

let klineData = new Map();

/* Route List */

// Default route
app.get('/', function (req, res) {
    res.render(__dirname + "/" + "public/index.html");
})

// Update TokenPriceList
app.post('/update_priceList', function (req, res) {
    var tokenList = ['Gold', 'Sliver', 'Iron', 'Oil', 'Carbon', 'Moutai'];
    var priceList = req.body.priceList;
    for (var index = 0; index < tokenList.length; index++) {
        var random_price = Math.random() * 10000;
        priceList[tokenList[index]].price = random_price.toFixed(2);
        var gap = priceList[tokenList[index]].price - priceList[tokenList[index]].oldprice;
        if (gap >= 0) priceList[tokenList[index]].isup = true;
        else priceList[tokenList[index]].isup = false;
        priceList[tokenList[index]].rate = (Math.abs(gap) / priceList[tokenList[index]].oldprice).toFixed(2);
    }
    res.json({
        'priceList': priceList,
    })
})

// 初始化k线图
app.post('/init_kline', function (req, res) {
    let ret_klineList = Array.from(klineData.values());
    // ret_klineList.sort(function (a, b) { return a.timestamp - b.timestamp; });
    let ret_klineList_rev = [...ret_klineList];
    ret_klineList_rev.reverse();

    res.json({
        'init_klineList': ret_klineList,
        'init_klineList_rev': ret_klineList_rev,
    });
    /*
    if (req.body.GOLD_SLIVER) {
        var ret_klineList = [];
        var ret_klineList_rev = [];
        var init_klineList = GOLD_SLIVER.init_kline_chart;
        for (var index = 0; index < init_klineList.length; index++) {
            var cur_k = {};
            cur_k['timestamp'] = new Date(init_klineList[index][0]).getTime();
            cur_k['timestr'] = new Date(init_klineList[index][0]).toLocaleString();
            cur_k['open'] = +init_klineList[index][1];
            cur_k['high'] = +init_klineList[index][2];
            cur_k['low'] = +init_klineList[index][3];
            cur_k['close'] = +init_klineList[index][4];
            cur_k['volume'] = Math.ceil(+init_klineList[index][5]);
            ret_klineList.push(cur_k);
            ret_klineList_rev.unshift(cur_k);
        }
        res.json({
            'init_klineList': ret_klineList,
            'init_klineList_rev': ret_klineList_rev,
        })
    }
    else if (req.body.GOLD_CARBON) {
        var ret_klineList = [];
        var ret_klineList_rev = [];
        var init_klineList = GOLD_CARBON.init_kline_chart;
        for (var index = 0; index < init_klineList.length; index++) {
            var cur_k = {};
            cur_k['timestamp'] = new Date(init_klineList[index][0]).getTime();
            cur_k['timestr'] = new Date(init_klineList[index][0]).toLocaleString();
            cur_k['open'] = +init_klineList[index][1];
            cur_k['high'] = +init_klineList[index][2];
            cur_k['low'] = +init_klineList[index][3];
            cur_k['close'] = +init_klineList[index][4];
            cur_k['volume'] = Math.ceil(+init_klineList[index][5]);
            ret_klineList.push(cur_k);
            ret_klineList_rev.unshift(cur_k);
        }
        res.json({
            'init_klineList': ret_klineList,
            'init_klineList_rev': ret_klineList_rev,
        })
    }*/
})

// 更新k线图
app.post('/query_new_value', function (req, res) {
    let old_value = req.body.old_value;
    if (!old_value) {
        res.json({
            'new_value': null
        })
    } else {
        let timeStamp = old_value.timestamp;
        for (let v of klineData.values()) {
            if (v.timestamp > timeStamp) {
                res.json({
                    'new_value': v
                })
            }
        }
    }

    /*
        var flag1 = (Math.random() - 0.5) >= 0;
        if (flag1) var open = old_value.open + Math.random() * 10;
        else var open = old_value.open - Math.random() * 10;
    
        var flag2 = (Math.random() - 0.5) >= 0;
        if (flag2) var close = open + Math.random() * 10;
        else var close = open - Math.random() * 10;
    
        var high = Math.max(open, close) + Math.random() * 5;
        var low = Math.min(open, close) - Math.random() * 5;
    
        res.json({
            'new_value': {
                timestamp: new Date().getTime(),
                timestr: new Date().toLocaleString(),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: Math.ceil(Math.random() * 10),
            }
        })
    */
})

// Query Block
app.post('/query_block', function (req, res) {
    res.json({
        'block_list': block_list.sort(function (a, b) { return b.blockNumber - a.blockNumber }),
    })
})

// login
app.get('/login', function (req, res) {
    res.render(__dirname + "/" + "public/login.html");
})

app.post('/login', async function (req, res) {
    console.log(req.body.username)
    var login_status = await LoginUser.LoginUser(req.body.username)
    if (login_status == 'LOG_SUC') {
        res.render(__dirname + "/" + "public/main.html", { username: req.body.username });
    }
    else if (login_status == 'LOG_ERR') {
        res.render(__dirname + "/" + "public/login.html");
    }
})

// register
app.get('/register', function (req, res) {
    res.render(__dirname + "/" + "public/register.html", { msg: '' });
})

app.post('/register', async function (req, res) {
    var reg_status = await RegisterUser.RegUser(req.body.username);
    // Register successfully
    if (reg_status == 'REG_SUC') {
        res.render(__dirname + "/" + "public/login.html", { msg: '注册成功' });
    }
    // Already registered
    else if (reg_status == 'REG_ARD') {
        res.render(__dirname + "/" + "public/register.html", { msg: '已经注册过此用户，可直接登录' });
    }
    // Register failed
    else res.render(__dirname + "/" + "public/register.html", { msg: '注册失败' });
})

// Query Account Info
app.post('/getinfo', async function (req, res) {
    console.log('req:', req.body.username);
    await QueryToken.QueryBalance(req.body.username).then(result => {
        console.log('Queryapp program complete.');
        res.json({
            'userinfo': result,
        });
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

// Form Committee
app.post('/formcommittee', async function (req, res) {
    await FormCommittee.FormCommittee().then(result => {
        res.json({
            'status': result,
        })
    })
})

// Query Transfer Info
app.get('/transfer', async function (req, res) {
    res.json({
        'transfer_list': transfer_list
    });
})

// Transfer to Others
app.post('/transfer', async function (req, res) {
    await Transfer.transfer(req.body.from, req.body.to, req.body.item, req.body.amount).then(ret => {
        res.json({ 'status': ret });
    })
})

// Create Order
app.post('/createorder', async function (req, res) {
    let username = req.body.username;
    let type = req.body.type;
    let amount = req.body.amount;
    let price = req.body.price;
    let item = req.body.item;
    let json_shares = {};
    // Get committees' PubKey
    let PubKeys = await QueryCommittee.queryCommittee(username);
    // console.log('PubKey:',PubKeys);
    let n = PubKeys['committee'].length;
    if (n === 0 || item === 'Tether') {
        res.json({
            'status': 'NoCommittee',
        });
        return;
    }
    else {
        let t = 3;
        // Shamir Secret Sharing
        console.log(price);
        let secret = Buffer.from(price.toString());
        //console.log(secret)
        let shares = sss.split(secret, { shares: n, threshold: t })
        for (let i = 0; i < n; i++) {
            let share_i = shares[i].toJSON()['data'].toString();
            let blocknum = Math.ceil(share_i.length / 32);
            // Encrypt with committees' public keys
            // let start = PubKeys['committee'][i]['name'].search('CN=') + 3;
            // let end = PubKeys['committee'][i]['name'].search('C=') - 3;
            let cmt_name = PubKeys['committee'][i]['name']
            let pub_i = PubKeys['committee'][i]['pub'];
            let enc_i = {};
            for (let j = 0; j < blocknum - 1; j++) {
                enc_i[j] = jsrsasign.KJUR.crypto.Cipher.encrypt(share_i.substring(j * 32, (j + 1) * 32), jsrsasign.KEYUTIL.getKey(pub_i));
                // jsrsasign.hextob64(enc_i[j]);
            }
            enc_i[blocknum - 1] = jsrsasign.KJUR.crypto.Cipher.encrypt(share_i.substring((blocknum - 1) * 32, share_i.length), jsrsasign.KEYUTIL.getKey(pub_i));
            // jsrsasign.hextob64(enc_i[blocknum - 1]);
            json_shares[cmt_name] = enc_i;
        }
    }

    await CreateOrder.createOrder(username, type, amount, item, JSON.stringify(json_shares)).then(ret => {
        res.json({
            'status': ret,
        })
    })
})

// Query Order Info
app.post('/getorder', async function (req, res) {
    await QueryOrder.queryOrder(req.body.username).then(result => {
        console.log('Queryapp program complete.');
        res.json(result);
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

// Query Dealed Order Info
app.post('/getdealedorder', async function (req, res) {
    await QueryDealedOrder.queryDealedOrder(req.body.username).then(result => {
        res.json(result);
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

// Query Committee
app.post('/queryCommittee', async function (req, res) {
    await QueryCommittee.queryCommittee(req.body.username).then(ret => {
        res.json({
            'candidates': ret.candidates,
            'committee': ret.committee,
        })
    })
})

// Elect Committee
app.post('/electCommittee', async function (req, res) {
    await ElectCommittee.electCommittee(req.body.username, req.body.amount).then(ret => {
        res.json({
            'status': ret,
        })
    })
})

// Report
app.post('/report', async function (req, res) {
    await Report.report(req.body.report_form.username, req.body.report_form.type, req.body.report_form.order_id, req.body.report_form.price, req.body.report_form.deal_order_id).then(ret => {
        console.log(ret);
        res.json({
            'status': true,
        })
    })
})


async function orderEventHandler(event) {
    let eventJson = JSON.parse(event.payload.toString());

    if (event.eventName === "OrderDeal") { // To be modified...
        // console.log(eventJson);
        let timeStamp = parseInt(eventJson.time['seconds']);

        if (klineData.get(timeStamp / 60)) {
            let data = klineData.get(timeStamp / 60);
            data.close = eventJson.price;
            data.high = Math.max(eventJson.price, data.high);
            data.low = Math.min(eventJson.price, data.low);
            data.volume += eventJson.amount;

        } else {
            let date = new Date();
            date.setTime(timeStamp * 1000);

            let data = {
                timestamp: timeStamp * 1000,
                timestr: date.toLocaleString(),
                open: eventJson.price,
                volume: eventJson.amount
            }
            if (Math.random() > 0.6) {
                data.close = Math.ceil(eventJson.price + 5 * Math.random());
            } else {
                data.close = Math.ceil(eventJson.price - 5 * Math.random());
            }
            data.high = Math.ceil(Math.max(data.open, data.close) + 2 * Math.random());
            data.low = Math.ceil(Math.min(data.open, data.close) - 2 * Math.random());


            klineData.set(timeStamp / 60, data);
        }
    }
}

// SERVER LISTENING
var server = app.listen(9000, async function () {

    // Get history transfer record and listen on new transfer
    const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/wallet');
    const gateway = new Gateway();
    // Specify userName for network access
    const userName = 'admin';
    let connectionProfile = yaml.safeLoad(fs.readFileSync('../organization/darkpool/gateway/connection-org2.yaml', 'utf8'));
    let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
    };
    console.log('Connect to Fabric gateway.');
    await gateway.connect(connectionProfile, connectionOptions);
    console.log('Use network channel: mychannel.');
    const network = await gateway.getNetwork('mychannel');
    const tokenContract = await network.getContract('tokenContract', 'Token');
    await tokenContract.addContractListener((event) => {
        // convert into JSON
        var evt = JSON.parse(event.payload);
        // console.log(evt);
        /*
        // Event Name
        var event_name = event.eventName;
        evt['event_name'] = event_name;
        */
        // From, neglect mint
        if (evt['from'] != '0x0') {
            var fromuser_start = evt['from'].search('CN=') + 3;
            var fromuser_end = evt['from'].search('C=') - 3;
            evt['from'] = evt['from'].substring(fromuser_start, fromuser_end);
        }
        // To
        var touser_start = evt['to'].search('CN=') + 3;
        var touser_end = evt['to'].search('C=') - 3;
        evt['to'] = evt['to'].substring(touser_start, touser_end);
        // Value
        transfer_list.push(evt);  // Add to global variable
    }, { startBlock: 0 });  // From genesis block

    const orderContract = network.getContract('orderContract', 'Order');
    await orderContract.addContractListener(orderEventHandler, { startBlock: 0 });

    const listener = async (event) => {
        // Handle block event
        //console.log(event.blockData.metadata);
        var cur_block = {};
        cur_block['blockNumber'] = parseInt(event.blockNumber);
        cur_block['header'] = {};
        cur_block['header']['number'] = parseInt(event.blockData.header.number);
        cur_block['header']['previous_hash'] = event.blockData.header.previous_hash.toString('hex');
        cur_block['header']['data_hash'] = event.blockData.header.data_hash.toString('hex');
        cur_block['data'] = {};
        cur_block['data']['signature'] = event.blockData.data.data[0].signature.toString('hex');
        cur_block['data']['payload'] = event.blockData.data.data[0].payload;
        cur_block['data']['payload']['header']['channel_header']['extension'] = event.blockData.data.data[0].payload.header.channel_header.extension.toString('hex');
        //cur_block['data']['payload']['header']['signature_header']['creator']['id_bytes'] = event.blockData.data.data[0].payload['header']['signature_header']['creator']['id_bytes'].toString('hex');
        cur_block['data']['payload']['header']['signature_header']['nonce'] = event.blockData.data.data[0].payload['header']['signature_header']['nonce'].toString('hex');
        cur_block['data']['payload']['data'] = event.blockData.data.data[0].payload.data;
        // Listener may remove itself if desired
        //if (event.blockNumber.equals(endBlock)) {
        //    network.removeBlockListener(listener);
        //}
        //console.log(cur_block['data']['payload']['data']['actions'][0]['payload']['action']['proposal_response_payload']['extension'])
        if (cur_block['data']['payload']['data']['actions'] != undefined) {
            cur_block['endorser'] = [];
            for (var i = 0; i < cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'].length; i++) {
                cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['signature'] = cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['signature'].toString('hex');
                cur_block['endorser'].push({
                    'mspid': cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['endorser']['mspid'],
                    'signature': cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['signature'],
                })
            }
        }
        block_list.push(cur_block);
    }
    const options = {
        startBlock: 0
    };
    await network.addBlockListener(listener, options);

    //var host = server.address().address
    var port = server.address().port
    console.log("Web Application Address: http://localhost:%s", port)
})
