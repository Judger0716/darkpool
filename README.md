# Efficient Darkpool Trading System Based on Blockchain Technology

## 1.Environment for Testing

### Operating System (Aliyun ECS)

+ Instance specification: ecs.n4.small
+ CPU: 1 Core
+ Memory: 2G
+ MirrorID: ubuntu_20_04_x64_20G_alibase_20210623.vhd
+ OS: Linux
+ OS Name: Ubuntu 20.04 64-bit

### Hyperledger Fabric Version

+ Docker version 20.10.7, build 20.10.7-0ubuntu1~20.04.1
+ docker-compose version 1.29.0, build 07737305
+ nodejs v14.17.6 -> v16.14.0
+ npm 7.14.0
+ Fabric v2.3.1
+ Fabric CA v1.4.9
+ hyperledger/fabric-tools v2.3.1
+ hyperledger/fabric-peer v2.3.1
+ hyperledger/fabric-orderer v2.3.1

### Python Extension Packages

+ utilitybelt v0.2.6

### Dependency

+ [MP-SPDZ](https://github.com/data61/MP-SPDZ)
+ [Simple_SSS](https://github.com/Judger0716/Simple_SSS.git)

## 2.[MP-SPDZ](https://github.com/data61/MP-SPDZ) Set-up

```shell
# clone MP-SPDZ
git clone https://github.com/data61/MP-SPDZ.git

# install dependency
apt-get install automake build-essential git libboost-dev libboost-thread-dev libntl-dev libsodium-dev libssl-dev libtool m4 python3 texinfo yasm

# compilation (in ECS)
make -j 1 tldr 

# tutorial
./compile.py tutorial
Scripts/setup-ssl.sh [<number of parties>]
echo 1 2 3 4 > Player-Data/Input-P0-0
echo 1 2 3 4 > Player-Data/Input-P1-0
Scripts/mascot.sh tutorial
```

## 3.Testing Order for Darkpool Trading System

Install the Fabric environment first (It is recommended to do this in a temporary directory and delete the temporary directory after installation)：

```shell
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.3.1 1.4.9
```

Enter `darkpool_dev/userApp`, `darkpool_dev/tokenApp`, `darkpool_dev/committeeApp` and run:

```shell
npm install # install npm dependency
```

Enter `darkpool_dev` directory：

```shell
bash network-starter.sh # Automatically start the system and install chaincode
```

Enter `darkpool_dev/userApp` directory and run：

```shell
node server.js  # Start server
```

Other operation could be done in the front end, you can use username `will` to login.

After login with username `will`, you should first form the committee.

Then you should create an order by yourself, then the system will automatically generate random orders for darkpool trading.

## Appendix: Problems and Possible Solution

### (1)[g++: fatal error: Killed signal terminated program cc1plus](https://www.lxx1.com/3886) when install MP-SPDZ

```shell
dd if=/dev/zero of=/swapfile bs=1k count=2048000
mkswap /swapfile
swapon /swapfile   
swapon -s  
echo "/var/swapfile swap swap defaults 0 0" >> /etc/fstab
```

### (2)Stuck in compiling OT-Extension.o

```shell
# adjust -j attribute to a proper value (based on your CPU core)
make -j 2 tldr
```

### (3)[ERROR: manifest for hyperledger/fabric-orderer:latest not found: manifest unknown: manifest unknown](https://blog.csdn.net/u010289909/article/details/115329957)

This is caused by different version tags between local fabric components and those in manifest. Here is possible solution (Took fabric-orderer as an example):

1)Visit https://hub.docker.com/r/hyperledger/fabric-orderer to acquire the ideal version.

2)Pull the ideal version down and match it to your manifest:

```shell
docker pull hyperledger/fabric-orderer:1.4
docker tag hyperledger/fabric-orderer:1.4 hyperledger/fabric-orderer:latest
```

3)Restart fabric-network:

```shell
./network.sh up
```

### (4)Browser(e.g Chrome) error "ERR_CERT_AUTHORITY_INVALID"

This is often caused by updating the chaincode without restart the fabric network, sometimes it could due to internet problems. For solution, you can restart the fabric network by:

```shell
cd ~/darkpool/darkpool_dev
# clean all the old network data
./network-clean.sh
# restart network
./network-starter.sh
```

### (5)[Error response from daemon: cannot stop container](https://blog.csdn.net/qq_28719743/article/details/89017770)

```shell
aa-remove-unknown
docker stop <container id>
```

### (6)Error: chaincode install failed with status: 500 - error in simulation: failed to execute transaction a77662ef0bac180ca5a4448434ab1cd90d30fae399901f49690b6b0c2b455991: error sending: timeout expired while executing transaction

This is caused by unknown reason, try run *network-clean.sh* for multiple times.

```shell
cd ~/darkpool/darkpool_dev
# run multiple times
./network-clean.sh
# then restart network
./network-starter.sh
```

## Reference

