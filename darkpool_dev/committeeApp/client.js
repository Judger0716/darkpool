/* eslint-disable no-console */
'use strict'

// const getPeer = require('libp2p/src/get-peer');
const Libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const Mplex = require('libp2p-mplex');
const { NOISE } = require('libp2p-noise');
const MulticastDNS = require('libp2p-mdns');
const sss = require('shamirs-secret-sharing');
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway, TxEventHandlerFactory } = require('fabric-network');
const jsrsasign = require('jsrsasign');
const pipe = require('it-pipe');
const lp = require('it-length-prefixed')
const path = require('path');
const match = require('./match')

const PREPARING = 0, MATCHING = 1, WAITING = 2;
const ec = new jsrsasign.KJUR.crypto.ECDSA({ 'curve': 'secp256r1' });

var node1;
var prvKey, cert;
var network, gateway;
var prvKeyForDecryption;
var masterName;
var username = process.argv[2];
var committeeContract, tokenContract, orderContract;

var committeeMembers = new Map();
var combiningOrders = new Map();
let lastSet = new Set(), peerList = new Map();
var stop = false;
let lastPrice = new Map(
  [['Bitcoin', 0],
  ['Dogecoin', 0]]
);

let currentState = PREPARING, currentVersion = undefined;


/*
 * Store decrypted orders
 * 
 * id: order_id (bind with matching orders).
 * type: type (order type).
 * price: price (price for matching).
 * amount: amount (amount for matching).
 * time: create_time.seconds (timestamp).
 */
var matchingPool = new Map(
  [['Bitcoin', new Map([['buy', new Map()], ['sell', new Map()]])],
  ['Dogecoin', new Map([['buy', new Map()], ['sell', new Map()]])]]
);

let resultPool = new Map(
  [['Bitcoin', new Map()],
  ['Dogecoin', new Map()]]
);

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function eqSet(as, bs) {
  if (as.size !== bs.size) return false;
  for (var a of as) if (!bs.has(a)) return false;
  return true;
}

async function createNode() {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      peerDiscovery: [MulticastDNS]
    },
    config: {
      peerDiscovery: {
        [MulticastDNS.tag]: {
          interval: 20e3,
          enabled: true
        }
      }
    }
  });

  return node;
}

async function initConnection() {
  // A wallet stores a collection of identities for use
  const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/../userApp/wallet');

  // A gateway defines the peers used to access Fabric networks
  gateway = new Gateway();

  var userName = "admin";

  // Specify userName for network access
  if (username)
    userName = username;

  const prvKeyPath = path.resolve('../userApp/wallet/' + userName + '.prvKey');
  prvKeyForDecryption = fs.readFileSync(prvKeyPath, 'utf-8').toString();

  const identity = await wallet.get(userName);

  // let x = new jsrsasign.X509();
  // x.readCertPEM(identity.credentials.certificate);
  // pubKey = x.getPublicKey();
  cert = identity.credentials.certificate;
  prvKey = jsrsasign.KEYUTIL.getKey(identity.credentials.privateKey);
  // console.log(prvKey);
  // console.log(pubKey);

  // var sigValue = ec.signHex("sadsadasdasdasdada", prvKey.prvKeyHex);
  // var res = ec.verifyHex("sadsadasdasdasdada", sigValue, prvKey.pubKeyHex)
  // console.log(res);

  // privateKey = identity.credentials.privateKey;


  // Load connection profile; will be used to locate a gateway
  let connectionProfile = yaml.safeLoad(fs.readFileSync('../organization/token/gateway/connection-org1.yaml', 'utf8'));

  // Set connection options; identity and wallet
  let connectionOptions = {
    identity: userName,
    wallet: wallet,
    discovery: { enabled: true, asLocalhost: true }
  };

  // Connect to gateway using application specified parameters
  // console.log('Connect to Fabric gateway.');

  await gateway.connect(connectionProfile, connectionOptions);

  // Access PaperNet network
  // console.log('Use network channel: mychannel.');

  network = await gateway.getNetwork('mychannel');

  tokenContract = network.getContract('tokenContract', 'Token');
  orderContract = network.getContract('orderContract', 'Order');
  committeeContract = network.getContract('committeeContract', 'Committee');

  await committeeContract.addContractListener(committeeEventHandler, { startBlock: 0 });
  /*
    await tokenContract.addContractListener((event) => {
      console.log(event.eventName);
      const eventJson = JSON.parse(event.payload.toString());
      console.log(eventJson.from);
      console.log(eventJson.to);
      console.log(eventJson.value);
    }, { startBlock: 0 });
  */
  await orderContract.addContractListener(orderEventHandler, { startBlock: 0 });

  await fetchCommittee();
  await fetchOrders();

  if (username === masterName) {
    heartbeats();
  }
}

