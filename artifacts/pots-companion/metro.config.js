if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function () { return this.slice().reverse(); },
    writable: true, configurable: true, enumerable: false,
  });
}
if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, 'toSorted', {
    value: function (compareFn) { return this.slice().sort(compareFn); },
    writable: true, configurable: true, enumerable: false,
  });
}
if (!Array.prototype.toSpliced) {
  Object.defineProperty(Array.prototype, 'toSpliced', {
    value: function (start, deleteCount) {
      var copy = this.slice();
      copy.splice.apply(copy, arguments);
      return copy;
    },
    writable: true, configurable: true, enumerable: false,
  });
}

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
