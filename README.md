# 基于区块链技术的高效暗池交易系统

## 测试环境

### 系统环境（阿里云ECS）

+ 实例规格: ecs.n4.small
+ CPU: 1核
+ 内存: 2G
+ 镜像ID: ubuntu_20_04_x64_20G_alibase_20210623.vhd
+ 操作系统: Linux
+ 系统名称: Ubuntu 20.04 64位

### Hyperledger Fabric环境

+ Docker version 20.10.7, build 20.10.7-0ubuntu1~20.04.1
+ docker-compose version 1.29.0, build 07737305
+ nodejs v14.17.6
+ npm 7.14.0
+ Fabric v2.3.1
+ Fabric CA v1.4.9

## SPDZ搭建

```shell
# clone SPDZ库
git clone https://github.com/data61/MP-SPDZ.git

# 安装所需依赖
apt-get install automake build-essential git libboost-dev libboost-thread-dev libntl-dev libsodium-dev libssl-dev libtool m4 python3 texinfo yasm

# 由于测试环境CPU为单核，-j参数设置为2，条件允许可采用更高的并发数编译
make -j 2 tldr 

# tutorial测试实例
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

```shelld
bash network-starter.sh # 自动启动系统并安装链码
```

进入 `darkpool_dev/userApp`目录执行：

```shell
node server.js  # 运行服务端程序
```

然后在Web前端操作即可，使用账户 `will` 登录。

## 错误及解决办法

1. [安装MPDZ时报错"g++: fatal error: Killed signal terminated program cc1plus"](https://www.lxx1.com/3886)

```shell
#获取要增加的2G的SWAP文件块
dd if=/dev/zero of=/swapfile bs=1k count=2048000

#创建SWAP文件
mkswap /swapfile

#激活SWAP文件
swapon /swapfile   

#查看SWAP信息是否正确
swapon -s  

#添加到fstab文件中让系统引导时自动启动
echo "/var/swapfile swap swap defaults 0 0" >> /etc/fstab
```

2. 安装SPDZ编译OT-Extension.o时卡死

```shell
# 修改make -j x tldr中x的参数为合适值
make -j 2 tldr
```

3. [安装SPDZ时其他问题](https://blog.csdn.net/shengsikandan/article/details/116654618)