async function nodeMonitor() {
  let newSet = new Set([...peerList.keys()]);
  if (!eqSet(lastSet, newSet)) {
    console.log(`PeerList changed: ${JSON.stringify([...peerList.keys()])}`);
    lastSet = newSet;
  }
  setTimeout(nodeMonitor, 1000);
}

async function heartbeats() {
  // currentState = MATCHING;
  let response = await orderContract.evaluateTransaction('GetOrderID', 'DealOrderID');
  let version = JSON.parse(response.toString());
  // response = await orderContract.evaluateTransaction('GetDealOrderPrice');
  // let price = JSON.parse(response.toString());
  if (currentVersion === undefined || currentVersion < version) {
    currentVersion = version;
    if (currentState !== WAITING) {
      currentState = MATCHING;
    }
  }
  // lastPrice = price;

  for (let [peerString, peerId] of peerList) {
    nodeSendAndClose(peerId, JSON.stringify({ type: 'heartbeats', content: { version: currentVersion } }));
  }

  setTimeout(heartbeats, 500);
}

async function combineOrders() {
  if (committeeMembers.size > 0) {
    // let orders = Object.values(combiningOrders);
    for (let [order_id, order_body] of combiningOrders) {

      // Already decrypted.
      if (order_body.price) continue;

      let recover_shares = [];
      for (let [username, share] of Object.entries(order_body.shares)) {
        // console.log(typeof shares[j], shares[j]);
        if (share instanceof Buffer) {
          recover_shares.push(share);
        }
      }
      // console.log(recover_shares.length);
      if (recover_shares.length >= 3) {
        order_body.price = sss.combine(recover_shares.slice(0, 3)).toString();
        console.log(`Order ${order_id} has been decrypted, decrypted price: ${order_body.price}`);

        // Add the decrypted order to the matching pool.
        let itemPool = matchingPool.get(order_body.item);

        itemPool.get(order_body.type).set(order_body.order_id, {
          id: order_body.order_id,
          type: order_body.type,
          price: parseInt(order_body.price),
          amount: parseInt(order_body.amount),
          deal_amount: parseInt(order_body.deal_amount),
          // time: order_body.create_time.seconds
        });
      }
    }
  }
  setTimeout(combineOrders, 1000);
}

async function formMatchResult(buyOrders, sellOrders, matchResult) {
  let price = matchResult.price;
  let amount = matchResult.amount;

  let context = {
    buy: Array.from(buyOrders, x => x.id),
    sell: Array.from(sellOrders, x => x.id)
  }

  let deal_buy_orders = [], deal_sell_orders = [];
  let buy_amount = amount, sell_amount = amount;

  for (let order of buyOrders) {
    if (order.price >= price && buy_amount > 0) {
      let remaining_amount = order.amount - order.deal_amount;
      if (remaining_amount <= buy_amount) {
        order.deal_amount = order.amount;
        buy_amount -= remaining_amount;
      } else {
        order.deal_amount += buy_amount;
        buy_amount = 0;
      }
      deal_buy_orders.push(order);
    }
  }

  for (let order of sellOrders) {
    if (order.price <= price && sell_amount > 0) {
      let remaining_amount = order.amount - order.deal_amount;
      if (remaining_amount <= sell_amount) {
        order.deal_amount = order.amount;
        sell_amount -= remaining_amount;
      } else {
        order.deal_amount += sell_amount;
        sell_amount = 0;
      }
      deal_sell_orders.push(order);
    }
  }

  let item_result = {
    result: JSON.stringify(matchResult.price) + ":" + JSON.stringify(matchResult.amount),
    price: matchResult.price,
    amount: matchResult.amount,
    deal_orders: {
      buy: deal_buy_orders,
      sell: deal_sell_orders
    },
    context: context
  }

  return item_result;
}

