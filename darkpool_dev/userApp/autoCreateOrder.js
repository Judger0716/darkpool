'use strict'

const jsrsasign = require('jsrsasign');
const sss = require('shamirs-secret-sharing')
const CreateOrder = require('./createOrder');
const QueryCommittee = require('./queryCommittee');
const exec = require('child_process').exec;

async function createOrder() {
  let type;
  if (Math.random() > 0.5) {
    type = 'sell';
  } else {
    type = 'buy';
  }
  let usernames = ["Steve", "Morgan", "Orville", "Tara", "Luna"]
  let username = usernames[JSON.stringify(Math.ceil(Math.random() * 4))];
  // = req.body.type;
  let amount = Math.round(Math.random() * 10000);
  let price = Math.round(Math.random() * 50);

  let tokenlist = ['Bitcoin','Dogecoin','Ethereum','Cardano','Litecoin','Cosmos','Decred'];
  let item = tokenlist[Math.ceil(Math.random() * 6)];
  
  let json_shares = {};
  // Get committees' PubKey
  let PubKeys = await QueryCommittee.queryCommittee(username);
  let n = PubKeys['committee'].length;
  if (n === 0 || item === 'Tether') {
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
      console.log('username: ', username, 'amount: ',amount, 'shares: ', json_shares)
      await CreateOrder.createOrder(username, type, amount, item, JSON.stringify(json_shares))
    });
  }
}

async function main() {
  await createOrder();
  setTimeout(main, 5000);
}

main();