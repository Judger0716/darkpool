/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const tokenERC20Contract = require('./tokenERC20.js');

class Dogecoin extends tokenERC20Contract {
  constructor() {
    // Unique namespace when multiple contracts per chaincode file
    super('Dogecoin', 'DOGE', '6');
  }
  /**
   * Return the name of the token - e.g. "MyToken".
   * The original function name is `name` in ERC20 specification.
   * However, 'name' conflicts with a parameter `name` in `Contract` class.
   * As a work around, we use `TokenName` as an alternative function name.
   *
   * @param {Context} ctx the transaction context
   * @returns {String} Returns the name of the token
  */
  async TokenName(ctx) {
    return super.TokenName(ctx);
  }

  /**
   * Return the symbol of the token. E.g. “HIX”.
   *
   * @param {Context} ctx the transaction context
   * @returns {String} Returns the symbol of the token
  */
  async Symbol(ctx) {
    return super.Symbol(ctx);
  }

  /**
   * Return the number of decimals the token uses
   * e.g. 8, means to divide the token amount by 100000000 to get its user representation.
   *
   * @param {Context} ctx the transaction context
   * @returns {Number} Returns the number of decimals
  */
  async Decimals(ctx) {
    return super.Decimals(ctx);
  }

  /**
   * Return the total token supply.
   *
   * @param {Context} ctx the transaction context
   * @returns {Number} Returns the total token supply
  */
  async TotalSupply(ctx) {
    return super.TotalSupply(ctx);
  }

  /**
   * BalanceOf returns the balance of the given account.
   *
   * @param {Context} ctx the transaction context
   * @param {String} owner The owner from which the balance will be retrieved
   * @returns {Number} Returns the account balance
   */
  async BalanceOf(ctx, owner) {
    return super.BalanceOf(ctx, owner);
  }

  /**
   *  Transfer transfers tokens from client account to recipient account.
   *  recipient account must be a valid clientID as returned by the ClientAccountID() function.
   *
   * @param {Context} ctx the transaction context
   * @param {String} to The recipient
   * @param {Integer} value The amount of token to be transferred
   * @returns {Boolean} Return whether the transfer was successful or not
   */
  async Transfer(ctx, to, value) {
    return super.Transfer(ctx, to, value);
  }

  /**
  * Transfer `value` amount of tokens from `from` to `to`.
  *
  * @param {Context} ctx the transaction context
  * @param {String} from The sender
  * @param {String} to The recipient
  * @param {Integer} value The amount of token to be transferred
  * @returns {Boolean} Return whether the transfer was successful or not
  */
  async TransferFrom(ctx, from, to, value) {
    return super.TransferFrom(ctx, from, to, value);
  }

  /**
   * Allows `spender` to spend `value` amount of tokens from the owner.
   *
   * @param {Context} ctx the transaction context
   * @param {String} spender The spender
   * @param {Integer} value The amount of tokens to be approved for transfer
   * @returns {Boolean} Return whether the approval was successful or not
   */
  async Approve(ctx, spender, value) {
    return super.Approve(ctx, spender, value);
  }

  /**
   * Returns the amount of tokens which `spender` is allowed to withdraw from `owner`.
   *
   * @param {Context} ctx the transaction context
   * @param {String} owner The owner of tokens
   * @param {String} spender The spender who are able to transfer the tokens
   * @returns {Number} Return the amount of remaining tokens allowed to spent
   */
  async Allowance(ctx, owner, spender) {
    return super.Allowance(ctx, owner, spender);
  }

  // ================== Extended Functions ==========================

  /**
   * Set optional infomation for a token.
   *
   * @param {Context} ctx the transaction context
   * @param {String} name The name of the token
   * @param {String} symbol The symbol of the token
   * @param {String} decimals The decimals of the token
   * @param {String} totalSupply The totalSupply of the token
   */
  async SetOption(ctx, name, symbol, decimals) {
    return super.SetOption(ctx, name, symbol, decimals);
  }

  /**
   * Mint creates new tokens and adds them to minter's account balance
   *
   * @param {Context} ctx the transaction context
   * @param {Integer} amount amount of tokens to be minted
   * @returns {Object} The balance
   */
  async Mint(ctx, amount) {
    return super.Mint(ctx, amount);
  }

  /**
   * Freeze spender's balance.
   *
   * @param {Context} ctx the transaction context
   * @param {String} spender The spender who's balance will be freezed.
   * @param {Integer} amount amount of tokens to be minted
   * @returns {Object} The balance
   */
  async Freeze(ctx, amount) {
    return super.Freeze(ctx, amount);
  }

  async GetFreezedBalance(ctx, spender) {
    return super.GetFreezedBalance(ctx, spender);
  }

  async Unfreeze(ctx, amount) {
    return super.Unfreeze(ctx, amount);
  }

  /**
   * Burn redeem tokens from minter's account balance
   *
   * @param {Context} ctx the transaction context
   * @param {Integer} amount amount of tokens to be burned
   * @returns {Object} The balance
   */
  async Burn(ctx, amount) {
    return super.Burn(ctx, amount);
  }

  /**
   * ClientAccountBalance returns the balance of the requesting client's account.
   *
   * @param {Context} ctx the transaction context
   * @returns {Number} Returns the account balance
   */
  async ClientAccountBalance(ctx) {
    return super.ClientAccountBalance(ctx);
  }

  // ClientAccountID returns the id of the requesting client's account.
  // In this implementation, the client account ID is the clientId itself.
  // Users can use this function to get their own account id, which they can then give to others as the payment address
  async ClientAccountID(ctx) {
    return super.ClientAccountID(ctx);
  }
}

module.exports = Dogecoin;
