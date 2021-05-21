'use strict';

// Express Framework
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// Load HTML resources
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
<<<<<<< HEAD
app.use(bodyParser.json())
app.engine('.html', require('ejs').renderFile);

// Load other nodejs files
var registerUser = require('./RegisterUser');
var loginUser = require('./LoginUser');
var QueryToken = require('./queryToken');
=======

// Load other nodejs files
var registerUser = require('./RegisterUser')
var loginUser = require('./LoginUser')
>>>>>>> 259cf59027edffad0b20f338ed75820788a02973
 
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
<<<<<<< HEAD
        res.render(__dirname + "/" + "public/main.html",{username: req.body.username});
=======
        res.send('LOGIN SUCCESSFULLY');
>>>>>>> 259cf59027edffad0b20f338ed75820788a02973
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
<<<<<<< HEAD
    var reg_status = await registerUser.RegUser(req.body.username);
=======
    var reg_status = await registerUser.RegUser(req.body.username)
>>>>>>> 259cf59027edffad0b20f338ed75820788a02973
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

<<<<<<< HEAD
// Query Account Info
app.post('/getinfo', async function (req, res){
    await QueryToken.QueryBalance(req.body.username).then(balance => {
        console.log('Queryapp program complete.');
        res.json({
            'balance': balance
        });
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

=======
>>>>>>> 259cf59027edffad0b20f338ed75820788a02973
// SERVER LISTENING
var server = app.listen(9000, function () {
    //var host = server.address().address
    var port = server.address().port
    console.log("Web Application Address: http://localhost:%s", port)
})