async function matchOrders() {
  let matchSuccess = false;
  let msg = {
    type: "matchResult",
    content: {
      name: username
    }
  }
  // console.log(matchingPool);
  if (currentState === MATCHING) {
    for (let [item, pool] of matchingPool) {
      let buyOrders = Array.from(pool.get('buy').values());
      let sellOrders = Array.from(pool.get('sell').values());
      // console.log(buyOrders, sellOrders);

      if (buyOrders.length > 0 && sellOrders.length > 0) {
        let matchResult = match(buyOrders, sellOrders, lastPrice.get(item));
        if (matchResult.price === 0 || matchResult.amount === 0) {
          continue;
        } else {
          matchSuccess = true;
        }
        let itemResult = await formMatchResult(buyOrders, sellOrders, matchResult);
        msg.content[item] = itemResult;
        // Wait for result.
        // stop = true;
      }
    }
  }

  if (matchSuccess) {
    currentState = WAITING;

    if (masterName && masterName === username) {
      for (let [item, pool] of resultPool) {
        if (msg.content[item]) {
          let str_result = msg.content[item].result;
          if (pool.get(str_result)) {
            pool.get(str_result).num += 1;
            pool.get(str_result).content.push({ name: username, matchResult: msg.content[item] });
          } else {
            pool.set(str_result, {
              num: 1,
              content: [{ name: username, matchResult: msg.content[item] }]
            });
          }
        }
      }
    } else {
      /*
       * Broadcast my result.
       */
      console.log('Sending result...', JSON.stringify(msg));
      for (let [peerString, peerId] of peerList) {
        nodeSendAndClose(peerId, JSON.stringify(msg));
      }
    }

    if (masterName && masterName === username) {
      await countOrders();
    }
  }
  setTimeout(matchOrders, 10000);
}

async function countOrders() {
  console.log('Master counting....');
  console.log(JSON.stringify(resultPool));
  for (let [item, pool] of resultPool) {
    let count = 0;

    for (let [result, body] of pool) {
      count += body.num;
    }

    let sorted_result = Array.from(pool.values()).sort(function (a, b) { return parseInt(b.num) - parseInt(a.num); });
    let result_body = sorted_result[0];
    // Result got, send to Fabric
    if (count >= 3) {
      console.log("Final Result: ", JSON.stringify(result_body));
      // console.log("Sending match result: ", result_body.result.split(":")[0], result_body.result.split(":")[1], result_body.price);
      await orderContract.submitTransaction('OrderDeal', JSON.stringify(result_body));
      return;
    }
  }
  setTimeout(countOrders, 500);
}

async function committeeEventHandler(event) {

}

async function orderEventHandler(event) {
  let eventJson = JSON.parse(event.payload.toString());
  // If new order arrived.
  if (event.eventName === "NewOrder") {
    if (!combiningOrders.get(eventJson.order_id)) {
      // Only decrypt and add undeal orders
      if (eventJson.deal === false) {
        eventJson.price = null;
        try {
          let share =  eventJson.shares[username];
          eventJson.shares[username] = decryptShare(share);
        } catch (e) {
          console.log(e, eventJson.shares[username]);
        }

        // console.log("Decrypt my share: ", eventJson.shares[username]);
        /*
         * Share with peers.
         */
        for (let [peerString, peerId] of peerList) {
          nodeSendAndClose(peerId, JSON.stringify({
            type: 'shares', content: [{ order_id: eventJson.order_id, name: username, share: eventJson.shares[username] }]
          }));
        }
        combiningOrders.set(eventJson.order_id, eventJson);
      }
      // [eventJson.order_id] = eventJson;
    }
  } else if (event.eventName === "OrderDeal") { // To be modified...
    // console.log(eventJson, combiningOrders);
    for (let o of eventJson.buy) {
      let id = o.order_id;
      if (!o.deal) {
        combiningOrders.set(id, o);
        matchingPool.get(o.item).get('buy').get(id).deal_amount = o.deal_amount;
      } else {
        combiningOrders.delete(id);
        matchingPool.get(o.item).get('buy').delete(id);
        /*
        for (let [item, pool] of matchingPool) {
          if (pool.get('buy').get(id))
            pool.get('buy').delete(id);
        }*/
      }
    }

    for (let o of eventJson.sell) {
      let id = o.order_id;
      if (!o.deal) {
        combiningOrders.set(id, o);
        matchingPool.get(o.item).get('sell').get(id).deal_amount = o.deal_amount;
      } else {
        combiningOrders.delete(id);
        matchingPool.get(o.item).get('sell').delete(id);
        /*
        for (let [item, pool] of matchingPool) {
          if (pool.get('sell').get(id))
            pool.get('sell').delete(id);
        }*/
      }
    }
    // let buy_id = eventJson.order[0].order_id;
    // let sell_id = eventJson.order[1].order_id;
    // matchingPool.get("buy").delete(buy_id);
    // matchingPool.get("sell").delete(sell_id);
    // combiningOrders.delete(buy_id);
    // combiningOrders.delete(sell_id);
    // console.log(combiningOrders);

    if (currentState === WAITING) {
      // Restart matching...
      for (let [item, pool] of resultPool) {
        pool.clear();
      }
      currentState = MATCHING;
      console.log("OrderDeal: ", eventJson);
    } else {
      // console.log(matchingPool);
    }
  }
}

