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
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())
app.engine('.html', require('ejs').renderFile);

// Load other nodejs files
const registerUser = require('./RegisterUser');
const loginUser = require('./LoginUser');
const QueryToken = require('./queryToken');
const QueryOrder = require('./queryOrder');
const createOrder = require('./createOrder');

// Shamir Secret Sharing
const sss = require('shamirs-secret-sharing')
 
/* Route List */

// Default route
app.get('/', function (req, res) {
    res.render( __dirname + "/" + "public/login.html",{msg: '请输入用户名登录'});
})

// login
app.get('/login', function (req, res) {
    res.render( __dirname + "/" + "public/login.html",{msg: '请输入用户名登录'});
})

app.post('/login', async function(req, res){
    var login_status = await loginUser.LoginUser(req.body.username)
    var response = {
        "status": login_status,
    }
    console.log(login_status)
    if(login_status=='LOG_SUC'){
        res.render(__dirname + "/" + "public/main.html",{username: req.body.username});
    }
    else if(login_status=='LOG_ERR'){
        res.render( __dirname + "/" + "public/login.html",{msg: '登陆失败'});
    }
})

// register
app.get('/register', function (req, res) {
    res.render( __dirname + "/" + "public/register.html",{msg: '请输入注册的用户名'});
})

app.post('/register', async function (req, res) {
    var reg_status = await registerUser.RegUser(req.body.username);
    var response = {
        "status": reg_status,
    }
    console.log(reg_status)
    // Register successfully
    if(reg_status == 'REG_SUC'){
        res.render( __dirname + "/" + "public/login.html",{msg: '注册成功'});
    }
    // Already registered
    else if(reg_status == 'REG_ARD'){
        res.render( __dirname + "/" + "public/register.html",{msg: '已经注册过此用户，可直接登录'});
    }
    // Register failed
    else res.render( __dirname + "/" + "public/register.html",{msg: '注册失败'});
})

// Query Account Info
app.post('/getinfo', async function (req, res){
    await QueryToken.QueryBalance(req.body.username).then(result => {
        console.log('Queryapp program complete.');
        res.json({
            'symbol': result.symbol,
            'balance': result.balance
        });
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

// Query Transfer Info
app.post('/gettransfer', async function (req ,res){
    res.json({
        'transfer_list': transfer_list
    });
})

// Create Order
app.post('/createorder', async function (req, res){
    var username = req.body.username;
    var type = req.body.type;
    var amount = req.body.amount;
    var price = req.body.price;
    var item = req.body.item;
    // Shamir Secret Sharing
    const secret = Buffer.from(toString(price))
    const shares = sss.split(secret, { shares: 5, threshold: 3 })
    var buf_len = shares.length
    var json_shares = {}
    for(var i=0;i<buf_len;i++){
        var share_i;
        share_i = shares[i].toJSON()['data'];
        json_shares[i]=share_i;
    }
    await createOrder.createOrder(username, type, amount, price, item, JSON.stringify(json_shares)).then(ret =>{
        res.json({
            'order_info': 'SUC',
        })
    })
})

// Query Order Info
app.post('/getorder', async function (req, res){
    await QueryOrder.queryOrder().then(result =>{
        console.log('Queryapp program complete.');
        res.json(result);
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
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
    const tokenContract = await network.getContract('tokenContract', 'Token');
    await tokenContract.addContractListener((event)=>{
        // convert into JSON
        var evt = JSON.parse(event.payload);
        /*
        // Event Name
        var event_name = event.eventName;
        evt['event_name'] = event_name;
        */
        // From, neglect mint
        if(evt['from']!='0x0'){
            var fromuser_start = evt['from'].search('CN=')+3;
            var fromuser_end = evt['from'].search('C=')-3;
            evt['from'] = evt['from'].substring(fromuser_start,fromuser_end);
        }
        // To
        var touser_start = evt['to'].search('CN=')+3;
        var touser_end = evt['to'].search('C=')-3;
        evt['to'] = evt['to'].substring(touser_start,touser_end);
        // Value
        transfer_list.push(evt);  // Add to global variable
    }, {startBlock : 0});  // From genesis block

    //var host = server.address().address
    var port = server.address().port
    console.log("Web Application Address: http://localhost:%s", port)
})
