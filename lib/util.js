function randomString(length) {
  var store = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += store[Math.random() * store.length | 0];
  }
  return result;
}
exports.randomString = randomString;
