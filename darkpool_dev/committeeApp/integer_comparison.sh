#!/bin/bash
echo "starting integer comparison ..."
cd /root/darkpool/MP-SPDZ
pwd
echo 1 6547524676 1 3419428149 > Player-Data/Input-P0-0
echo 2 20418508967 2 10287910074 > Player-Data/Input-P1-0
echo 3 41612952996 3 20605446009 > Player-Data/Input-P2-0
./shamir-party.x 0 integer_comparison &
./shamir-party.x 1 integer_comparison &
./shamir-party.x 2 integer_comparison