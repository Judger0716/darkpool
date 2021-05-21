# Hyperledger Fabric 开发框架

## 介绍

最近更新了目录结构，将所有的示例代码放到了 `/samples` 目录下，其中 `application_samples` 和 `contract_samples` 是之前的样例链码和应用，现在被单独拿出来了（这意味着他们现在也不能直接在原位运行了，需要修改代码中的配置文件路径）。

我们需要开发的内容都在 `darkpool_dev` 目录下，根目录下的其余文件夹皆是依赖文件，可以先不用管；`darkpool_dev` 目录中 `contracts` 里面的是链码，`organization` 是两个组织的配置文件以及客户端文件。

`organization` 目录下的两个组织：`darkpool` 对应的是组织1(Org1)，`token` 对应的是组织2(Org2)，这个目录下的文件我们基本不用关心了。

`tokenApp` 是以 `Org1MSP` 授权的用户注册工具，以及对应的客户端脚本，他们有铸币权限和修改 token 信息的权限。
`userApp` 是以 `Org2MSP` 授权的用户注册工具，以及对应的客户端脚本，他们没有铸币权限。 

注册流程改变了，现在是先用 `enrollAdmin.js` 来引入管理员，再用 `regUser.js` 注册用户，用户的证书信息都在 `wallet` 文件夹中。

## 开发流程

首先进入 `darkpool_dev` 目录，执行：

```shell
./network-starter.sh
```

来创建一个 Hyperledger Fabric 集群。然后进入 `darkpool_dev/contracts` 里面每个链码的目录，执行：

```shell
./install_chaincode.sh
```

来安装链码。然后进入 `darkpool_dev/userApp` 或 `darkpool_dev/tokenApp` 目录下，首先执行：

```shell
npm install
```

安装相关的依赖，再运行注册用户的代码：

```shell
node enrollAdmin.js
node regUser.js
```

测试脚本的一个运行方式为，先在 `tokenApp` 和 `userApp` 中运行上面的注册代码，再在 `tokenApp` 运行：

```shell
node queryToken.js
```

会给该用户自己铸币 100 枚，并转给 `userApp` 中注册的用户 50 枚。

然后再在 `userApp` 运行：

```shell
node queryToken.js
```

会看到上面给自己转的 50 枚代币。

此时可以在两个目录中任意一个中运行：

```shell
node queryCommittee.js
```

来支付 50 枚代币并将自己加入委员会的候选人当中。

然后可以参考 `queryToken.js` 和 `queryCommittee.js` 写客户端程序。

自己修改链码中的合约后，只需进入 `darkpool_dev/contracts` 里面对应链码的目录，再次执行：

```shell
./install_chaincode.sh
```

就会自动安装新版本的链码。

