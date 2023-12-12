# CryptoPool

## Set-up

Run the following code:

```shell
cd MP-SPDZ
/Script/setup-ssl.sh 3
cd darkpool_dev
./network-starter.sh
```

## Note

安装完成后使用node server.js启动服务端，使用python3 relayer.py调用tokenview api获取区块数据

启动脚本需要清空userApp下prices.json，才能使最终交易匹配结果中的明文价格正确