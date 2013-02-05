var mongoose = require('mongoose'),
  db = mongoose.createConnection('localhost', 'turkserv');

var user_schema = new mongoose.Schema({
  _id: String, // AWS workerId
  created: {type: Date, "default": Date.now},
  seen: [String],
  responses: []
});

var User = db.model('User', user_schema);

module.exports.User = User;
