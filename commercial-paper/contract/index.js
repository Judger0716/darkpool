/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const cpcontract = require('./lib/papercontract.js');
const tokenERC20Contract = require('./lib/tokenERC20.js');

// module.exports.TokenERC20Contract = tokenERC20Contract;
module.exports.contracts = [cpcontract, tokenERC20Contract];
