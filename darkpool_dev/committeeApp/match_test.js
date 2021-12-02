const match = require('./match')

function formMatchResult(buyOrders, sellOrders, matchResult) {
    let skip = "x509::/OU=client/OU=org2/OU=department1/CN=will::/C=US/ST=North Carolina/O=Hyperledger/OU=Fabric/CN=fabric-ca-server";
    let price = matchResult.price;
    let amount = matchResult.amount;
  
    let context = {
      buy: Array.from(buyOrders, (x) => x.id),
      sell: Array.from(sellOrders, (x) => x.id)
    }
  
    let deal_buy_orders = [], deal_sell_orders = [];
    let buy_amount = amount, sell_amount = amount;
  
    for (let order of buyOrders) {
      if (buy_amount === 0) break;
      if (order.creator === skip) {
        continue;
      }
  
      if (order.price >= price && buy_amount > 0) {
        let remaining_amount = order.amount - order.deal_amount;
        if (remaining_amount <= buy_amount) {
          // order.deal_amount = order.amount;
          buy_amount -= remaining_amount;
        } else {
          // order.deal_amount += buy_amount;
          buy_amount = 0;
        }
        // deal_buy_orders.push(order);
      }
    }
  
    for (let order of sellOrders) {
      if (sell_amount === 0) break;
      if (order.creator === skip) {
        continue;
      }
  
      if (order.price <= price && sell_amount > 0) {
        let remaining_amount = order.amount - order.deal_amount;
        if (remaining_amount <= sell_amount) {
          // order.deal_amount = order.amount;
          sell_amount -= remaining_amount;
        } else {
          // order.deal_amount += sell_amount;
          sell_amount = 0;
        }
        // deal_sell_orders.push(order);
      }
    }
  
    amount = Math.min(amount - sell_amount, amount - buy_amount);
    buy_amount = amount, sell_amount = amount;
  
    if (amount <= 0)
      return null;
  
    for (let order of buyOrders) {
      if (buy_amount === 0) break;
      if (order.creator === skip) {
        continue;
      }
  
      if (order.price >= price && buy_amount > 0) {
        let remaining_amount = order.amount - order.deal_amount;
        if (remaining_amount <= buy_amount) {
          order.deal_amount = order.amount;
          buy_amount -= remaining_amount;
        } else {
          order.deal_amount += buy_amount;
          buy_amount = 0;
        }
        deal_buy_orders.push(order);
      }
    }
  
    for (let order of sellOrders) {
      if (sell_amount === 0) break;
      if (order.creator === skip) {
        continue;
      }
  
  
      if (order.price <= price && sell_amount > 0) {
        let remaining_amount = order.amount - order.deal_amount;
        if (remaining_amount <= sell_amount) {
          order.deal_amount = order.amount;
          sell_amount -= remaining_amount;
        } else {
          order.deal_amount += sell_amount;
          sell_amount = 0;
        }
        deal_sell_orders.push(order);
      }
    }
  
    // format of itemResult
    let item_result = {
      result: JSON.stringify(matchResult.price) + ":" + JSON.stringify(amount),
      price: matchResult.price,
      amount: amount,
      deal_orders: {
        buy: deal_buy_orders,
        sell: deal_sell_orders
      },
      context: context
    }
  
    // console.log(amount, buy_amount, sell_amount);
    // console.log(deal_buy_orders);
    // console.log(deal_sell_orders);
  
    if (buy_amount === sell_amount && deal_buy_orders.length > 0 && deal_sell_orders.length > 0) {
      return item_result;
    } else {
      return null;
    }
  }

buyOrdersInMatch = [{
    'id': '1',
    'type': 'buy',
    'creator': 'zhang',
    'price': 100,
    'amount': 648,
    'deal_amount': 0
},{
    'id': '2',
    'type': 'buy',
    'creator': 'zhang',
    'price': 120,
    'amount': 375,
    'deal_amount': 0
},
]
sellOrdersInMatch = [{
    'id': '3',
    'type': 'sell',
    'creator': 'wang',
    'price': 90,
    'amount': 695,
    'deal_amount': 0
},{
    'id': '4',
    'type': 'sell',
    'creator': 'li',
    'price': 140,
    'amount': 648,
    'deal_amount': 0
},{
  'id': '5',
  'type': 'sell',
  'creator': 'a',
  'price': 130,
  'amount': 362,
  'deal_amount': 0
}]

// matchorder entry
matchResult = match(buyOrdersInMatch, sellOrdersInMatch, 0);
console.log(matchResult)
if (matchResult.price <= 0 || matchResult.amount <= 0) {
    console.log('fuck!');
  }