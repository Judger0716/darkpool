# cd /root/darkpool/darkpool_dev/userApp 
# nohup node autoCreateOrder.js &

userNames=("Steve" "Morgan" "Orville" "Tara" "Luna")

cd /root/darkpool/darkpool_dev/committeeApp
nohup node client.js ${userNames[0]} &
nohup node client.js ${userNames[1]} &
nohup node client.js ${userNames[2]} &