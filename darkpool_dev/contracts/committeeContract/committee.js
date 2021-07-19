/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');
// const tokenERC20Contract = require('./tokenERC20.js');

const memberPayThreshold = 0;
const minCommitteeMembers = 3;
const committeeKey = 'Committee';
const versionKey = 'CurrentVersion';
const candidateKey = 'CurrentCandidate';

class Committee extends Contract {
  constructor() {
    super('Committee');
  }

  async Init(ctx) {
    // Set init version
    await ctx.stub.putState(versionKey, Buffer.from("0"));
  }

  async GetCurrentVersion(ctx) {
    let version = await ctx.stub.getState(versionKey);
    if (!version || version.length === 0) {
      return "0";
    }
    return version.toString();
  }

  async Apply(ctx, amount) {
    const applicant = await ctx.clientIdentity.getID();
    const _applicant = applicant.toString();

    let balance = await ctx.stub.invokeChaincode("tokenContract", ["BalanceOf", _applicant]);

    balance = parseInt(balance.payload.toString());
    const _amount = parseInt(amount);

    // Get current applicants
    let candidates = await ctx.stub.getState(candidateKey)
    if (!candidates || candidates.length === 0) {
      candidates = [];
    } else {
      candidates = JSON.parse(candidates.toString());
    }


    // Check Balance 
    if (balance < _amount || _amount < memberPayThreshold)
      throw new Error(`Balance: ${balance} is not enough or amount: ${amount} is less than ${memberPayThreshold}.`);

    // let tokenObject = new tokenERC20Contract()

    // Try to pay for application.
    const pay_result = await ctx.stub.invokeChaincode("tokenContract", ["Freeze", amount]);
    // let pay_result = tokenObject._freeze(ctx, _applicant, amount);

    // Pay success, add to candidates.
    if (pay_result.payload.toString() === "true") {
      let exist = false;
      // Traverse the array to check if the applicant already in candidates.
      // If so, add its amount.
      for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].name === _applicant) {
          candidates[i].amount += _amount;
          exist = true;
          break;
        }
      }
      // If not, add him to the candidates.
      if (!exist)
        candidates = [...candidates, { name: _applicant, amount: _amount, cert: await this.GetCert(ctx), pub: await this.GetCreator(ctx) }];
      await ctx.stub.putState(candidateKey, JSON.stringify(candidates));

      return true;
    } else {
      // Fail to pay.
      throw new Error('Failed to pay');
    }
  }

  async GetCandidates(ctx) {
    const candidates = await ctx.stub.getState(candidateKey);
    if (!candidates || candidates.length === 0) {
      return JSON.stringify([]);
    } else {
      return candidates.toString();
    }
  }

  async GetCommittee(ctx) {
    const version = await this.GetCurrentVersion(ctx);
    const committeeCompositeKey = await ctx.stub.createCompositeKey(committeeKey, [version]);

    const committee = await ctx.stub.getState(committeeCompositeKey);
    if (!committee || committee.length === 0) {
      return JSON.stringify([]);
    } else {
      return committee.toString();
    }
  }
  //
  async FormCommittee(ctx) {
    const version = await this.GetCurrentVersion(ctx);
    // Check if there is enough candidates.
    let candidates = await ctx.stub.getState(candidateKey);
    if (!candidates || candidates.length === 0) {
      candidates = [];
    } else {
      candidates = JSON.parse(candidates.toString());
    }
    if (candidates.length < minCommitteeMembers) {
      return false;
    } else {
      candidates.sort(function (a, b) { return parseInt(b.amount) - parseInt(a.amount); });
    }
    let committeeMembers = candidates.slice(0, minCommitteeMembers);

    // 
    const committeeCompositeKey = await ctx.stub.createCompositeKey(committeeKey, [version]);
    await ctx.stub.putState(committeeCompositeKey, JSON.stringify(committeeMembers));

    // Tell Committee Members
    ctx.stub.setEvent('NewCommitteeMembers', Buffer.from(JSON.stringify(committeeMembers)));

    return true;
  }

  async GetCreator(ctx) {
    return await await ctx.clientIdentity.getAttributeValue("pubKey");
  }

  async GetCert(ctx) {
    return await ctx.stub.getCreator().idBytes.toString();
  }
}

module.exports = Committee;