async function nodeEventHandler(stream) {
  // Got a stream, firstly handshake, and then keep it.
  let message;
  // Receive first message.
  await pipe(stream, async function (source) {
    let msg = await source.next();
    message = JSON.parse(msg.value.toString());
  });

  // console.log('Message Received: ', message);

  switch (message.type) {
    case 'heartbeats':
      let version = message.content.version;
      // console.log('Heartbeats got, version: ', version, ' currentVersion: ', currentVersion);
      if (currentVersion === undefined || version > currentVersion) {
        currentVersion = version;
        currentState = MATCHING;
      }
      break;
    case 'handshake':
      let signture = ec.signHex(message.content, prvKey.prvKeyHex);
      await pipe([JSON.stringify({ name: username, cert: cert, encrypted: signture })], stream);
      break;
    case 'shares':
      for (let order of message.content) {
        if (combiningOrders.get(order.order_id)) {
          combiningOrders.get(order.order_id).shares[order.name] = Buffer.from(order.share);
          // console.log(`Receive share from ${order.name} for order ${order.order_id}, content: `, Buffer.from(order.share));
        }
      }
      break;
    case 'quit':
      peerList.delete(message.content.id);
      console.log(`Peer ${message.content.id} quit...`);
      await pipe([JSON.stringify({ msg: "Quit acknowledged." })], stream);
      break;
    case 'matchResult':
      // If I'm master, I'll collect others matching result.
      if (masterName && masterName === username) {
        for (let [item, pool] of resultPool) {
          if (message.content[item]) {
            let str_result = message.content[item].result;
            if (pool.get(str_result)) {
              pool.get(str_result).num += 1;
              pool.get(str_result).content.push({ name: message.content.name, matchResult: message.content[item] });
            } else {
              pool.set(str_result, {
                num: 1,
                content: [{ name: message.content.name, matchResult: message.content[item] }]
              });
            }
          }
        }
        /*
        if (resultPool.get(message.content.result)) {
          resultPool.get(message.content.result).num += 1;
          resultPool.get(message.content.result).content.push({ name: message.content.name, context: message.content.context });
        } else {
          resultPool.set(message.content.result, {
            num: 1,
            price: message.content.price,
            result: message.content.result,
            content: [{ name: message.content.name, context: message.content.context }]
          });
        }*/
      }
      break;

  }
}

function pemToPubkeyHex(pemCert) {
  let x509 = new jsrsasign.X509();
  x509.readCertPEM(pemCert);
  let pubKey = x509.getPublicKey();
  return pubKey.pubKeyHex;
}

function adjustUsername(username) {
  let touser_start = username.search('CN=') + 3;
  let touser_end = username.search('C=') - 3;
  // console.log(username.substring(touser_start, touser_end));
  return username.substring(touser_start, touser_end);
}

async function nodeSendAndClose(peerId, msg) {
  // var message;
  let { stream } = await node1.dialProtocol(peerId, '/a-protocol');

  await pipe([msg], stream);
}

