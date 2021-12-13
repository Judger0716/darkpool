const jsrsasign = require('jsrsasign');
const fs = require('fs');
var exec = require('child_process').exec;
let price = 100
let t = 3
let n = 4
exec('python3 /root/darkpool/Simple_SSS/sss.py ' + price + ' '+ t + ' '+ n, async function (error, stdout, stderr) {
  if(error){
      console.error('error: ' + error);
      return;
  }
  // convert it to json
  var shares = JSON.parse(stdout);
  console.log(shares);
  var rsaKeypair = jsrsasign.KEYUTIL.generateKeypair("RSA", 512);
  // 密钥对象获取pem格式的密钥
  var pub = jsrsasign.KEYUTIL.getPEM(rsaKeypair.pubKeyObj);
  var prv = jsrsasign.KEYUTIL.getPEM(rsaKeypair.prvKeyObj, 'PKCS8PRV');
  enc = []
  for (let i = 0; i < n; i++){
    enc[i] = []
    for (let j = 0; j < 2; j++){
      enc[i][j] = jsrsasign.KJUR.crypto.Cipher.encrypt(shares[i][j].toString(), jsrsasign.KEYUTIL.getKey(pub));
      jsrsasign.hextob64(enc[i][j]);
      let dec = jsrsasign.KJUR.crypto.Cipher.decrypt(enc[i][j], jsrsasign.KEYUTIL.getKey(prv));
      console.log(dec);
    }
  }
});
/* 
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
*/