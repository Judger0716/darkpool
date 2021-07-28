cd /root/framework/darkpool_dev/userApp 
nohup node autoCreateOrder.js &

cd /root/framework/darkpool_dev/committeeApp
nohup node client.js usr1 &
nohup node client.js usr2 &
nohup node client.js usr3 &
