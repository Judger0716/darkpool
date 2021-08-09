#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0

function _exit() {
    printf "Exiting:%s\n" "$1"
    exit -1
}

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Where am I?
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export FABRIC_CFG_PATH="${DIR}/../config"

cd "${DIR}/../test-network/"

docker kill cliDarkPool cliToken logspout || true
./network.sh down
./network.sh up createChannel -ca -s couchdb

# Copy the connection profiles so they are in the correct organizations.
cp "${DIR}/../test-network/organizations/peerOrganizations/org1.example.com/connection-org1"* "${DIR}/organization/token/gateway/"
cp "${DIR}/../test-network/organizations/peerOrganizations/org2.example.com/connection-org2"* "${DIR}/organization/darkpool/gateway/"

cp "${DIR}/../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/"* "${DIR}/../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem"
cp "${DIR}/../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/"* "${DIR}/../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/priv_sk"

cp "${DIR}/../test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/signcerts/"* "${DIR}/../test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/signcerts/User1@org2.example.com-cert.pem"
cp "${DIR}/../test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/keystore/"* "${DIR}/../test-network/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/keystore/priv_sk"

# echo Suggest that you monitor the docker containers by running
# echo "./organization/token/configuration/cli/monitordocker.sh fabric_test"

bash ${DIR}/contracts/tokenContract/install_chaincode.sh
bash ${DIR}/contracts/orderContract/install_chaincode.sh
bash ${DIR}/contracts/committeeContract/install_chaincode.sh

userNames=("Steve" "Morgan" "Orville" "Tara" "Luna")

# Register
cd ${DIR}/userApp ; node enrollAdmin.js ; 
for i in {0..4} ; do node regUser.js ${userNames[i]} ; done
node regUser.js will ; 

# Transfer
cd ${DIR}/tokenApp ; node enrollAdmin.js ; 
for i in {0..4} ; do node queryToken.js ${userNames[i]} Tether 100 ; done ;
node queryToken.js will Tether 100
# for i in {0..4} ; do node queryToken.js ${userNames[i]} Dogecoin 100 ; done 
# for i in {0..4} ; do node queryToken.js ${userNames[i]} Bitcoin 100 ; done 
cd ${DIR}/userApp
for i in {0..2} ; do node applyForCommittee.js ${userNames[i]} 50 ; done 
