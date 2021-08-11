'use strict'

const jsrsasign = require('jsrsasign');
const sss = require('shamirs-secret-sharing')
const CreateOrder = require('./createOrder');
const QueryCommittee = require('./queryCommittee');

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
  let item;

  if (Math.random() > 0.5) {
    item = 'Bitcoin';
  } else {
    item = 'Bitcoin';
  }

  let json_shares = {};
  // Get committees' PubKey
  let PubKeys = await QueryCommittee.queryCommittee(username);
  // console.log('PubKey:',PubKeys);
  let n = PubKeys['committee'].length;
  if (n === 0 || item === 'Tether') {
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
        jsrsasign.hextob64(enc_i[j]);
      }
      enc_i[blocknum - 1] = jsrsasign.KJUR.crypto.Cipher.encrypt(share_i.substring((blocknum - 1) * 32, share_i.length), jsrsasign.KEYUTIL.getKey(pub_i));
      jsrsasign.hextob64(enc_i[blocknum - 1]);
      json_shares[cmt_name] = enc_i;
    }
  }

  await CreateOrder.createOrder(username, type, amount, item, JSON.stringify(json_shares));
}

async function main() {
  for (let i = 0; i < 20; i++) {
    await createOrder();
  }
  setTimeout(main, 1000);
}

main();