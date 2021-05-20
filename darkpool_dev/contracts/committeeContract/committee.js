/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

const version_key = 'CurrentVersion';
const candidate_key = 'CurrentCandidate';

class Committee extends Contract {
  constructor() {
    super('Committee');
  }

  async Apply(ctx, amount) {
    const applicant = ctx.clientIdentity.getID();
    const _applicant = applicant.toString();

    let balance = await ctx.stub.invokeChaincode("tokenContract", ["BalanceOf", _applicant])

    balance = parseInt(balance.payload.toString())
    const _amount = parseInt(amount)

    // Get current applicants
    let candidates = await ctx.stub.getState(candidate_key)
    if (!candidates || candidates.length === 0) {
      candidates = []
    } else {
      candidates = JSON.parse(candidates.toString())
    }

    // Traverse the array to check if the applicant already in candidates.
    if (candidates.some(item => { if (item.name === _applicant) return true; })) {
      throw new Error(`User ${_applicant} already in candidates`);
    }

    // Check Balance 
    if (balance < _amount || _amount <= 0)
      throw new Error(`Balance: ${balance} is not enough or amount: ${amount} is less than 1.`);
    // Try to pay for application.
    const pay_result = await ctx.stub.invokeChaincode("tokenContract", ["Transfer", "committeeContract", amount])

    // Pay success, add to candidates.
    if (pay_result.payload.toString() === "true") {
      candidates = [...candidates, { name: _applicant, amount: _amount }]
      await ctx.stub.putState(candidate_key, JSON.stringify(candidates))
      return true
    } else {
      // Fail to pay.
      throw new Error('Failed to pay');
    }
  }

  async GetCandidates(ctx) {
    const candidates = await ctx.stub.getState(candidate_key)
    if (!candidates || candidates.length === 0) {
      return JSON.stringify([])
    } else {
      return candidates.toString()
    }
  }

}

module.exports = Committee;