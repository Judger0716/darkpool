#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Contract Name
NAME=papercontract
# Chaincode version
VERSION=0
# Chaincode sequence
SEQUENCE=1
# Chaincode dir
CODE_PATH=${DIR}/contract

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Package chaincode
peer lifecycle chaincode package cp.tar.gz --lang node --path ${CODE_PATH} --label cp_0

cd "${DIR}/organization/token"
source token.sh

# Install chaincode
peer lifecycle chaincode install cp.tar.gz
PACKAGE_ID=`peer lifecycle chaincode queryinstalled | grep -oP 'cp_0:[a-z0-9]*'`


peer lifecycle chaincode approveformyorg --orderer localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name ${NAME} -v ${VERSION} --package-id $PACKAGE_ID --sequence ${SEQUENCE} --tls --cafile $ORDERER_CA

cd "${DIR}/organization/darkpool"
source darkpool.sh

# Install chaincode
peer lifecycle chaincode install cp.tar.gz
PACKAGE_ID=`peer lifecycle chaincode queryinstalled | grep -oP 'cp_0:[a-z0-9]*'`

peer lifecycle chaincode approveformyorg --orderer localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name ${NAME} -v ${VERSION} --package-id $PACKAGE_ID --sequence ${SEQUENCE} --tls --cafile $ORDERER_CA


# Commit chaincode
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --peerAddresses localhost:7051 --tlsRootCertFiles ${PEER0_ORG1_CA} --peerAddresses localhost:9051 --tlsRootCertFiles ${PEER0_ORG2_CA} --channelID mychannel --name ${NAME} -v ${VERSION} --sequence ${SEQUENCE} --tls --cafile $ORDERER_CA --waitForEvent
