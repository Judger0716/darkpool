'use strict';

//global variable
var transfer_list = [];

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

// Shamir Secret Sharing
const sss = require('shamirs-secret-sharing')
// RSA
const jsrsasign = require('jsrsasign');

/* Route List */

// Default route
app.get('/', function (req, res) {
    res.render(__dirname + "/" + "public/login.html", { msg: '请输入用户名登录' });
})

// login
app.get('/login', function (req, res) {
    res.render(__dirname + "/" + "public/login.html", { msg: '请输入用户名登录' });
})

app.post('/login', async function (req, res) {
    var login_status = await LoginUser.LoginUser(req.body.username)
    var response = {
        "status": login_status,
    }
    console.log(login_status)
    if (login_status == 'LOG_SUC') {
        res.render(__dirname + "/" + "public/main.html", { username: req.body.username });
    }
    else if (login_status == 'LOG_ERR') {
        res.render(__dirname + "/" + "public/login.html", { msg: '登陆失败' });
    }
})

// register
app.get('/register', function (req, res) {
    res.render(__dirname + "/" + "public/register.html", { msg: '请输入注册的用户名' });
})

app.post('/register', async function (req, res) {
    var reg_status = await RegisterUser.RegUser(req.body.username);
    var response = {
        "status": reg_status,
    }
    console.log(reg_status)
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
    var username = req.body.username;
    var type = req.body.type;
    var amount = req.body.amount;
    var price = req.body.price;
    var item = req.body.item;
    var json_shares = {};
    // Get committees' PubKey
    var PubKeys = await QueryCommittee.queryCommittee(username);
    // console.log('PubKey:',PubKeys);
    var n = PubKeys['committee'].length;
    if (n === 0 || item === 'Tether') {
        console.log('WRONG');
        res.json({
            'status': false,
        });
        return;
    }
    else {
        var t = 3;
        // Shamir Secret Sharing
        const secret = Buffer.from(price.toString());
        //console.log(secret)
        const shares = sss.split(secret, { shares: n, threshold: t })
        for (var i = 0; i < n; i++) {
            var share_i = shares[i].toJSON()['data'].toString();
            var blocknum = Math.ceil(share_i.length / 32);
            // Encrypt with committees' public keys
            var start = PubKeys['committee'][i]['name'].search('CN=') + 3;
            var end = PubKeys['committee'][i]['name'].search('C=') - 3;
            var cmt_name = PubKeys['committee'][i]['name'].substring(start, end);
            var pub_i = PubKeys['committee'][i]['pub'];
            var enc_i = {};
            for (var j = 0; j < blocknum - 1; j++) {
                enc_i[j] = jsrsasign.KJUR.crypto.Cipher.encrypt(share_i.substring(j * 32, (j + 1) * 32), jsrsasign.KEYUTIL.getKey(pub_i));
                jsrsasign.hextob64(enc_i[j]);
            }
            enc_i[blocknum - 1] = jsrsasign.KJUR.crypto.Cipher.encrypt(share_i.substring((blocknum - 1) * 32, share_i.length), jsrsasign.KEYUTIL.getKey(pub_i));
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
    await QueryDealedOrder.queryDealedOrder(req.body.username).then(result =>{
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

    //var host = server.address().address
    var port = server.address().port
    console.log("Web Application Address: http://localhost:%s", port)
})
