/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const Token = require('./token.js');
const Dogecoin = require('./doge.js');
const Bitcoin = require('./btc.js');

module.exports.contracts = [Token, Dogecoin, Bitcoin];
