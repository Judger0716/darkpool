/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

const orderType = {
  BUY: 1,
  SELL: 2
}

const orderStatus = {
  CREATED: 1,
  MATCHED: 2,
  FINISHED: 3
}

class OrderContract extends Contract {
  constructor() {
    super('Order');
  }

  async create(ctx, owner, type, amount, price) {
    {
      
    }
  }
}