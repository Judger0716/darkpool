/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

const orderKey = 'Order'
const dealOrderKey = 'Dealed'
const matchingOrderKey = 'Matching'
const orderIDKey = 'OrderID'
const dealOrderIDKey = 'DealOrderID'
const contextKey = 'OrderContextKey'


class Order extends Contract {
  constructor() {
    super('Order');
  }

  async Init(ctx) {
    // Set init version
    await ctx.stub.putState(orderIDKey, Buffer.from("0"));
  }

  async GetOrderID(ctx, key) {
    let id = await ctx.stub.getState(key);
    if (!id || id.length === 0) {
      return "0";
    }
    return id.toString();
  }

  /*
   * IncreaseAndGetOrderID - Get an available oid / deal order_id
   */
  async IncreaseAndGetOrderID(ctx, key) {
    let oid = await this.GetOrderID(ctx, key);
    // Add the order id by one.
    oid = (parseInt(oid) + 1).toString();
    await ctx.stub.putState(key, Buffer.from(oid));
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
  async CreateOrder(ctx, type, amount, itemname, shares) {
    if (type !== 'buy' && type !== 'sell')
      throw new Error(`Invalid type ${type} of order.`)

    // Try to freeze first if it's a buy order.
    // ....

    const oid = await this.IncreaseAndGetOrderID(ctx, orderIDKey);
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
      price: null,
      shares: json_shares,
      deal: false,
      deal_price: null,
      deal_time: null,
      deal_order_id: null,
      deal_with: null
    }

    // Add the order to database.
    await ctx.stub.putState(orderCompositeKey, JSON.stringify(newOrder));

    ctx.stub.setEvent('NewOrder', Buffer.from(JSON.stringify(newOrder)));
  }

  /**
   * OrderDeal deal an order
   * @param {Context} ctx 
   * @param {string} order1_id 
   * @param {string} order2_id 
   * @param {string} price 
   * @param {Object} context 
   */
  async OrderDeal(ctx, order1_id, order2_id, price, context) {
    // Restrict privilege
    // const clientMSPID = await ctx.clientIdentity.getMSPID();
    /*
    if (clientMSPID !== 'Org1MSP') {
      throw new Error('client is not authorized to deal order');
    }*/

    // Buyer should pay first.
    // ....

    let order1Key = await ctx.stub.createCompositeKey(orderKey, [matchingOrderKey, order1_id]);
    let order2Key = await ctx.stub.createCompositeKey(orderKey, [matchingOrderKey, order2_id]);
    let contextCompositeKey = await ctx.stub.createCompositeKey(contextKey, [order1_id, order2_id]);

    let order1Content = JSON.parse(await ctx.stub.getState(order1Key));
    let order2Content = JSON.parse(await ctx.stub.getState(order2Key));

    if (order1Content.deal === true || order2Content.deal === true) {
      throw new Error('The order already deal.');
    }

    // Get a dealed order ID.
    let doid = await this.IncreaseAndGetOrderID(ctx, dealOrderIDKey);

    order1Content.deal = order2Content.deal = true;
    order1Content.deal_time = order2Content.deal_time = ctx.stub.getTxTimestamp();
    order1Content.deal_order_id = order2Content.deal_order_id = doid;
    order1Content.deal_price = order2Content.deal_price = price;
    order1Content.deal_with = order2_id;
    order2Content.deal_with = order1_id;

    await ctx.stub.deleteState(order1Key);
    await ctx.stub.deleteState(order2Key);

    let dealKey = await ctx.stub.createCompositeKey(dealOrderKey, [doid]);
    // Form a deal struct to store the deal information.
    // To be filled if needed.
    let dealOrder = {
      deal_id: doid,
      order: [order1Content, order2Content],
      context: JSON.parse(context)
    }
    await ctx.stub.putState(dealKey, JSON.stringify(dealOrder));

    // Update the key to dealed key.
    order1Key = await ctx.stub.createCompositeKey(orderKey, [dealOrderKey, order1_id]);
    order2Key = await ctx.stub.createCompositeKey(orderKey, [dealOrderKey, order2_id]);

    await ctx.stub.putState(order1Key, JSON.stringify(order1Content));
    await ctx.stub.putState(order2Key, JSON.stringify(order2Content));
    await ctx.stub.putState(contextCompositeKey, JSON.stringify(context));

    ctx.stub.setEvent('OrderDeal', Buffer.from(JSON.stringify(dealOrder)));
  }

  async GetDealedOrders(ctx) {
    const result = await ctx.stub.getStateByPartialCompositeKey(dealOrderKey, []);
    return this.QueryAllResult(result);
  }

  async Report(ctx, dealed_order_id) {
    // TODO
    ctx.stub.setEvent('Report', Buffer.from(dealed_order_id));
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

  async GetContext(ctx, order1_id, order2_id) {
    const contextCompositeKey = await ctx.stub.createCompositeKey(contextKey, [order1_id, order2_id]);
    return await ctx.stub.getState(contextCompositeKey);
  }
}

module.exports = Order;
