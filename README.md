# 基于区块链技术的高效暗池交易系统

## 测试环境

+ Ubuntu 20.04 LTS
+ Docker version 20.10.7, build 20.10.7-0ubuntu1~20.04.1
+ docker-compose version 1.29.0, build 07737305
+ nodejs v14.17.6
+ npm 7.14.0
+ Fabric v2.3.1
+ Fabric CA v1.4.9

## SPDZ搭建

```shell
git clone https://github.com/data61/MP-SPDZ.git
apt-get install automake build-essential git libboost-dev libboost-thread-dev libntl-dev libsodium-dev libssl-dev libtool m4 python3 texinfo yasm
make -j 8 tldr
./compile.py tutorial
echo 1 2 3 4 > Player-Data/Input-P0-0
echo 1 2 3 4 > Player-Data/Input-P1-0
Scripts/mascot.sh tutorial
```

## 作品测试相关命令

首先安装 Fabric 环境（推荐在临时目录下完成，安装完以后删除临时目录）：

```shell
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.3.1 1.4.9
```

然后进入 `darkpool_dev`目录：

```shell
bash network-starter.sh # 自动启动系统并安装链码
```

进入 `darkpool_dev/userApp`目录执行：

```shell
node server.js  # 运行服务端程序
```

然后在Web前端操作即可，使用账户 `will` 登录。
