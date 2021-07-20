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

+ 增加了冻结和解冻的操作：
  ```javascript
  async Freeze(ctx, amount);
  async GetFreezedBalance(ctx, spender);
  async Unfreeze(ctx, amount);
  ```
  只要通过不同币种的链码进行调用即可。

+ 对于成交的订单，会赋予一个已完成订单的编号，用户凭借这个编号来举报订单，新的订单成交事件会发送下面的信息（新增了 `deal_id` 字段）
  ```javascript
  {
    deal_id: doid,
    order: [order1Content, order2Content],
    context: context
  }
  ```
  并且新增了 `GetDealedOrders` 获取所有的成交订单（格式如上），老的接口 `GetDealOrder` 也保留了，他输出的是所有已成交的买单和卖单。
  还规定的了举报的接口如下，但是还未实现（思路是发送一个事件，然后根据成交的订单获取当时交易的上下文，让所有的委员会成员去检测上下文以及结果是否符合）：
  ```javascript
  async Report(ctx, dealed_order_id) {
    // TODO
    ctx.stub.setEvent('Report', Buffer.from(dealed_order_id));
  }
  ```

##### Updated 2021.7.19
+ 修改了启动脚本，启动后自动注册用户名为 `usr1`、`usr2`、`usr3`、`usr4`、`usr5` 的五个用户，并转账 100 USDT。

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
node queryToken.js username tokenname amount # 为用户[username]发行[amount]个[tokenname]币
```

进入 `darkpool_dev/userApp`目录执行：

```shell
node enrollAdmin.js  # 注册管理员
node regUser.js username # 通过控制台注册名为[username]的用户
node server.js  # 运行服务端程序
```

打开一个新的终端，进入 `darkpool_dev/userApp`目录执行：

```shell
node formCommittee.js  # 尝试形成委员会
```

其余操作均在Web前端执行即可
