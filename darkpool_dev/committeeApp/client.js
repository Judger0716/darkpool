/* eslint-disable no-console */
'use strict'

const Libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const Mplex = require('libp2p-mplex');
const { NOISE } = require('libp2p-noise');
const MulticastDNS = require('libp2p-mdns');
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway, TxEventHandlerFactory } = require('fabric-network');
const { exit } = require('process');

var network;
var peerList = new Map();

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

async function committeeEventHandler(event) {

}

async function confirmOnline() {

}

async function initConnection() {
  // A wallet stores a collection of identities for use
  const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/../tokenApp/wallet');

  // A gateway defines the peers used to access Fabric networks
  const gateway = new Gateway();

  // Specify userName for network access
  const userName = "admin";

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

  const committeeContract = await network.getContract('committeeContract', 'Committee');

  committeeContract.addContractListener(committeeEventHandler);


  const tokenContract = await network.getContract('tokenContract', 'Token');

  await tokenContract.addContractListener((event) => {
    console.log(event.eventName);
    const eventJson = JSON.parse(event.payload.toString());
    console.log(eventJson.from);
    console.log(eventJson.to);
    console.log(eventJson.value);
  }, { startBlock: 22 });

  // gateway.disconnect();
}

async function indentityCheck() {

}

async function nodeDiscovery(peerId) {
  if (!peerList.has(peerList)) {

  }
  console.log('Discovered:', peerId.toB58String());
}

async function checkConnectivity() {

}

async function main() {
  const node1 = await createNode();

  node1.on('peer:discovery', nodeDiscovery);

  await node1.start();
}

// main();

initConnection();
console.log('ok');
/*

; (async () => {
  const [node1, node2] = await Promise.all([
    createNode(),
    createNode()
  ])

  node1.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))
  node2.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))

  await Promise.all([
    node1.start(),
    node2.start()
  ])
})();

*/