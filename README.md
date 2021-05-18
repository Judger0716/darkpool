# Hyperledger Fabric 开发框架

## 介绍

我们需要开发的内容都在 `darkpool_dev` 目录下，其中 `contract` 是链码，`organization` 是两个组织的配置文件以及客户端文件。

我们计划将所有的合约放在一个链码里面，虽然目前链码目录下还只有一个合约。链码目录下的 `install_chaincode.sh` 会自动安装和目录同名的链码到两个组织的 peer 节点上。

`organization` 目录下的两个组织：`darkpool` 对应的是组织2，`token` 对应的是组织1。

每个组织的目录下都有 `application`，我们主要需要参考其中的 `queryapp.js` 来了解以特定用户身份调用合约的方式，以及参考 `enrollUser.js` 来添加新用户。

## 开发流程

首先进入 `darkpool_dev` 目录，执行：

```shell
./network-starter.sh
```

来创建一个 Hyperledger Fabric 集群。然后进入 `darkpool_dev/contract` 目录，执行：

```shell
./install_chaincode.sh
```

来安装链码。然后进入两个组织的 `application` 目录下，首先执行：、

```shell
npm install
```

安装相关的依赖，再运行注册用户的代码：

```shell
node enrollUser.js
```

然后可以参考[商业票据教程](https://hyperledger-fabric.readthedocs.io/zh_CN/release-2.2/tutorial/commercial_paper.html)上的方式运行样例程序调用合约。

自己修改链码中的合约后，只需进入 `darkpool_dev/contract` 目录，再次执行：

```shell
./install_chaincode.sh
```

就会自动安装新版本的链码。

