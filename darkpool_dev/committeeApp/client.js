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

var ec = new jsrsasign.KJUR.crypto.ECDSA({ 'curve': 'secp256r1' });

var node1;
var prvKey, cert;
var network, gateway;
var prvKeyForDecryption;
var username = process.argv[2];
var committeeContract, tokenContract, orderContract;

var committeeMembers = new Map();
var matchingOrders = new Map();
var lastSet = new Set();
var peerList = new Map();

/*
 * Store decrypted orders
 * 
 * id: order_id (bind with matching orders).
 * type: type (order type).
 * price: price (price for matching).
 * amount: amount (amunt for matching).
 * time: create_time.seconds (timestamp).
 */
var matchingPool = new Map();
matchingPool.set('buy', []);
matchingPool.set('sell', []);


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
}

async function nodeMonitor() {
  // console.log('Updating...');
  let newSet = new Set([...peerList.keys()]);
  if (!eqSet(lastSet, newSet)) {
    console.log(`PeerList changed: ${JSON.stringify([...peerList.keys()])}`);
    lastSet = newSet;
  }
  setTimeout(nodeMonitor, 1000);
}

async function combineOrders() {
  if (committeeMembers.size > 0) {
    // let orders = Object.values(matchingOrders);
    for (let [order_id, order_body] of matchingOrders) {

      // Already decrypted.
      if (order_body.price) continue;

      let recover_shares = [];
      for (let [username, share] of Object.entries(order_body.shares)) {
        // console.log(typeof shares[j], shares[j]);
        if (share instanceof Buffer) {
          recover_shares.push(share);
        }
      }
      if (recover_shares.length >= 3) {
        order_body.price = sss.combine(recover_shares.slice(0, 3)).toString();
        console.log(`Order ${order_id} has been decrypted, decrypted price: ${order_body.price}`);

        // Add the decrypted order to the matching pool.
        matchingPool.get(order_body.type).push({
          id: order_body.order_id,
          type: order_body.type,
          price: parseInt(order_body.price),
          amount: parseInt(order_body.amount),
          time: order_body.create_time.seconds
        });
        console.log(matchingPool.get(order_body.type));
      }
    }
  }
  setTimeout(combineOrders, 5000);
}

async function matchOrders() {
  let buyOrders = matchingPool.get("buy");
  let sellOrders = matchingPool.get("sell");

  if (buyOrders.length > 0 &&  sellOrders.length > 0) {
    console.log("buyOrders: ", buyOrders);
    console.log("sellOrders: ", sellOrders);
  }
  setTimeout(matchOrders, 1000);
}

async function committeeEventHandler(event) {

}

async function orderEventHandler(event) {
  let eventJson = JSON.parse(event.payload.toString());
  // If new order arrived.
  if (event.eventName === "NewOrder") {
    if (!matchingOrders.get(eventJson.order_id)) {
      eventJson.shares[username] = decryptShare(eventJson);
      /*
       * Share with peers.
       */
      for (let [peerString, peerId] of peerList) {
        nodeSendAndClose(peerId, JSON.stringify({
          type: 'shares', content: [{ order_id: eventJson.order_id, name: username, share: eventJson.shares[username] }]
        }));
      }
      matchingOrders.set(eventJson.order_id, eventJson);
      // [eventJson.order_id] = eventJson;
    }
  } else if (event.eventName === "MatchOrder") {

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

  if (message.type === 'handshake') {
    let signture = ec.signHex(message.content, prvKey.prvKeyHex);
    // console.log(stream);
    await pipe([JSON.stringify({ name: username, cert: cert, encrypted: signture })], stream);
  } else if (message.type === 'shares') {
    // console.log(message);
    for (let order of message.content) {
      matchingOrders.get(order.order_id).shares[order.name] = Buffer.from(order.share);
      console.log(`Receive share from ${order.name} for order ${order.order_id}, content: `, Buffer.from(order.share));
    }
    /*
    for (var i = 0; i < message.content.length; i++) {
      matchingOrders[message.content[i].order_id].shares[message.content[i].name] = Buffer.from(message.content[i].share);
      console.log(`Receive share from ${message.content[i].name} for order ${message.content[i].order_id}, content: `, Buffer.from(message.content[i].share));
    }*/
  } else if (message.type === "quit") {
    peerList.delete(message.content.id);
    console.log(`Peer ${message.content.id} quit...`);
    await pipe([JSON.stringify({ msg: "Quit acknowledged." })], stream);
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
        console.log(`Now send my shares to ${peerId.toB58String()}.`);

        nodeSendAndClose(peerId, JSON.stringify({
          type: 'shares', content: Array.from(matchingOrders.values(),
            x => { return { order_id: x.order_id, name: username, share: x.shares[username] }; })
        }));
        /*
        await pipe([JSON.stringify({
          type: 'shares', content: Array.from(Object.values(matchingOrders),
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
  // console.log(shares);
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
}

async function fetchOrders() {
  // matchingOrders
  let response = await orderContract.evaluateTransaction('GetMatchingOrder');
  let orders = Array.from(JSON.parse(response.toString()), x => x.Record);
  for (let order of orders) {
    let shares = order.shares[username];
    // console.log(order);
    order.shares[username] = decryptShare(shares);
    order.price = null;
    console.log("Decrypt my share: ", order.shares[username]);
    /*
     * Send the share to other after handshake, not now.
     */
    matchingOrders.set(order.order_id, order);
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