async function nodeSendAndReceive(peerId, msg) {
  var message;
  let { stream } = await node1.dialProtocol(peerId, '/a-protocol');

  await pipe([msg], stream);

  await pipe(stream, async function (source) {
    let msg = await source.next();
    message = JSON.parse(msg.value.toString());
  });

  return message;
}

async function nodeSendGoodBye() {
  for (let [peerString, peerId] of peerList) {
    console.log(`Say Goodbye to ${peerString}...`);
    try {
      await nodeSendAndReceive(peerId, JSON.stringify({ type: "quit", content: { id: node1.peerId.toB58String() } }));
    }
    catch (error) {
      console.log(`Fail to say Goodbye to ${peerId}, ${error}.`);
    }
  }
}

/*
 * Handshake with newly discovered peers.
 */
async function nodeHandshake(peerId) {
  let identity;
  let randomString = getRandomInt(1000000000000).toString();
  // Send noance and receive cert and encrypted noance.
  identity = await nodeSendAndReceive(peerId, JSON.stringify({ type: 'handshake', content: randomString }));

  // console.log("Stream status: ", stream);
  if (committeeMembers.get(identity.name) && committeeMembers.get(identity.name).cert === identity.cert) {
    let result = ec.verifyHex(randomString, identity.encrypted, await pemToPubkeyHex(identity.cert));

    let peerIdString = peerId.toB58String();
    // Add him to the list.
    if (result) {
      if (!peerList.has(peerIdString)) {
        peerList.set(peerIdString, peerId);
        console.log(`Peer ${peerId.toB58String()} verified.`);
        // console.log(`Now send my shares to ${peerId.toB58String()}.`);

        nodeSendAndClose(peerId, JSON.stringify({
          type: 'shares', content: Array.from(combiningOrders.values(),
            x => { return { order_id: x.order_id, name: username, share: x.shares[username] }; })
        }));
        /*
        await pipe([JSON.stringify({
          type: 'shares', content: Array.from(Object.values(combiningOrders),
            x => { return { order_id: x.order_id, name: username, share: x.shares[username] }; })
        })], stream);
        */
      }
    }
    else console.log(`Peer ${peerId.toB58String()} invaid.`);
  }
}

function decryptShare(shares) {
  let len = Object.keys(shares).length;
  let strres = Array.from([...Array(len).keys()],
    x => jsrsasign.KJUR.crypto.Cipher.decrypt(shares[x], jsrsasign.KEYUTIL.getKey(prvKeyForDecryption))).join("");
  return Buffer.from(strres.split(','));
}

async function fetchCommittee() {
  // committeeMembers
  const response = await committeeContract.evaluateTransaction('GetCandidates');
  let members = JSON.parse(response.toString());
  for (let i = 0; i < members.length; i++) {
    members[i].name = adjustUsername(members[i].name);
    committeeMembers.set(members[i].name, members[i]);
  }
  if (members.length > 0) {
    masterName = members[0].name;
  } else {
    masterName = null;
  }
}

async function fetchOrders() {
  // combiningOrders
  let response = await orderContract.evaluateTransaction('GetMatchingOrder');
  let orders = Array.from(JSON.parse(response.toString()), x => x.Record);
  // console.log(orders);
  for (let order of orders) {
    let shares = order.shares[username];
    // console.log(order);
    order.shares[username] = decryptShare(shares);
    order.price = null;
    // console.log("Decrypt my share: ", order.shares[username]);
    /*
     * Send the share to other after handshake, not now.
     */
    combiningOrders.set(order.order_id, order);
  }
}

async function main() {
  await initConnection();
  node1 = await createNode();

  if (!committeeMembers.get(username)) {
    console.log("I'm not a member of committee...");
    process.exit(0);
  };

  // Add node monitor.
  nodeMonitor();
  combineOrders();
  matchOrders();

  node1.on('peer:discovery', nodeHandshake);

  node1.handle('/a-protocol', ({ stream }) => {
    nodeEventHandler(stream);
  });

  node1.start();

  process.on('SIGINT', async function (code) {
    await nodeSendGoodBye();

    gateway.disconnect();
    process.exit();
  });
}

main();
