/* eslint-disable no-console */
'use strict'

// const getPeer = require('libp2p/src/get-peer');
const Libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const Mplex = require('libp2p-mplex');
const { NOISE } = require('libp2p-noise');
const MulticastDNS = require('libp2p-mdns');
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway, TxEventHandlerFactory } = require('fabric-network');
const jsrsasign = require('jsrsasign');
const pipe = require('it-pipe');
var ec = new jsrsasign.KJUR.crypto.ECDSA({ 'curve': 'secp256r1' });

var node1;
var prvKey, cert;
var network, gateway;
var committeeMembers;
var username = process.argv[2];
var committeeContract, tokenContract, orderContract;
var lastSet = new Set();
var peerList = new Map();


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

const nodeMonitor = async () => {
  // console.log('Updating...');
  let newSet = new Set([...peerList.keys()]);
  if (!eqSet(lastSet, newSet)) {
    console.log(`PeerList changed: ${JSON.stringify([...peerList.keys()])}`);
    lastSet = newSet;
  }
  setTimeout(nodeMonitor, 1000);
}

const matchOrders = async () => {
  if (committeeMembers !== []) {
  } else {
  }
}

async function confirmOnline() {

}

async function committeeEventHandler(event) {
  console.log(event.eventName);
  const eventJson = JSON.parse(event.payload.toString());
  console.log(eventJson);
}

async function orderEventHandler(event) {
  console.log(event.eventName);
  const eventJson = JSON.parse(event.payload.toString());
  console.log(eventJson);
}

async function initConnection() {
  // A wallet stores a collection of identities for use
  const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/../tokenApp/wallet');

  // A gateway defines the peers used to access Fabric networks
  gateway = new Gateway();

  const userName = "admin";

  // Specify userName for network access
  if (username)
    userName = username;

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
}

async function nodeEventHandler({ stream }, msg) {
  let message = JSON.parse(msg.toString());
  if (message.type === 'handshake') {
    let signture = ec.signHex(message.content, prvKey.prvKeyHex);
    await pipe([JSON.stringify({ cert: cert, encrypted: signture })], stream);
  }
}

async function pemToPubkeyHex(pemCert) {
  var x509 = new jsrsasign.X509();
  x509.readCertPEM(pemCert);
  const pubKey = x509.getPublicKey();
  return pubKey.pubKeyHex;
}

/*
 * Handshake with newly discovered peers.
 */
async function nodeHandshake(peerId) {
  var identity;
  var { stream } = await node1.dialProtocol(peerId, '/a-protocol');
  var randomString = getRandomInt(1000000000000).toString();
  console.log("Send nonce: ", randomString, " to peer ", peerId.toB58String());
  // Send noance.
  await pipe([JSON.stringify({ type: 'handshake', content: randomString })], stream);
  // Receive cert and encrypted noance.
  await pipe(stream, async function (source) {
    let msg = await source.next();
    identity = JSON.parse(msg.value.toString());
  });

  const result = ec.verifyHex(randomString, identity.encrypted, await pemToPubkeyHex(identity.cert));
  if (result) console.log(`Peer ${peerId.toB58String()} verified.`);
  else console.log(`Peer ${peerId.toB58String()} invaid.`);

  let peerIdString = peerId.toB58String();
  // Add him to the list.
  if (result) {
    if (!peerList.has(peerIdString)) {
      peerList.set(peerIdString, peerId);
    }
    return { stream };
  }
  stream.close();
  return null;
}


async function checkConnectivity() {

}

async function fetchCommittee() {
  const response = await committeeContract.evaluateTransaction('GetCandidates');
  committeeMembers = JSON.parse(response.toString());
}

async function main() {
  await initConnection();
  node1 = await createNode();

  // Add node monitor.
  nodeMonitor();
  matchOrders();

  node1.on('peer:discovery', nodeHandshake);

  node1.handle('/a-protocol', ({ stream }) => {
    pipe(
      stream,
      async function (source) {
        for await (const msg of source) {
          nodeEventHandler({ stream }, msg);
        }
      }
    );
  });

  node1.start();

  process.on('SIGINT', function (code) {
    // console.log('进程退出码是:', code);
    gateway.disconnect();
    process.exit();
  });

  //进程退出
  // process.exit();
}

main();
