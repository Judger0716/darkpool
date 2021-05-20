/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');
const TokenERC20Contract = require('./tokenERC20.js');

const version_key = 'CurrentVersion'
const candidate_key = 'CurrentCandidate'

class Committee extends Contract {
  constructor() {
    super('Committee');
  }

  async apply(ctx, amount) {
    // let token_contract = new TokenERC20Contract();

    const applicant = await ctx.clientIdentity.getID();
    // const balance = await token_contract.BalanceOf(ctx, applicant);
    // const balance = await ctx.stub.invokeChaincode("contract", ["BalanceOf", applicant])

    if (balance <= amount) {
      throw new Error('Balance not enough');
    } else {
      //if(token_contract.TransferFrom(ctx, applicant, "Committee", amount)) {
      const candidate = await ctx.stub.getState(candidate_key)
      if (!candidate) {
        candidate = [applicant]
      } else {
        candidate = [...JSON.parse(candidate), applicant]
      }
      await ctx.stub.putState(JSON.stringify(candidate))

      return true
    }
  }

  async get_candidate(ctx) {
    const candidate = await ctx.stub.getState(candidate_key)
    if (!candidate) {
      return []
    } else {
      return JSON.parse(candidate)
    }
  }

}

module.exports = Committee;