/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const Token = require('./token.js');
const Dogecoin = require('./doge.js');
const Bitcoin = require('./btc.js');
// 20220718
const Ethereum = require('./eth.js');
const Cardano = require('./ada.js');
//const Algorand = require('./algo.js');
const Litecoin = require('./ltc.js');
const Cosmos = require('./atom.js');
const Decred = require('./dcr.js');

module.exports.contracts = [Token, Dogecoin, Bitcoin, Ethereum, Cardano, Litecoin, Cosmos, Decred]; // 20220719
