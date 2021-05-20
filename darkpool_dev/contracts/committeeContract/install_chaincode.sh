#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Where am I?
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Contract Name
NAME=$(basename ${CURRENT_DIR})

# Init
INIT_CODE=''

# Path of Version File
VER_PATH="${CURRENT_DIR}/ver"

# Read Chaincode version and sequence from file 'ver'
if [ ! -f ${VER_PATH} ]; then
  echo "0 1" >${VER_PATH}
fi
VERSION=$(cat ${VER_PATH} | awk '{print $1}')
SEQUENCE=$(cat ${VER_PATH} | awk '{print $2}')

# Chaincode dir
CODE_PATH="${CURRENT_DIR}"
# Chaincode label
CODE_LABLE="${NAME}_${VERSION}"
# Package path
PKG_PATH="${CURRENT_DIR}/cp.tar.gz"

cd "${CURRENT_DIR}/../../organization/token"
source token.sh

echo "Code label ${CODE_LABLE}"

# Package chaincode
peer lifecycle chaincode package ${PKG_PATH} \
  --lang node \
  --path ${CODE_PATH} \
  --label ${CODE_LABLE}

# Install chaincode for Org1
peer lifecycle chaincode install ${PKG_PATH}
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep -oP "${CODE_LABLE}:[a-z0-9]*")

peer lifecycle chaincode approveformyorg \
  --orderer localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name ${NAME} \
  -v ${VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile $ORDERER_CA

cd "${CURRENT_DIR}/../../organization/darkpool"
source darkpool.sh

# Install chaincode for Org2
peer lifecycle chaincode install ${PKG_PATH}
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep -oP "${CODE_LABLE}:[a-z0-9]*")

peer lifecycle chaincode approveformyorg \
  --orderer localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name ${NAME} \
  -v ${VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile $ORDERER_CA

echo "Wait for 5 seconds..."
sleep 5

# Commit chaincode
peer lifecycle chaincode commit -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PEER0_ORG1_CA} \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PEER0_ORG2_CA} \
  --channelID mychannel \
  --name ${NAME} \
  -v ${VERSION} \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile $ORDERER_CA \
  --waitForEvent

rm -f ${PKG_PATH}

# Update version and sequence
echo "$(expr $VERSION + 1) $(expr $SEQUENCE + 1)" >${VER_PATH}
