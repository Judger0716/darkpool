#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0

function _exit(){
    printf "Exiting:%s\n" "$1"
    exit -1
}

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export FABRIC_CFG_PATH="${DIR}/../config"

cd "${DIR}/../test-network/"

docker kill cliDarkPool cliToken logspout || true
./network.sh down

rm -rf ${DIR}/contract/ver
rm -rf ${DIR}/organization/darkpool/gateway/connection-org1.yaml ${DIR}/organization/token/gateway/connection-org2.yaml
rm -rf ${DIR}/organization/darkpool/identity ${DIR}/organization/token/identity

# remove any stopped containers
docker rm $(docker ps -aq)

