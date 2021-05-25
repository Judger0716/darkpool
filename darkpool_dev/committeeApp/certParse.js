/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');
const verify = crypto.createVerify('RSA-SHA256');

async function main() {
  const walletPath = path.join(process.cwd(), '..', 'tokenApp', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  console.log(`Wallet path: ${walletPath}`);

  // Check to see if we've already enrolled the admin user.
  const identity = await wallet.get('admin');

  const privateKey = identity.credentials.privateKey;
  const publicKey = identity.credentials.certificate;

  const str = 'abcd';

  sign.update(str);
  verify.update(str);

  let signture = sign.sign(privateKey);
  let result = verify.verify(publicKey, signture);
  console.log(result);

}


main();