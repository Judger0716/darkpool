# 基于区块链技术的高效暗池交易系统

## 测试环境

+ Ubuntu 16.04 LTS
+ Docker version 20.10.6, build 370c289
+ docker-compose version 1.29.0, build 07737305
+ nodejs v14.17.0
+ npm 7.14.0
+ Fabric v2.3.1
+ Fabric CA v1.4.9

## Update

##### Updated 2021.7.13
+ 可以根据不同币种进行操作了，目前有三种货币（`Bitcoin`，`Dogecoin`，`Token`），通过调用代币链码中的不同合约来实现，例如调用 Dogecoin：
  ```javascript
  const contract = await network.getContract('tokenContract', 'Dogecoin');
  ```
  由于保留了名为 `Token` 的代币作为默认，所以之前的代码仍能正常执行（之前只有 `Token` 这一个合约）。

## 作品测试相关命令

首先安装 Fabric 环境（推荐在临时目录下完成，安装完以后删除临时目录）：

```shell
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.3.1 1.4.9
```

然后进入 `darkpool_dev`目录：

```shell
bash network-starter.sh # 自动启动系统并安装链码
```

进入 `darkpool_dev/tokenApp` 目录执行：

```shell
node enrollAdmin.js  # 注册管理员
node regUser.js username  # 注册一个名为[username]的用户
node queryToken.js username  # 为用户[username]发行50个Doge币
```

进入 `darkpool_dev/userApp`目录执行：

```shell
node enrollAdmin.js  # 注册管理员
node server.js  # 运行服务端程序
```

打开一个新的终端，进入 `darkpool_dev/userApp`目录执行：

```shell
node formCommittee.js  # 尝试形成委员会
```

其余操作均在Web前端执行即可