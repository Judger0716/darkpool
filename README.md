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
+ nodejs v14.17.6
+ npm 7.14.0
+ Fabric v2.3.1
+ Fabric CA v1.4.9

### Python Extension Packages

+ utilitybelt v0.2.6

## 2.[MP-SPDZ](https://github.com/data61/MP-SPDZ) Set-up

```shell
# clone MP-SPDZ
git clone https://github.com/data61/MP-SPDZ.git

# install dependency
apt-get install automake build-essential git libboost-dev libboost-thread-dev libntl-dev libsodium-dev libssl-dev libtool m4 python3 texinfo yasm

# compilation
make -j 2 tldr 

# tutorial
./compile.py tutorial
echo 1 2 3 4 > Player-Data/Input-P0-0
echo 1 2 3 4 > Player-Data/Input-P1-0
Scripts/mascot.sh tutorial
```

## 3.Testing Order for Darkpool Trading System

Install the Fabric environment first (It is recommended to do this in a temporary directory and delete the temporary directory after installation)：

```shell
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.3.1 1.4.9
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

## Appendix: Problems and Possible Solution

### (1)["g++: fatal error: Killed signal terminated program cc1plus"](https://www.lxx1.com/3886) when install MP-SPDZ

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

### (3)["ERROR: manifest for hyperledger/fabric-orderer:latest not found: manifest unknown: manifest unknown"](https://blog.csdn.net/u010289909/article/details/115329957)

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

## DevLog

### 2021-09-29

+ Implemented simple three-party calculation following blog [安全多方计算之SPDZ实例初探（一）](https://blog.csdn.net/shengsikandan/article/details/115912186), based on shamir-bmr-party.
+ Fixed path problem in the source code of darkpool trading system.
+ Understood the basic grammar of MP-SPDZ's High-Level Interface and tried to compile customized mpc protocols.

### 2021-09-27

+ Successfully deployed MP-SPDZ on the ECS and ran the tutorial.
+ Adjusted README.md for better reading.

### 2021-10-11

+ Implemented simple threshold shamir secret sharing on GF(2^64) with Python. [Details](https://github.com/Judger0716/Simple_SSS.git)

### 2021-10-15

+ Successfully implement secret recovery with MP-SPDZ with some restrictions by writing following `.mpc` file

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
