// CORRECT VERSION
function match(){
  const { spawn, spawnSync } = require('child_process');
  const matchResult = spawnSync('bash',['match.sh']);
  resultString = matchResult.stdout.toString();
  spdz_result = resultString.substring(0,resultString.length-1).split('\n');
  deal_price = parseInt(spdz_result[0]);
  max_execution = parseInt(spdz_result[1]);
  comparision = [];
  for(let i = 2; i < spdz_result.length; i++){
    comparision[i-2] = parseInt(spdz_result[i]);
  }
  console.log(deal_price,max_execution,comparision);
  return {
    price: deal_price,
    amount: max_execution,
    cmpResult: comparision
  }
}
module.exports = match;


/*
OLD-VERSION
var exec = require('child_process').exec;
exec('bash match.sh', function (error, stdout, stderr) {
  if(error){
      console.error('error: ' + error);
      return;
  }
  console.log(stdout);
  spdz_result = stdout.substring(0,stdout.length-1).split(' ');
  deal_price = spdz_result[0];
  max_execution = spdz_result[1];
  console.log(deal_price,max_execution)
});
*/