const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const jsrsasign = require('jsrsasign');

const node_list = {}
for( var i = 0; i < 200; i++){
    var r = Math.ceil(Math.random() * 10000000);
    var rsaKeypair = jsrsasign.KEYUTIL.generateKeypair("RSA", 512);
    var pub = jsrsasign.KEYUTIL.getPEM(rsaKeypair.pubKeyObj);
    node_list['user'+ r.toString()] = pub.toString();
}
fs.writeFileSync('node_order_list.json',JSON.stringify(node_list));
// console.log(node_list)
/*
fs.readFile('node_list.json',(err,data) => {
    let nl = JSON.parse(data)
    console.log(nl.user5390)
})*/