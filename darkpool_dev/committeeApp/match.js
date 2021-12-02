/*
 * Store decrypted orders
 *
 * id: order_id (bind with matching orders).
 * type: type (order type).
 * price: price (price for matching).
 * amount: amount (amount for matching).
 * time: create_time.seconds (timestamp).
 */
function countInArr(arr, num) {
  return arr.reduce(function (p, c) {
    return p + (c === num)
  }, 0)
}

function match(buyOrders, sellOrders, referencePrice) {
  let buy_price = [], buy_amount = [], sell_price = [], sell_amount = [];

  for (let o of buyOrders) {
    buy_price.push(o.price);
    buy_amount.push(o.amount);
  }

  for (let o of sellOrders) {
    sell_price.push(o.price);
    sell_amount.push(o.amount);
  }

  let all_price = new Set(buy_price.concat(sell_price));
  all_price = [...all_price.values()].sort();
  // print all_price
  console.log(all_price)

  let buy_sum = [], sell_sum = [], execution = [], imbalance = [];

  for (let p of all_price) {
    let sum = 0;
    buy_amount.forEach(function (v, i) {
      if (buy_price[i] >= p) {
        sum += v;
      }
    });
    buy_sum.push(sum);
  }

  for (let p of all_price) {
    let sum = 0;
    sell_amount.forEach(function (v, i, a) {
      if (sell_price[i] <= p) {
        sum += v;
      }
    });
    sell_sum.push(sum);
  }

  all_price.forEach(function (v, i) {
    execution.push(Math.min(buy_sum[i], sell_sum[i]));
    imbalance.push(buy_sum[i] - sell_sum[i]);
  })

  // print
  console.log('buy_sum:',buy_sum)
  console.log('sell_sum:',sell_sum)
  console.log('execution:',execution)
  console.log('imbalance:',imbalance)

  if (Math.max(...buy_price) < Math.min(...sell_price)) {
    return {
      price: 0,
      amount: 0
    }
  } else {
    let m_price = 0;
    let max_execution = Math.max(...execution);
    let num_max_execution = countInArr(execution, max_execution);

    if (num_max_execution === 1) {
      m_price = all_price[execution.indexOf(max_execution)];
    } else {
      let me_imbalance = [];
      execution.forEach(function (v, i) {
        if (v === max_execution) {
          me_imbalance.push(Math.abs(imbalance[i]));
        }
      })

      let min_me_imbalance = Math.min(...me_imbalance);
      let num_min_abs_imbalance = countInArr(me_imbalance, min_me_imbalance);

      if (num_min_abs_imbalance === 1) {
        let match_index = 0;
        execution.forEach(function (v, i) {
          if (v === max_execution && Math.abs(imbalance[i]) === min_me_imbalance) {
            match_index = i;
          }
        })
        m_price = all_price[match_index];
      } else {
        let match_index = [];
        execution.forEach(function (v, i) {
          if (v === max_execution && Math.abs(imbalance[i]) === min_me_imbalance) {
            match_index.push(i);
          }
        })

        let up0_imbalance = match_index.length === match_index.reduce(function (p, c) {
          return p + (imbalance[c] > 0);
        }, 0)

        let below0_imbalance = match_index.length === match_index.reduce(function (p, c) {
          return p + (imbalance[c] < 0);
        }, 0)

        let weight = 1;
        if (up0_imbalance) {
          weight = 1.05;
        } else if (below0_imbalance) {
          weight = 0.95;
        }

        let up_ref_price = match_index.length === match_index.reduce(function (p, c) {
          return p + (all_price[c] > (referencePrice * weight));
        }, 0);

        let below_ref_price = match_index.length === match_index.reduce(function (p, c) {
          return p + (all_price[c] < (referencePrice * weight));
        }, 0);

        if (up_ref_price) {
          m_price = match_index.reduce(function (p, c) {
            return Math.min(all_price[match_index[c]], p)
          }, all_price[match_index[0]]);
        } else if (below_ref_price) {
          m_price = match_index.reduce(function (p, c) {
            return Math.max(all_price[match_index[c]], p)
          }, all_price[match_index[0]]);
        } else {
          m_price = referencePrice * weight;
        }
      }
    }

    return {
      price: m_price,
      amount: max_execution
    }
  }

}

module.exports = match;
