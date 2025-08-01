/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};
