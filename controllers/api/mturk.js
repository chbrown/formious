var url = require('url');
var Router = require('regex-router');
var turk = require('turk');

var db = require('../../db');

var R = new Router();

/** POST /api/mturk/?aws_account_id=number&environment='production'|'sandbox'

The querystring should contain the aws_account.id and the target MTurk environment.
`aws_account_id` indicates a record in the AWS Account table, which exposes the
AWS Access Key ID and AWS Secret Access Key

The POST should contain, minimally, an "Operation" field, indicating the MTurk
API operation to call.
*/
R.post(/^\/api\/mturk\?/, function(req, res) {
  var urlObj = url.parse(req.url, true);
  var aws_account_id = urlObj.query.aws_account_id || null;
  var environment = urlObj.query.environment == 'production' ? turk.Environment.production : turk.Environment.sandbox;

  req.readData(function(err, data) {
    if (err) return res.die(err);

    db.SelectOne('aws_accounts')
    .whereEqual({id: aws_account_id})
    .execute(function(err, aws_account) {
      if (err) return res.die(err);
      if (!aws_account) return res.die(new Error('AWS Account Not Found'));

      var account = new turk.Account(aws_account.access_key_id, aws_account.secret_access_key);
      var connection = account.createConnection(environment);

      connection.post(data, function(err, xml) {
        if (err) return res.die(err);
        res.setHeader('Content-Type', 'text/xml');
        res.end(xml);
      });
    });
  });
});

module.exports = R.route.bind(R);
