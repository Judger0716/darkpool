'use strict';

//global variable
var transfer_list = [];
var block_list = [];

// Requirements
const pty = require('node-pty');
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');
var exec = require('child_process').exec;

// Express Framework
const init_klineList = require('./origin_data');
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
// 
const spawn = require('child_process').spawn;
// 首次创建订单，启动订单机器人
let firstOrder = true;
// 首次形成委员会，启动委员会客户端
let firstFormCommittee = true;
// 委员会输出
const committeeOutputs = [[], [], []];

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
    let ret_klineList = init_klineList.init_kline_chart.concat(Array.from(klineData.values()));// Array.from(klineData.values());
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
        });
        return;
    } else {
        let timeStamp = old_value.timestamp;
        for (let v of klineData.values()) {
            if (v.timestamp > timeStamp) {
                res.json({
                    'new_value': v
                });
                return;
            }
        }
        res.json({
            'new_value': null
        })
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
    // let begin = req.body.begin;
    // let end = Math.max(begin + 100, block_list.length);
    let num = req.body.num;
    if (num === 'all') {
        num = block_list.length;
    }

    num = block_list.length;

    res.json({
        'block_list': block_list.slice(0, num)// block_list.sort(function (a, b) { return b.blockNumber - a.blockNumber }),
    });
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
    if (firstFormCommittee) {
        let names = ["Steve", "Morgan", "Orville", "Tara", "Luna"]
        for (let i = 0; i < 3; i++) {
            let child = pty.spawn('bash', ['-c', `cd /root/darkpool/darkpool_dev/committeeApp && node client.js ${names[i]}`], {
                name: 'xterm-color',
                cols: 120,
                rows: 30,
                cwd: process.env.HOME,
                env: process.env
            });

            /*
            let child = spawn('bash', ['-c', `cd /root/darkpool/darkpool_dev/committeeApp && node client.js ${names[i]}`]);
            */
            console.log(`Client ${i} created!`);
            // 记录终端输出
            child.on('data', function (data) {
                // console.log(`data for ${i}: ${data}`);
                committeeOutputs[i].push(data.toString());
            });
        }
        firstFormCommittee = false;
    }
})

// Query Transfer Info
app.get('/transfer', async function (req, res) {
    res.json({
        'transfer_list': transfer_list
    });
})

// Query Committee output
app.post('/committeeoutput', async function (req, res) {
    // current data version
    // console.log(req.body.current);
    let current = req.body.current;
    let newData = [];
    for (let [i, data] of committeeOutputs.entries()) {
        // console.log('data:', data, 'i:', i)
        newData.push(data.slice(current[i]));
    }
    res.json({
        'status': true,
        'newData': newData
    });
});


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
        // console.log('order price:',price);
        // use Python script sss.py for generating shares
        exec('python3 /root/darkpool/Simple_SSS/sss.py ' + price + ' '+ t + ' '+ n, async function (error, stdout, stderr) {
            if(error){
                console.error('error: ' + error);
                return;
            }
            // convert it to json
            var shares = JSON.parse(stdout);
            console.log(shares);
            // for each committee, encrypt their shares
            for (let i = 0; i < n; i++) {
                let cmt_name = PubKeys['committee'][i]['name'];
                let pub_i = PubKeys['committee'][i]['pub'];
                let enc_i = [];
                // each share has two value, encrypt them both
                for (let j = 0; j < 2; j++) {
                    enc_i[j] = jsrsasign.KJUR.crypto.Cipher.encrypt(shares[i][j].toString(), jsrsasign.KEYUTIL.getKey(pub_i));
                }
                json_shares[cmt_name] = enc_i;
            }
            // console.log(json_shares)
            let ret;
            while (!(ret = await CreateOrder.createOrder(username, type, amount, item, JSON.stringify(json_shares)))) {
                console.log('Retrying............');
            }
            res.json({
                'status': ret,
            })
        });
    }
    /*
    // cd /root/darkpool/darkpool_dev/userApp && nohup node autoCreateOrder.js &
    if (firstOrder) {
        spawn('bash', ['-c', 'cd /root/darkpool/darkpool_dev/userApp && nohup node autoCreateOrder.js &']);
        firstOrder = false;
    }*/
    /*
    .then(ret => {

    })
     */
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
        // console.log(ret);
        res.json({
            'status': true,
            'result': ret
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
var server = app.listen(80, async function () {

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
        // let type = event.blockData.data.data[0].payload.header.channel_header.typeString;
        //if(JSON.stringify(event).indexOf('action') !== -1) {
        //    console.log(JSON.stringify());
        //    process.exit(1);
        //}
        // console.log(`Block number: ${event.blockNumber}.`);

        //if (event.blockData.data.data.length > 1) {
        //    console.log(event.blockData.data.data[1].payload.data.actions[0].payload.action.proposal_response_payload.extension.events);
        // console.log(event.blockData.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.events);
        //}
        // console.log(event)


        var cur_block = {};
        cur_block['events'] = [];
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

        for (let data of event.blockData.data.data) {
            if (data.payload.data.actions) {
                for (let action of data.payload.data.actions) {
                    let _event = action.payload.action.proposal_response_payload.extension.events;
                    if (_event.event_name !== "") {
                        let payload = JSON.parse(_event.payload.toString());
                        if (_event.event_name === 'NewOrder') {
                            payload.item = payload.item === 'Bitcoin' ? 'Gold' : 'Carbon';
                        }
                        cur_block['events'].push({
                            name: _event.event_name,
                            payload: JSON.stringify(payload, null, 4)
                        });
                    }
                    // let payload = 
                    // console.log(action.payload.action.proposal_response_payload.extension.events.payload.toString());
                }
            }
        }
        cur_block.display_more = false;
        cur_block.show_events = false;

        if (cur_block['events'].length > 1) {
            // console.log(cur_block['events']);
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
