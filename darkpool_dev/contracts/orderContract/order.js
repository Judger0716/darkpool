/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

const orderKey = 'Order'
const dealOrderKey = 'Dealed'
const matchingOrderKey = 'Matching'
const orderIDKey = 'OrderID'



class Order extends Contract {
  constructor() {
    super('Order');
  }

  async Init(ctx) {
    // Set init version
    await ctx.stub.putState(orderIDKey, Buffer.from("0"));
  }

  async GetOrderID(ctx) {
    let id = await ctx.stub.getState(orderIDKey);
    if (!id || id.length === 0) {
      return "0";
    }
    return id.toString();
  }

  async IncreaseAndGetOrderID(ctx) {
    let oid = await this.GetOrderID(ctx);
    // Add the order id by one.
    oid = (parseInt(oid) + 1).toString();
    await ctx.stub.putState(orderIDKey, Buffer.from(oid));
    return oid;
  }
  /*
   * OrderID
   * CreateTime
   * Creator
   * Type (`buy` or `sell`)
   * Item
   * Amount (encrypted)
   * Price (encrypted)
   * Shares
   * Deal
   * DealPrice
   * DealTime
   * DealOrderID
  */
  async CreateOrder(ctx, type, amount, price, itemname, shares) {
    // TODO: check the shares.
    // Check type
    if (type !== 'buy' && type !== 'sell')
      throw new Error(`Invalid type ${type} of order.`)

    const oid = await this.IncreaseAndGetOrderID(ctx);
    const creator = await ctx.clientIdentity.getID().toString();
    const orderCompositeKey = await ctx.stub.createCompositeKey(orderKey, [matchingOrderKey, oid]);
    // parse the shares
    const json_shares = JSON.parse(shares);
    // order structure.
    const newOrder = {
      order_id: oid,
      create_time: ctx.stub.getTxTimestamp(),
      creator: creator,
      type: type,
      item: itemname,
      amount: amount,
      price: price,
      shares: json_shares,
      deal: false,
      deal_price: null,
      deal_time: null,
      deal_order_id: null,
    }
    // PrePay for the deal???

    // Add the order to database.
    await ctx.stub.putState(orderCompositeKey, JSON.stringify(newOrder));

    ctx.stub.setEvent('NewOrder', Buffer.from(JSON.stringify(newOrder)));
  }

  /*
   * Let creator pay for the order.
   */
  async OrderDeal(ctx, order1_id, order2_id, price) {
    // Restrict privilege
    const clientMSPID = await ctx.clientIdentity.getMSPID();
    if (clientMSPID !== 'Org1MSP') {
      throw new Error('client is not authorized to deal order');
    }

    const order1OrignKey = await ctx.stub.createCompositeKey(orderKey, [matchingOrderKey, order1_id]);
    const order2OrignKey = await ctx.stub.createCompositeKey(orderKey, [matchingOrderKey, order2_id]);

    let order1Content = JSON.parse(await ctx.stub.getState(order1OrignKey).toString());
    let order2Content = JSON.parse(await ctx.stub.getState(order2OrignKey).toString());

    order1Content.price = order2Content.price = price;

    await ctx.stub.deleteState(order1OrignKey);
    await ctx.stub.deleteState(order2OrignKey);

    const order1NewKey = await ctx.stub.createCompositeKey(orderKey, [dealOrderKey, order1_id]);
    const order2NewKey = await ctx.stub.createCompositeKey(orderKey, [dealOrderKey, order2_id]);

    await ctx.stub.putState(order1NewKey, JSON.stringify(order1Content));
    await ctx.stub.putState(order2NewKey, JSON.stringify(order2Content));

    ctx.stub.setEvent('OrderDeal', Buffer.from([order1Content, order2Content]));
  }

  async GetDealOrder(ctx) {
    const result = await ctx.stub.getStateByPartialCompositeKey(orderKey, [dealOrderKey]);
    return this.QueryAllResult(result);
  }

  async GetMatchingOrder(ctx) {
    const result = await ctx.stub.getStateByPartialCompositeKey(orderKey, [matchingOrderKey]);
    return this.QueryAllResult(result);
  }

  async QueryAllResult(iterator) {
    let allResults = [];
    let res = { done: false, value: null };

    while (true) {
      res = await iterator.next();
      let jsonRes = {};
      if (res.value && res.value.value.toString()) {
        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }

        allResults.push(jsonRes);
      }
      // check to see if we have reached the end
      if (res.done) {
        // explicitly close the iterator 
        // console.log('iterator is done');
        await iterator.close();
        return allResults;
      }
    }  // while true
  }
}

module.exports = Order;
