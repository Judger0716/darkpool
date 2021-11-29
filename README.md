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

After login with username `will`, you should first form the committee.

Then you should create an order by yourself, then the system will automatically generate random orders for darkpool trading.

## Appendix: Problems and Possible Solution

### (1)[`g++: fatal error: Killed signal terminated program cc1plus`](https://www.lxx1.com/3886) when install MP-SPDZ

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

### (3)[`ERROR: manifest for hyperledger/fabric-orderer:latest not found: manifest unknown: manifest unknown`](https://blog.csdn.net/u010289909/article/details/115329957)

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

### (4)Browser(e.g Chrome) error `ERR_CERT_AUTHORITY_INVALID`

This is often caused by updating the chaincode without restart the fabric network, sometimes it could due to internet problems. For solution, you can restart the fabric network by:

```shell
cd ~/darkpool/darkpool_dev
# clean all the old network data
./network-clean.sh
# restart network
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