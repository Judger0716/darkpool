const jsrsasign = require('jsrsasign');
const fs = require('fs');
const sss = require('shamirs-secret-sharing');
 
var shares = '{ "com1": { "0": "1f1c5e7fd8e5752faa2df50972b272c73931e079ce15ed1ef7c230d95070eb35fbfc149d5ea17a9b6ebb45339b5585ee8ba4d4d9c0b782be2715fa510d7adece", "1": "5437a5d9c6a2a37cd33b10060e096357c9a6131ae4edd8f6c8f4981c8ec979050d6815a360182bbacf9958ef98d21730684c025ac72f41c2af095fbba0add0ac", "2": "46ed114f5681eb6093b1434f79abf1d27f51c6d20a3c71c26ab354f722fba42b3dff6ac4ac66f2d91df46f0698021e88ae7dacb4803651f57ca7bf918eb7137d", "3": "38568e15ce48e2706f0a45056d9872618b6965e250945399e2064f77a07912c2a99ff88585563f615a7d8fca0279cbcf3f29ba6d9c84422fb9e9008917f10af7", "4": "6a2231d4354fe3e0a54548ccc8e9c38b4fbf1a94278fecf2d0cb9182f582c4431004e1bb0d466abaac6d5930b2289a4f468641a676e7794c0927a168d9ed1e8f", "5": "49d19a7268c90e5fe5ce6e07667b42ded1233c24aaa5b20859375ab9dc167a9f9debcf5343b031acaa109bb95ce74f5438f9f2b675e5b0e4a45296a371885b10" }, "com2": { "0": "34bd47aa08e8208a5e73cd8b3c0445c385c132e6bbf2892ec626f438051ad6cc9e1358e1398cefe0d2a33ee63cd75112d8ca5443bd5c42779a0b2f99ecb5c199", "1": "b1a5c0f1869606d039d450bf60c6378f87480275c7a2ddfca123a385790af3e3c53151097f6a2fd84b215119012e681fca04ccf787fc1761292466c49f724046", "2": "774d436ccde1e365db838e6aab610f97001485b2fa1694f2fb18c4237f85c06810a816efc9f1fdd651d369415e6d9db4537075e3dd1218c01afa257d88d4b38b", "3": "0f5c34ed8756d462e38081e4696cb1b7dcd73165a39d19400491e319bbf763726ff9c2e99b4319b554a3ce3924a262bd7af56750acdc6b44670a81e3e594a4b0", "4": "7a26ad565e7d3c9ad3ca83b953dc3081ae6fd95adfdc3144d93e41ef8e57b0a30f0e4981e9d5d8a13147192a599eb9333364f774dc3beb1f3b9d4fb30063c678", "5": "02f4ecb5826bfd5700288e4786f050df10d95585ace70732641206b91c616fc486e8214bd9918fc1842a19de1dd6ff4ac60fb113fb937db020c552922989b6e0" }, "com3": { "0": "12c6e0260ebe8f4285e4073df213969bd7ffc56a9420986aad9d55e1b031c634806eb48444a712a92086d5be1adb934ddbb84d56343c3c503cb7c1916d5ee8ea", "1": "264cc9e62b6b2282b241cb071d5e4067f2e9e9d99826c2c856e001a3552460158372ac39271ee3c5ce25f068265f7b657af5de4c00e65d26629e3b5278122c8b", "2": "0736273394c431fb832dffe67b39d4630470ffe72d623048166875608728ab0be721e63e5b824b68045aad713fd735766b895398924ae67b8f4506e861c64077", "3": "62b51a4f8cebd93a0825e2d011c53987ce839c0fb5c560668c4b205f9f5ecdb0474b92e16aca992d4847b4bba0909d6fd59ab54882ad85e65f638e411ef7f969", "4": "1e186cb21da561b3210e190f71e63e7fb4e1837ceb6dedaaf7909ee98070cd5806d130b26e24b2dff70134f97c20165921a918836a36eae434791f139d0528e2", "5": "4fe791a1c012577f3d387a26825b88bc159af83a6613ae14864a35cbdad9c5c5db08d2997700fb8130857485b7139fa3d177974da9c4d30f84dc10861bbf688d" } }'
var json_shares = JSON.parse(shares);

var username = 'com1';
var len = 0;
for(var item in json_shares[username]){
  len++;
}
var prv = fs.readFileSync('../userApp/wallet/'+username+'.prvKey','utf-8').toString();

var strres = '';
for(var i=0;i<len;i++){
  var dec = jsrsasign.KJUR.crypto.Cipher.decrypt(json_shares[username][i], jsrsasign.KEYUTIL.getKey(prv));
  strres += dec; 
}
var recover_shares = []
recover_shares[0]=Buffer.from(strres.split(','));


var username = 'com2';
var len = 0;
for(var item in json_shares[username]){
  len++;
}
var prv = fs.readFileSync('../userApp/wallet/'+username+'.prvKey','utf-8').toString();
var strres = '';
for(var i=0;i<len;i++){
  var dec = jsrsasign.KJUR.crypto.Cipher.decrypt(json_shares[username][i], jsrsasign.KEYUTIL.getKey(prv));
  strres += dec; 
}
recover_shares[1]=Buffer.from(strres.split(','));

var username = 'com3';
var len = 0;
for(var item in json_shares[username]){
  len++;
}
var prv = fs.readFileSync('../userApp/wallet/'+username+'.prvKey','utf-8').toString();
var strres = '';
for(var i=0;i<len;i++){
  var dec = jsrsasign.KJUR.crypto.Cipher.decrypt(json_shares[username][i], jsrsasign.KEYUTIL.getKey(prv));
  strres += dec; 
}
recover_shares[2]=Buffer.from(strres.split(','));
console.log(recover_shares.slice(0, 3))

const recovered = sss.combine(recover_shares.slice(0, 3))
console.log(recovered.toString()) 
