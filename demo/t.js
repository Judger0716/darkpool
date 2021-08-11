let spawn = require('child_process').spawn;
// Create a child process
let child = spawn('stdbuf', ['-i0', '-o0', '-e0', 'node']);

child.stdout.on('data', function (data) {
  console.log(data.toString());
});

child.stderr.on('data', function (data) {
  console.log(data.toString());
});

child.on('error', function () {
  console.log("Failed to start child.");
});
child.on('close', function (code) {
  console.log('Child process exited with code ' + code);
});
child.stdout.on('end', function () {
  console.log('Finished collecting data chunks.');
});
