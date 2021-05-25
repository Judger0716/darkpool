'use strict';

//global variable
var transfer_list = [];

// Requirements
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');

// Express Framework
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// Load HTML resources
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())
app.engine('.html', require('ejs').renderFile);

// Load other nodejs files
var registerUser = require('./RegisterUser');
var loginUser = require('./LoginUser');
var QueryToken = require('./queryToken');
 
/* Route List */

// Default route
app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "public/login.html" );
})

// login
app.get('/login', function (req, res) {
    res.sendFile( __dirname + "/" + "public/login.html" );
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
        res.send('LOGIN ERROR');
    }
})

// register
app.get('/register', function (req, res) {
    res.sendFile( __dirname + "/" + "public/register.html" );
})

app.post('/register', async function (req, res) {
    var reg_status = await registerUser.RegUser(req.body.username);
    var response = {
        "status": reg_status,
    }
    console.log(reg_status)
    // Register successfully
    if(reg_status == 'REG_SUC'){
        res.end(JSON.stringify(response))
    }
    // Already registered
    else if(reg_status == 'REG_ARD'){
        res.send('Already Enrolled')
    }
    // Register failed
    else res.send('FAILED!')
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

<<<<<<< HEAD
=======
// Query Transfer Info
app.post('/gettransfer', async function (req ,res){
    res.json({
        'transfer_list': transfer_list
    });
})


>>>>>>> d72e9867f9616207039c61b05645deeb0432227d
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