+ [MASCOT: Faster Malicious Arithmetic Secure Computation with Oblivious Transfer](https://eprint.iacr.org/2016/505.pdf)
+ [General Secure Multi-Party Computation from any Linear Secret-Sharing Scheme](https://link.springer.com/content/pdf/10.1007%2F3-540-45539-6_22.pdf)
+ [Linear (t,n) Secret Sharing Scheme based on Single Polynomial](https://www.ripublication.com/ijaer18/ijaerv13n14_37.pdf)
+ [Simplified VSS and Fact-Track Multiparty Computations with Applications to Threshold Cryptography](http://citeseerx.ist.psu.edu/viewdoc/download;jsessionid=DC08F471A4EE74C0701418D00C1B56CF?doi=10.1.1.47.6920&rep=rep1&type=pdf)
+ [Improved Primitives for Secure Multiparty Integer Computation](https://www1.cs.fau.de/filepool/publications/octavian_securescm/smcint-scn10.pdf)
+ [SecureSCM-D.9.2](https://www1.cs.fau.de/filepool/publications/octavian_securescm/SecureSCM-D.9.2.pdf)
+ [Unconditionally Secure Constant-Rounds Multi-party Computation for Equality, Comparison, Bits and Exponentiation](https://www.researchgate.net/profile/Jesper-Nielsen-8/publication/221354075_Unconditionally_Secure_Constant-Rounds_Multi-party_Computation_for_Equality_Comparison_Bits_and_Exponentiation/links/0fcfd50b464d7bd43d000000/Unconditionally-Secure-Constant-Rounds-Multi-party-Computation-for-Equality-Comparison-Bits-and-Exponentiation.pdf)
+ [Multiparty Computation for Interval, Equality, and Comparison Without Bit-Decomposition Protocol](https://link.springer.com/content/pdf/10.1007%2F978-3-540-71677-8_23.pdf)

## DevLog

### 2022-02-12

+ Successfully use **MP-SPDZ** to realize order matching (currently orders are generated manually).

+ **[Modification 1]** The original **MP-SPDZ** program for order matching now do the price comparision as well by adding the following functions, meanwhile the printed result is seperated by *\n* in terminal:

```python
# price comparision
def price_comparision(buyOrderNum,sellOrderNum,buyOrderPrice,sellOrderPrice):
    # sell <= buy >=
    cmpResult = Array(len(buyOrderPrice)+len(sellOrderPrice),sfix)
    @for_range(buyOrderNum)
    def _(i):
        cmpResult[i] = buyOrderPrice[i] >= deal_price
    @for_range(sellOrderNum)
    def _(i):
        cmpResult[buyOrderNum+i] = sellOrderPrice[i] <= deal_price
    return cmpResult

# price comparision
cmpResult = price_comparision(buyOrderNum,sellOrderNum,buyOrderPrice,sellOrderPrice)
@for_range(buyOrderNum+sellOrderNum)
def _(i):
    print_ln('%s',cmpResult[i].reveal())
```

+ **[Modification 2]** The original **Nodejs** order matching script *`~/darkpool_dev/committeeApp/match.js`* was changed into the following one, now we ***spawnSync*** method in ***child_process*** module for getting the result of *`match_order.mpc`*:

```javascript
function match(){
  const { spawn, spawnSync } = require('child_process');
  const matchResult = spawnSync('bash',['match.sh']);
  resultString = matchResult.stdout.toString();
  spdz_result = resultString.substring(0,resultString.length-1).split('\n');
  deal_price = parseInt(spdz_result[0]);
  max_execution = parseInt(spdz_result[1]);
  comparision = [];
  for(let i = 2; i < spdz_result.length; i++){
    comparision[i-2] = parseInt(spdz_result[i]);
  }
  console.log(deal_price,max_execution,comparision);
  return {
    price: deal_price,
    amount: max_execution,
    cmpResult: comparision
  }
}
module.exports = match;
```

+ **[Modification 3]** There are multiple modifications in *`~/darkpool_dev/committeeApp/client.js`*:

    + Take the sequence of members in committee as global variable *committeeNumber*

    ```javascript
    var committeeNumber;  // sequence of committee's member
    ```

    + Now non-master committee members **ONLY** do MP-SPDZ private input in *matchOrders()*, but the master does both MP-SPDZ private input and MP-SPDZ public input.

    + The call of *`~/darkpool_dev/committeeApp/match.js`* and the formation of *matchResult* are now done by the master alone. After the matching is completed, the master will broadcast the result to other non-master committee members.

    ```javascript
    // master call for public input and match_order
    if(username === masterName){

        // public input
        console.log('Doing SPDZ public Input ...')
        exec(public_input_cmd + '> ../../MP-SPDZ/Programs/Public-Input/match_order', async function (error, stdout, stderr) {
        if(error){
            console.error('error: ' + error);
        }
        }); 

        // matchorder entry
        let matchResult = match();
        // format of matchResult: {price: x, amount: y}
        console.log('matchResult: ',matchResult)
        if (matchResult.price <= 0 || matchResult.amount <= 0) {
        console.log('both < 0, continue')
        continue;
        }

        // get matchResult and form it 
        let itemResult = formMatchResult(buyOrders, sellOrders, matchResult);
        console.log('itemResult: ',itemResult);

        if (itemResult) {
        // broadcast matchResult
        for (let [peerString, peerId] of peerList) {
            nodeSendAndClose(peerId, JSON.stringify({
            type: 'hasMatched', 
            content: itemResult,
            item: item,
            }));
        }
        matchSuccess = true;
        msg.content[item] = itemResult;
        } else {
        continue;
        }
        // Wait for result.
        // stop = true;
    }
    ```

    + While non-master committee members receive the *matchResult* sent by the master, they will verify it and send the final result to the **fabric** blockchain, meanwhile they will clean(reset) their MP-SPDZ private input.

    ```javascript
    case 'hasMatched':
      // non-master member sync match result
      if(username !== masterName){

        // change state
        currentState = WAITING;
        // init msg
        let msg = {
          type: "matchResult",
          content: {
            name: username
          }
        }
        // RESET private input
        console.log('Reset SPDZ private Input ...')
        exec('rm -rf ../../MP-SPDZ/Player-Data/Input-P' + committeeNumber + '-0', async function (error, stdout, stderr) {
          if(error){
            console.error('error: ' + error);
          }
        });
        // send msg
        msg.content[message.item] = message.content;
        for (let [peerString, peerId] of peerList) {
          nodeSendAndClose(peerId, JSON.stringify(msg));
        }
      }
      break;
      ```

+ **[Future Work]**

    + Clean debug print in the terminal.
    
    + Modified *`~/darkpool_dev/userApp/autoCreateOrder.js`* for current version.

    + Add judge condition for committee members doing their MP-SDPZ private input.(Avoid constantly writing into files)

### 2021-12-16

+ *`match_order.mpc`* now can read ***buy_order_num*** and ***sell_order_num*** in the compiling process by the following code:

```shell
./compile.py -M match_order $buy_order_num $sell_order_num
```

+ Then **MP-SPDZ** will store the corresponding schedule and bytecode to */root/darkpool/MP-SPDZ/Programs/Schedules/match_order-[$buy_order_num]-[$sell_order_num].sch* and  */root/darkpool/MP-SPDZ/Programs/Schedules/match_order-[$buy_order_num]-[$sell_order_num]-0.bc*

+ To run the above MPC program, we should use the following code:

```shell
./shamir-party.x 0 match_order-$buy_order_num-$sell_order_num & 
./shamir-party.x 1 match_order-$buy_order_num-$sell_order_num & 
./shamir-party.x 2 match_order-$buy_order_num-$sell_order_num
```

+ The **Python** Script *`~/Simple_SSS/generate_shares.py`* has been changed to generate the above terminal code as well.

### 2021-12-14

+ Now every committee member can decrypt their own share and ready to input them into **MP-SPDZ** private input, the corresponding code is in *`~/darkpool_dev/userApp/client.js`* function *`matchOrders()`*. For example:

```javascript
// Member input their share
// for buy orders
for (let i = 0; i < buyOrdersInMatch.length; i++){
    public_input_cmd += buyOrdersInMatch[i].amount.toString();
    public_input_cmd += ' ';
    exec('echo ' + buyOrdersInMatch[i].shares[0] + ' '+ buyOrdersInMatch[i].shares[1] + ' >> ../../' + username + '_input', async function (error, stdout, stderr) {
    if(error){
        console.error('error: ' + error);
    }
    });          
}
```

+ Modified the *`match_order.mpc`* to take ***buy_order_num*** and ***sell_order_num*** as two public input. Now we define a global variable called ***max_order_num*** to restrict the max number of buy/sell orders given in *`match_order.mpc`*, as a result, the MPC program can initialize the ***Array*** class properly.

### 2021-12-13

+ Change secret sharing in *`~/darkpool_dev/userApp/autoCreateOrder.js`* to Python version.

+ Since **NodeJs** execute code in **asynchronous** way, so in *`~/darkpool_dev/userApp/server.js`* we should let function *create_order* execute after the secret sharing by plug it into the *exec()* function.

+ **[Debug Notice]**In route function *`createorder`* in *`~/darkpool_dev/userApp/server.js`*, the encryption process should take **string** variables as input, for the generated shares in Python version, use *`toString()`* method to convert it from **int** to **string**.

```javascript
enc_i[j] = jsrsasign.KJUR.crypto.Cipher.encrypt(shares[i][j].toString(), jsrsasign.KEYUTIL.getKey(pub_i));
```

+ Cancelled autoCreateOrder momentarily by not calling *`~/darkpool_dev/userApp/autoCreateOrder.js`*.

### 2021-12-09

+ Change secret sharing in *`~/darkpool_dev/userApp/server.js`* to Python version.

### 2021-12-08

+ Add the automatic way to generate shares in *`Simple_SSS`*.

+ Find the way to write match result into file. When run the MPC program, use the following code:
```shell
# write result to MatchResult-P0-0
./shamir-party.x -OF MatchResult 0 match_order & ./shamir-party.x 1 match_order & ./shamir-party.x 2 match_order
```

### 2021-12-06

+ Successfully implement full matching rules, now it can take price shares and amount as **input** and **output** the `deal_price` and `max_execution`, the MPC program *`match_test.mpc`* is as follows:

```python
# import
from Compiler.types import Array,sfix,cfix,cint
from Compiler.library import for_range, if_, if_e, else_, print_float_precision, print_ln, public_input

# set digital/float precision
sfix.set_precision(16, 64)
print_float_precision(32)

# get max value in an array, return its value and index (secret element)
def get_max_secret(arr,length):
    cur_max = Array(1,sfix)
    cur_max[0] = arr[0]
    cur_index = Array(1,cint)
    cur_index[0] = 0
    @for_range(length)
    def _(i):
        @if_( (arr[i]>cur_max[0]).reveal() )
        def _():
            cur_max[0] = arr[i]
            cur_index[0] = i
    return cur_max[0],cur_index[0]

# get max value in an array, return its value and index (public element)
def get_max_public(arr,length):
    cur_max = Array(1,cfix)
    cur_max[0] = arr[0]
    cur_index = Array(1,cint)
    cur_index[0] = 0
    @for_range(length)
    def _(i):
        @if_(arr[i]>cur_max[0])
        def _():
            cur_max[0] = arr[i]
            cur_index[0] = i
    return cur_max[0],cur_index[0]

# get min value in an array, return its value and index (secret element)
def get_min_secret(arr,length):
    cur_min = Array(1,sfix)
    cur_min[0] = arr[0]
    cur_index = Array(1,cint)
    cur_index[0] = 0
    @for_range(length)
    def _(i):
        @if_( (arr[i]<cur_min[0]).reveal() )
        def _():
            cur_min[0] = arr[i]
            cur_index[0] = i
    return cur_min[0],cur_index[0]

# get min value in an array, return its value and index (public element)
def get_min_public(arr,length):
    cur_min = Array(1,cfix)
    cur_min[0] = arr[0]
    cur_index = Array(1,cint)
    cur_index[0] = 0
    @for_range(length)
    def _(i):
        @if_(arr[i]<cur_min[0])
        def _():
            cur_min[0] = arr[i]
            cur_index[0] = i
    return cur_min[0],cur_index[0]

# judge certain value is in the array or not (secret element)
def is_in(val,arr):
    @for_range(len(arr))
    def _(i):
        @if_( (val==arr[i]).reveal() )
        def _():
            return True
    return False

# judge whether all the values in the array is above certain value (secret element)
def is_all_above(val,arr,length):
    @for_range(length)
    def _(i):
        @if_( (arr[i]<val).reveal() )
        def _():
            return False
    return True

# judge whether all the values in the array is below certain value (secret element)
def is_all_below(val,arr,length):
    @for_range(length)
    def _(i):
        @if_( (arr[i]>val).reveal() )
        def _():
            return False
    return True

# lagrange interpolation for secret recovery (single secret)
def lagrange_interpolation(dot,n):
    secret = Array(1,sfix)
    secret[0] = sfix(0)
    multi_sum = Array(1,sfix)
    # i stands for the i-th player
    @for_range(n)
    def _(i): 
        multi_sum[0] = 1
        # j stands for the j-th value
        @for_range(n)
        def _(j): 
            @if_(i!=j)
            def _():
                multi_sum[0] *= (sfix(0)-dot[j][0]) / (dot[i][0]-dot[j][0])
        secret[0] += multi_sum[0] * dot[i][1]
    return secret[0]

# input share -> prices in sfix format
def get_price_and_convert(order_num,n):
    # input order price
    shares = sfix.Tensor([order_num,n,2])
    @for_range(n) # each player
    def _(i):
        @for_range(order_num) # each order
        def _(j):
            shares[j][i][0] = sfix.get_input_from(i) # x_value
            shares[j][i][1] = sfix.get_input_from(i) # y_value

    # use lagrange interpolation to recover the price for the following computation
    prices = Array(order_num,sfix)
    @for_range(order_num)
    def _(i):
        prices[i] = lagrange_interpolation(shares[i],n)
        #print_ln('%s',prices[i].reveal())
    return prices

# get amounts in cfix format
def get_amount(order_num):
    orderAmount = Array(order_num,cfix)
    @for_range(order_num)
    def _(i):
        orderAmount[i] = public_input()
        #print_ln('%s',orderAmount[i])
    return orderAmount

# get reference price and weight, ToDo
def get_rfp_and_wt():
    return

# sort of orders, ascending prices
def sort(prices,amounts,n):
    # ascending prices
    @for_range(n)
    def _(i):
        @for_range(n)
        def _(j):
            @if_((prices[i] < prices[j]).reveal())
            def _():
                # change position
                p_tmp = prices[i]
                prices[i] = prices[j]
                prices[j] = p_tmp
                # also change correspond amount
                a_tmp = amounts[i]
                amounts[i] = amounts[j]
                amounts[j] = a_tmp
    return prices,amounts

# get all_price -> for further optimization, the returned array should be a set
def get_all_price(buyOrderNum,sellOrderNum,buyOrderPrice,sellOrderPrice):
    allOrderPrice = Array(buyOrderNum+sellOrderNum,sfix)
    # add buyprice to allprice
    @for_range(buyOrderNum)
    def _(i):
        allOrderPrice[i] = buyOrderPrice[i]
    # add sellprice to allprice
    @for_range(sellOrderNum)
    def _(j):
        allOrderPrice[buyOrderNum+j] = sellOrderPrice[j]
    return allOrderPrice

# calculate buy_sum,sell_sum,execution,imbalance
def calculate_other_parametres(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount,allOrderPrice):
    length = len(allOrderPrice)
    buy_sum = Array(length,cfix)
    sell_sum = Array(length,cfix)
    execution = Array(length,cfix)
    imbalance = Array(length,cfix)
    # iterate each buyprice
    @for_range(length)
    def _(i):
        @for_range(buyOrderNum)
        def _(j):
            @if_( (buyOrderPrice[j]>=allOrderPrice[i]).reveal() )
            def _():
                buy_sum[i] += buyOrderAmount[j]
    # iterate each sellprice
    @for_range(length)
    def _(i):
        @for_range(sellOrderNum)
        def _(j):
            @if_( (sellOrderPrice[j]<=allOrderPrice[i]).reveal() )
            def _():
                sell_sum[i] += sellOrderAmount[j]
    # calculate execution
    @for_range(length)
    def _(i):
        @if_e( buy_sum[i]<=sell_sum[i] )
        def _():
            execution[i] = buy_sum[i]
        @else_
        def _():
            execution[i] = sell_sum[i]
    # calculate imbalance
    @for_range(length)
    def _(i):
        imbalance[i] = buy_sum[i] - sell_sum[i]
    return execution,imbalance

# imbalance judgement, 1 for all positve, -1 for all negative, 0 for containing both
def judge_imbalance(imbalance):
    ret = 0
    # init returen value
    @if_e(imbalance[0]<0)
    def _():
        ret = -1
    @else_
    def _():
        ret = 1
    @for_range(len(imbalance))
    def _(i):
        @if_ ( imbalance[i]*ret<0 )
        def _():
            return 0
    return ret

# match order
def match_order(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount,allOrderPrice,referencePrice,weight):
    # no matching orders, deal_price = 0
    @if_e( (buyOrderPrice[buyOrderNum-1]<sellOrderPrice[0]).reveal() )
    def _():
        global deal_price
        deal_price = 0
    # do matching
    @else_
    def _():
        # calculate execution, imbalance
        execution,imbalance = calculate_other_parametres(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount,allOrderPrice)
        print_ln('execution: %s',execution)
        print_ln('imbalance: %s',imbalance)

        # get max execution
        global max_execution
        max_execution,max_execution_index = get_max_public(execution,len(execution)) # meanwhile alter the value of max_execution
        #print_ln('max execution: %s',max_execution)
        #print_ln('max execution index: %s',max_execution_index)

        # count the number of max execution
        priceCorrespondMaxExec = Array(len(allOrderPrice),sfix) # store prices of orders whose execution equal to max execution
        max_execution_count = Array(1,cint) # store the number of orders whose execution equal to max exexution
        max_execution_count[0] = 0 # init it with 0
        @for_range(len(execution))
        def _(i):
            # if execution value equal to max execution
            @if_(execution[i]==max_execution)
            def _():
                # check if its price has been counted
                @if_( not is_in(allOrderPrice[i],priceCorrespondMaxExec) )
                def _():
                    # if not, add its price and count it
                    priceCorrespondMaxExec[max_execution_count[0]] = allOrderPrice[i]
                    max_execution_count[0] += 1
        #print_ln('max execution count: %s',max_execution_count[0])
        #print_ln('correspond price: %s',priceCorrespondMaxExec.reveal_list())

        # if there is only one max execution
        @if_e(max_execution_count[0]==1)
        def _():
            global deal_price
            deal_price = allOrderPrice[max_execution_index]

        # else we should choose another price
        @else_
        def _():
            # use imbalance to judge different situation
            market_pressure = judge_imbalance(imbalance)
            #print_ln('market pressure: %s',market_pressure)

            # buy market pressure
            @if_(market_pressure==1)
            def _():
                # all the price is below reference price
                @if_(is_all_below(referencePrice*(1+weight),priceCorrespondMaxExec,max_execution_count[0]))
                def _():
                    # return the max price
                    dp,me = get_max_secret(priceCorrespondMaxExec,max_execution_count[0])
                    global deal_price
                    deal_price = dp
                # all the price is above reference price
                @if_e(is_all_above(referencePrice*(1+weight),priceCorrespondMaxExec,max_execution_count[0]))
                def _():
                    # return the min price
                    dp,me = get_min_secret(priceCorrespondMaxExec,max_execution_count[0])
                    global deal_price
                    deal_price = dp
                # else
                @else_
                def _():
                    # let reference price multiply a weight
                    global deal_price
                    deal_price = referencePrice*(1+weight)

            # sell market pressure
            @if_(market_pressure==-1)
            def _():
                # all the price is above reference price
                @if_(is_all_above(referencePrice*(1-weight),priceCorrespondMaxExec,max_execution_count[0]))
                def _():
                    # return the min price
                    dp,me = get_min_secret(priceCorrespondMaxExec,max_execution_count[0])
                    global deal_price
                    deal_price = dp
                # all the price is below reference price
                @if_e(is_all_below(referencePrice*(1-weight),priceCorrespondMaxExec,max_execution_count[0]))
                def _():
                    # return the max price
                    dp,me = get_max_secret(priceCorrespondMaxExec,max_execution_count[0])
                    global deal_price
                    deal_price = dp
                # else
                @else_
                def _():
                    # let reference price multiply a weight
                    global deal_price
                    deal_price = referencePrice*(1-weight)

            # no obvious market pressure, take further comparison
            @if_(market_pressure==0)
            def _():
                # if order prices contatin reference price, use it for matching
                @if_e(is_in(referencePrice,priceCorrespondMaxExec))
                def _():
                    global deal_price
                    deal_price = referencePrice
                # else
                @else_
                def _():
                    # find the price which is the closest to reference price
                    abs_value = Array(len(allOrderPrice),sfix) # store abs value
                    @for_range(max_execution_count[0])
                    def _(i):
                        abs_value[i] = priceCorrespondMaxExec[i]
                        @if_e( (abs_value[i]>referencePrice).reveal() )
                        def _():
                            abs_value[i] = abs_value[i] - referencePrice
                        @else_
                        def _():
                            abs_value[i] = referencePrice - abs_value[i]
                    min_abs,min_abs_index = get_min_secret(abs_value,max_execution_count[0])
                    closest_price = priceCorrespondMaxExec[min_abs_index]
                    # return the closest price
                    global deal_price
                    deal_price = closest_price

n = 3 # player number
buyOrderNum = 2 # number of buy orders
sellOrderNum = 3 # number of sell orders
referencePrice = 0 

# input buyorders
buyOrderPrice = get_price_and_convert(buyOrderNum,n)
buyOrderAmount = get_amount(buyOrderNum)

# input sellorders
sellOrderPrice = get_price_and_convert(sellOrderNum,n)
sellOrderAmount = get_amount(sellOrderNum)

# bubble sort, ascending prices, descending amount
buyOrderPrice,buyOrderAmount = sort(buyOrderPrice,buyOrderAmount,buyOrderNum)
sellOrderPrice,sellOrderAmount = sort(sellOrderPrice,sellOrderAmount,sellOrderNum)
allOrderPrice = get_all_price(buyOrderNum,sellOrderNum,buyOrderPrice,sellOrderPrice)
# print_ln('allprice: %s',allOrderPrice.reveal_list())

# prepare the parametres for matching orders
# they should be public, but due to the calculation needs, we declare them as sfix
referencePrice = sfix(100)
weight = sfix(0.05)

# take wanted result as global variable
deal_price = cfix(0) 
max_execution = cfix(0)

# match order, returning deal_price and max_execution
match_order(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount,allOrderPrice,referencePrice,weight)
print_ln('\n--Final Result--')
print_ln('Deal Price: %s',deal_price.reveal())
print_ln('Max Execution: %s',max_execution)
print_ln('--End--\n')
```

+ For running the above MPC program, you can take the following steps:
    - Get into *`~/Simple_SSS`* and run *`generate_shares.py`* in terminal, then you'll get the code which you put in the terminal like these:
    ```shell
    echo 1 5763596449 1 3704902086 1 5332685215 1 1577931741 1 3527058496 > Player-Data/Input-P0-0
    echo 2 14483897842 2 12263992502 2 14053025250 2 5971790272 2 7858520568 > Player-Data/Input-P1-0
    echo 3 26160904299 3 25677271328 3 26161020235 3 13181575793 3 12994386316 > Player-Data/Input-P2-0
    echo 281 49 429 148 960 > Programs/Public-Input/match_order
    ```
    - Get into *`~/MP-SPDZ`* and run:
    ```shell
    # compile the mpc program
    ./compile.py -M match_order
    # open three terminal to run the mpc program
    ./shamir-party.x 0 match_order & ./shamir-party.x 1 match_order & ./shamir-party.x 2 match_order
    ```

    - Then the terminal would print the matching result like this:
    ```shell
    --Final Result--
    Deal Price: 100
    Max Execution: 281
    --End--
    ```
    

### 2021-12-02

+ Successfully implement a part of the matching rules, the preparation for calculating `deal_price` and `max_execution` is done. By changing the MPC program *`match_test.mpc`* as follows, it can now correctlly calculate `execution` and `imbalance`:

```python
# import
from Compiler.types import Array,sfix,cfix
from Compiler.library import for_range, if_, if_e, else_, print_float_precision, print_ln, public_input

# set digital/float precision
sfix.set_precision(16, 64)
print_float_precision(32)

# lagrange interpolation for secret recovery (single secret)
def lagrange_interpolation(dot,n):
    secret = Array(1,sfix)
    secret[0] = sfix(0)
    multi_sum = Array(1,sfix)
    # i stands for the i-th player
    @for_range(n)
    def _(i): 
        multi_sum[0] = 1
        # j stands for the j-th value
        @for_range(n)
        def _(j): 
            @if_(i!=j)
            def _():
                multi_sum[0] *= (sfix(0)-dot[j][0]) / (dot[i][0]-dot[j][0])
        secret[0] += multi_sum[0] * dot[i][1]
    return secret[0]

# input share -> prices in sfix format
def get_price_and_convert(order_num,n):
    # input order price
    shares = sfix.Tensor([order_num,n,2])
    @for_range(n) # each player
    def _(i):
        @for_range(order_num) # each order
        def _(j):
            shares[j][i][0] = sfix.get_input_from(i) # x_value
            shares[j][i][1] = sfix.get_input_from(i) # y_value

    # use lagrange interpolation to recover the price for the following computation
    prices = Array(order_num,sfix)
    @for_range(order_num)
    def _(i):
        prices[i] = lagrange_interpolation(shares[i],n)
        #print_ln('%s',prices[i].reveal())
    return prices

# get amounts in cfix format
def get_amount(order_num):
    orderAmount = Array(order_num,cfix)
    @for_range(order_num)
    def _(i):
        orderAmount[i] = public_input()
        #print_ln('%s',orderAmount[i])
    return orderAmount

# sort of orders
def sort(prices,amounts,n):
    # ascending prices
    @for_range(n)
    def _(i):
        @for_range(n)
        def _(j):
            @if_((prices[i] < prices[j]).reveal())
            def _():
                # change position
                p_tmp = prices[i]
                prices[i] = prices[j]
                prices[j] = p_tmp
                # also change correspond amount
                a_tmp = amounts[i]
                amounts[i] = amounts[j]
                amounts[j] = a_tmp
    return prices,amounts

# get all_price -> for further optimization, the returned array should be a set
def get_all_price(buyOrderNum,sellOrderNum,buyOrderPrice,sellOrderPrice):
    allOrderPrice = Array(buyOrderNum+sellOrderNum,sfix)
    # add buyprice to allprice
    @for_range(buyOrderNum)
    def _(i):
        allOrderPrice[i] = buyOrderPrice[i]
    # add sellprice to allprice
    @for_range(sellOrderNum)
    def _(j):
        allOrderPrice[buyOrderNum+j] = sellOrderPrice[j]
    print_ln('allprice: %s',allOrderPrice.reveal_list())
    return allOrderPrice

# calculate buy_sum,sell_sum,execution,imbalance
def calculate_other_parametres(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount,allOrderPrice):
    length = len(allOrderPrice)
    buy_sum = Array(length,sfix)
    sell_sum = Array(length,sfix)
    execution = Array(length,sfix)
    imbalance = Array(length,sfix)
    # iterate each buyprice
    @for_range(length)
    def _(i):
        @for_range(buyOrderNum)
        def _(j):
            @if_( (buyOrderPrice[j]>=allOrderPrice[i]).reveal() )
            def _():
                buy_sum[i] += buyOrderAmount[j]
    # iterate each sellprice
    @for_range(length)
    def _(i):
        @for_range(sellOrderNum)
        def _(j):
            @if_( (sellOrderPrice[j]<=allOrderPrice[i]).reveal() )
            def _():
                sell_sum[i] += sellOrderAmount[j]
    # calculate execution
    @for_range(length)
    def _(i):
        @if_e( (buy_sum[i]<=sell_sum[i]).reveal() )
        def _():
            execution[i] = buy_sum[i]
        @else_
        def _():
            execution[i] = sell_sum[i]
    # calculate imbalance
    @for_range(length)
    def _(i):
        imbalance[i] = buy_sum[i] - sell_sum[i]
    return buy_sum,sell_sum,execution,imbalance

# match order
def match_order(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount):
    # no matching orders
    @if_e( (buyOrderPrice[buyOrderNum-1]<sellOrderPrice[0]).reveal() )
    def _():
        return 0,0
    # do matching
    @else_
    def _():
        # TODO
        return 1,1


n = 3 # player number
buyOrderNum = 2 # number of buy orders
sellOrderNum = 3 # number of sell orders
referencePrice = 0 

# input buyorders
buyOrderPrice = get_price_and_convert(buyOrderNum,n)
buyOrderAmount = get_amount(buyOrderNum)

# input sellorders
sellOrderPrice = get_price_and_convert(sellOrderNum,n)
sellOrderAmount = get_amount(sellOrderNum)

# bubble sort, ascending prices, descending amount
buyOrderPrice,buyOrderAmount = sort(buyOrderPrice,buyOrderAmount,buyOrderNum)
sellOrderPrice,sellOrderAmount = sort(sellOrderPrice,sellOrderAmount,sellOrderNum)
allOrderPrice = get_all_price(buyOrderNum,sellOrderNum,buyOrderPrice,sellOrderPrice)

buy_sum,sell_sum,execution,imbalance = calculate_other_parametres(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount,allOrderPrice)
print_ln('buysum: %s',buy_sum.reveal_list())
print_ln('sellsum: %s',sell_sum.reveal_list())
print_ln('execution: %s',execution.reveal_list())
print_ln('imbalance: %s',imbalance.reveal_list())

# match order, returning deal_price and max_execution
#deal_price,max_execution = match_order(buyOrderNum,sellOrderNum,buyOrderPrice,buyOrderAmount,sellOrderPrice,sellOrderAmount)
#print_ln('%s %s',deal_price,max_execution)
```

+ New **JS** file named *`match_test.js`* in *~/darkpool_dev/committeeApp* is a test script for verifying the result of the above MPC program.

### 2021-12-01

+ The project structure has been modified!

+ The orginal approach of realizing order matching using **JSON** format is **FAILED** because of the mutually-exclusive variable type between **Python** and **MP-SPDZ**, the index in the *`@for_range`* structure of **MP-SPDZ** is *`regint`*, but the index of Python3 list only support *`int`* or *`slice`*, the unique type *`regint`* cannot convert into *`int`* in **MP-SPDZ**.

+ As a result, there is another way of realizing the [Reference Match Rules](https://www.jianshu.com/p/cce46cb696bb). We can construce multiple MPC program for integer comparison and computation and use **shell** script to call them. The basic logic of the Reference Match Rules is still coded in **Node.js**.

+ For example, we can run the follwing script named *`integer_comparison.sh`* in *~/darkpool_dev/committeeApp* to do the integer comparison, the result will return in the terminal. Noticed that it should be used with the **Python** script *`generate_shares.py`* in *~/Simple_SSS* and copy the terminal input into *`integer_comparison.sh`*.:

```shell
#!/bin/bash
echo "starting integer comparison ..."
cd /root/MP-SPDZ
echo 1 6547524676 1 3419428149 > Player-Data/Input-P0-0
echo 2 20418508967 2 10287910074 > Player-Data/Input-P1-0
echo 3 41612952996 3 20605446009 > Player-Data/Input-P2-0
./shamir-party.x 0 integer_comparison &
./shamir-party.x 1 integer_comparison &
./shamir-party.x 2 integer_comparison
```

+ Meanwhile the interger compaison protocol named *`integer_comparison.mpc`* is designed as follows:

```python
'''
Comparison between two shared integers a,b
Return 0,1,2
0 stands for a=b
1 stands for a<b
2 stands for a>b
'''

# digital/float precision
sfix.set_precision(16, 64)
print_float_precision(32)

# lagrange interpolation for secret recovery
def lagrange_interpolation(x_values,y_values,m,n):
    # return an Array of m-secret
    secret = Array(m,sfix)
    # k stands for the k-th secret
    @for_range(m)
    def _(k):
        multi_sum = Array(1,sfix)
        # i stands for the i-th player
        @for_range(n)
        def _(i): 
            multi_sum[0] = 1
            # j stands for the j-th value
            @for_range(n)
            def _(j): 
                @if_(i!=j)
                def _():
                    multi_sum[0] *= (sfix(0)-x_values[k][j]) / (x_values[k][i]-x_values[k][j])
            secret[k] += multi_sum[0] * y_values[k][i]
    return secret

m = 2 # secret number
n = 3 # player number
x_values = Matrix(m,n,sfix)
y_values = Matrix(m,n,sfix)

@for_range(m)
def _(i):
    @for_range(n)
    def _(j): 
        x_values[i][j] = sfix.get_input_from(j)
        y_values[i][j] = sfix.get_input_from(j)

secret = lagrange_interpolation(x_values,y_values,m,n)

@if_( (secret[0]==secret[1]).reveal() )
def _():
    print_ln('%s',0)

@if_( (secret[0]<secret[1]).reveal() )
def _():
    print_ln('%s',1)

@if_( (secret[0]>secret[1]).reveal() )
def _():
    print_ln('%s',2)
```

+ And for the two key variable: `deal_price` and `max_execution` in our match rules, we will use a MPC program to calculate it independently, the inputs are divided into private inputs and public inputs, where private inputs correspond to price shares and public inputs correspond to order amount. Our output will be the `deal_price` and `max_execution`. The incomplete program named *`match_order.mpc`* is as follow:

```python
# import
from Compiler.types import Array,sfix,cfix
from Compiler.library import for_range,if_,print_float_precision,print_ln, public_input

# set digital/float precision
sfix.set_precision(16, 64)
print_float_precision(32)

# lagrange interpolation for secret recovery (single secret)
def lagrange_interpolation(dot,n):
    secret = Array(1,sfix)
    secret[0] = sfix(0)
    multi_sum = Array(1,sfix)
    # i stands for the i-th player
    @for_range(n)
    def _(i): 
        multi_sum[0] = 1
        # j stands for the j-th value
        @for_range(n)
        def _(j): 
            @if_(i!=j)
            def _():
                multi_sum[0] *= (sfix(0)-dot[j][0]) / (dot[i][0]-dot[j][0])
        secret[0] += multi_sum[0] * dot[i][1]
    return secret[0]

# input share -> prices in sfix format
def get_price_and_convert(order_num,n):
    # input order price
    shares = sfix.Tensor([order_num,n,2])
    @for_range(n) # each player
    def _(i):
        @for_range(order_num) # each order
        def _(j):
            shares[j][i][0] = sfix.get_input_from(i) # x_value
            shares[j][i][1] = sfix.get_input_from(i) # y_value

    # use lagrange interpolation to recover the price for the following computation
    prices = Array(order_num,sfix)
    @for_range(order_num)
    def _(i):
        prices[i] = lagrange_interpolation(shares[i],n)
        #print_ln('%s',prices[i].reveal())
    return prices

# get amounts in cfix format
def get_amount(order_num):
    orderAmount = Array(order_num,cfix)
    @for_range(order_num)
    def _(i):
        orderAmount[i] = public_input()
        #print_ln('%s',orderAmount[i])
    return orderAmount

# sort of orders
def sort(prices,amounts,n):
    # ascending prices
    @for_range(n)
    def _(i):
        @for_range(n)
        def _(j):
            @if_((prices[i] < prices[j]).reveal())
            def _():
                tmp = prices[i]
                prices[i] = prices[j]
                prices[j] = tmp
    # descending amounts
    @for_range(n)
    def _(i):
        @for_range(n)
        def _(j):
            @if_(amounts[i] > amounts[j])
            def _():
                tmp = amounts[i]
                amounts[i] = amounts[j]
                amounts[j] = tmp
    return prices,amounts

n = 3 # player number
buyOrderNum = 2 # number of buy orders
sellOrderNum = 3 # number of sell orders
referencePrice = 0 

# input buyorders
buyOrderPrice = get_price_and_convert(buyOrderNum,n)
buyOrderAmount = get_amount(buyOrderNum)

# input sellorders
sellOrderPrice = get_price_and_convert(sellOrderNum,n)
sellOrderAmount = get_amount(sellOrderNum)

# maopao sort
buyOrderPrice,buyOrderAmount = sort(buyOrderPrice,buyOrderAmount,buyOrderNum)
sellOrderPrice,sellOrderAmount = sort(sellOrderPrice,sellOrderAmount,sellOrderNum)
```

### 2021-11-29

+ Altered the MPC program as follows, added order data in **JSON** format for implementing the order match. Take single order as an example, now the program can recover the secret price from the order data and plug it into the **JSON** structure.

+ The next step is implementing the sort of secret prices and the match rules.

+ [Reference Match Rules](https://www.jianshu.com/p/cce46cb696bb)

```python
# digital/float precision
sfix.set_precision(16, 64)
print_float_precision(32)

# import
import json

# lagrange interpolation for secret recovery
def lagrange_interpolation(dot,n):
    secret = Array(1,sfix)
    secret[0] = sfix(0)
    multi_sum = Array(1,sfix)
    # i stands for the i-th player
    @for_range(n)
    def _(i): 
        multi_sum[0] = 1
        # j stands for the j-th value
        @for_range(n)
        def _(j): 
            @if_(i!=j)
            def _():
                multi_sum[0] *= (sfix(0)-dot[j][0]) / (dot[i][0]-dot[j][0])
        secret[0] += multi_sum[0] * dot[i][1]
    return secret[0]

n = 3 # player number

# input buyorders, which can be converted to file input as well 
buyOrdersInMatch = [{
    'id': '1',
    'type': 'buy',
    'creator': 'zhang',
    'shares': Matrix(n,2,sfix),
    'amount': 100,
    'deal_amount': 0
},{
    'id': '2',
    'type': 'buy',
    'creator': 'zhang',
    'shares': Matrix(n,2,sfix),
    'amount': 110,
    'deal_amount': 0
},
]

# input sellorders, which can be converted to file input as well
sellOrdersInMatch = [{
    'id': '3',
    'type': 'sell',
    'creator': 'wang',
    'shares': Matrix(n,2,sfix),
    'amount': 90,
    'deal_amount': 0
},{
    'id': '4',
    'type': 'sell',
    'creator': 'li',
    'shares': Matrix(n,2,sfix),
    'amount': 120,
    'deal_amount': 0
},]

# take buyorder[0] as an example, each player input its share
@for_range(n)
def _(i): 
    buyOrdersInMatch[0]['shares'][i][0] = sfix.get_input_from(i) # dot[i] x_value
    buyOrdersInMatch[0]['shares'][i][1] = sfix.get_input_from(i) # dot[i] y_value

# use lagrange interpolation to recover the price for the following comparison
buyOrdersInMatch[0]['price'] = lagrange_interpolation(buyOrdersInMatch[0]['shares'],n)
print_ln('%s',buyOrdersInMatch[0]['price'].reveal())
```

### 2021-11-3

+ Successfully implemented the comparation between two integers while maintaining in ciphertext (or called shares). Since we don't use `reveal()` to recover the secret with its shares in the `shamir-party` protocol, the value of the secret should be secure and meet our expextation.

+ Adjusted the MPC program's structure as follows, making it modular.

```python
sfix.set_precision(16, 64)
print_float_precision(32)

def lagrange_interpolation(x_values,y_values,m,n):
    # return an Array of m-secret
    secret = Array(m,sfix)
    # k stands for the k-th secret
    @for_range(m)
    def _(k):
        multi_sum = Array(1,sfix)
        # i stands for the i-th player
        @for_range(n)
        def _(i): 
            multi_sum[0] = 1
            # j stands for the j-th value
            @for_range(n)
            def _(j): 
                @if_(i!=j)
                def _():
                    multi_sum[0] *= (sfix(0)-x_values[k][j]) / (x_values[k][i]-x_values[k][j])
            secret[k] += multi_sum[0] * y_values[k][i]
    return secret

m = 2 # secret number
n = 3 # player number
x_values = Matrix(m,n,sfix)
y_values = Matrix(m,n,sfix)

@for_range(m)
def _(i):
    @for_range(n)
    def _(j): 
        x_values[i][j] = sfix.get_input_from(j)
        y_values[i][j] = sfix.get_input_from(j)

secret = lagrange_interpolation(x_values,y_values,m,n)
#print_ln('%s',secret[0].reveal())
#print_ln('%s',secret[1].reveal())
print_ln('Secret[0] < Secret[1]: %s (1 for True, 0 for False)',(secret[0]<secret[1]).reveal())
```

### 2021-10-29

+ Successfully implemented secret recovery scheme of single trillion number using honest majority protocol `shamir-party`, the corresponding shamir threshold secret sharing was based on GF(2^32), which means the parametres of the polynomial is on GF(2^32).Now the average calculating time is below 0.2 second.

+ The improvement in efficiency basically comes from the protocol we choose to run our `.mpc` protocol. For the MASCOT protocol uses simple-OT and triples in computation, there is an efficiency concern in it. Since we don't have the worry of malicious committee members due to the `honest majority` hypothesis, we should take honest majority protocol instead.

+ Take the following steps for testing

```shell
# our customized .mpc file is now called `lagrange`
# -M for avoiding memory errors, -F for expanded number field
./compile.py -M -F 256 lagrange
# get input for three parties
echo 1 1926542137713 > Player-Data/Input-P0-0
echo 2 1927237984496 > Player-Data/Input-P1-0
echo 3 1927933831279 > Player-Data/Input-P2-0
# terminal 1
./shamir-party.x 0 lagrange
# terminal 2
./shamir-party.x 1 lagrange
# terminal 3
./shamir-party.x 2 lagrange
```

### 2021-10-18

+ Successfully adjusted secret recovery scheme from single party computation to 3-parties computation. Due to the memory restriction, it could not be adapted into computation between more parties. For each secret recovery, the approximate time is about 82 seconds.

```Python
sfix.set_precision(16, 64)
print_float_precision(32)

n = 3
x_values = Array(n,sfix)
y_values = Array(n,sfix)

@for_range(n)
def _(i): 
    x_values[i] = sfix.get_input_from(i)
    y_values[i] = sfix.get_input_from(i)

secret = sfix(0)
multi_sum = Array(1,sfix)

@for_range(n)
def _(i): 
    global multi_sum
    multi_sum[0] = 1
    @for_range(n)
    def _(j): 
        @if_(i!=j)
        def _():
            global multi_sum
            multi_sum[0] *= (sfix(0)-x_values[j]) / (x_values[i]-x_values[j])
    global secret
    secret += multi_sum[0] * y_values[i]

print_ln('secret = %s',secret.reveal())
```

### 2021-10-15

+ Successfully implemented secret recovery with MP-SPDZ with some restrictions by writing following `.mpc` file

```Python
sfix.set_precision(32, 64)
print_float_precision(32)

n = 4
x_values = Array(n,sfix)
y_values = Array(n,sfix)

@for_range(n)
def _(i): 
    x_values[i] = sfix.get_input_from(0)

@for_range(n)
def _(i):
    y_values[i] = sfix.get_input_from(0)

secret = sfix(0)
multi_sum = Array(1,sfix)

@for_range(n)
def _(i): 
    global multi_sum
    multi_sum[0] = 1
    @for_range(n)
    def _(j): 
        @if_(i!=j)
        def _():
            global multi_sum
            multi_sum[0] *= (sfix(0)-x_values[j]) / (x_values[i]-x_values[j])
    global secret
    secret += multi_sum[0] * y_values[i]

print_ln('secret = %s',secret.reveal())
```
+ The above secret recovery can be used to recover shares splited by a polynomial on GF(2^16). Due to float number accurancy reason, the above secret recovery can only support numbers with less than 8 digits. As this is just a demo, it takes input from one person but use MASCOT protocol to do MPC computation, the approximate running time for recover an 8-digit number is 42 seconds.

+ Secret recovery testing instruction (The above secret recovery scheme is written in `mytest.mpc`)

```shell
# Compile
make -j 2 mascot-party.x
# Input
cat testdata.dat > Player-Data/Input-P0-0
# Run MASCOT protocol
./mascot-party.x -N 2 -p 0 mytest
# Run in another terminal
./mascot-party.x -N 2 -p 1 mytest
```

  and testdata.dat looks like:

```shell
1
2
3
4
18354939
18505534
18725697
19015428
```

### 2021-10-11

+ Implemented simple threshold shamir secret sharing on GF(2^64) with Python. [Details](https://github.com/Judger0716/Simple_SSS.git)

### 2021-09-29

+ Implemented simple three-party calculation following blog [安全多方计算之SPDZ实例初探（一）](https://blog.csdn.net/shengsikandan/article/details/115912186), based on shamir-bmr-party.

+ Fixed path problem in the source code of darkpool trading system.

+ Understood the basic grammar of MP-SPDZ's High-Level Interface and tried to compile customized mpc protocols.

### 2021-09-27

+ Successfully deployed MP-SPDZ on the ECS and ran the tutorial.

+ Adjusted README.md for better reading.