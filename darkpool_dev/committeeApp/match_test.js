var exec = require('child_process').exec;
exec('bash match.sh', async function (error, stdout, stderr) {
  if(error){
      console.error('error: ' + error);
      return;
  }
  console.log(stdout);
  spdz_result = stdout.substring(0,stdout.length-1).split(' ');
  deal_price = spdz_result[0];
  max_execution = spdz_result[1];
  console.log(deal_price,max_execution);
});