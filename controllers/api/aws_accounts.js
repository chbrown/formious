var _ = require('lodash');
var Router = require('regex-router');
var db = require('../../db');

var R = new Router();

var aws_accounts_columns = ['name', 'access_key_id', 'secret_access_key'];

/** GET /api/aws_accounts
List all AWS accounts. */
R.get(/^\/api\/aws_accounts$/, function(req, res) {
  db.Select('aws_accounts')
  .orderBy('id ASC')
  .execute(function(err, aws_accounts) {
    if (err) return res.die(err);
    res.json(aws_accounts);
  });
});

/** GET /api/aws_accounts/new
Generate blank AWS account. */
R.get(/^\/api\/aws_accounts\/new$/, function(req, res) {
  res.json({});
});

/** POST /api/aws_accounts
Create new AWS account. */
R.post(/^\/api\/aws_accounts$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, aws_accounts_columns);

    db.Insert('aws_accounts')
    .set(fields)
    .returning('*')
    .execute(function(err, rows) {
      if (err) return res.die(err);
      res.status(201).json(rows[0]);
    });
  });
});

/** GET /api/aws_accounts/:id
Show existing AWS account. */
R.get(/^\/api\/aws_accounts\/(\d+)$/, function(req, res, m) {
  db.SelectOne('aws_accounts')
  .whereEqual({id: m[1]})
  .execute(function(err, aws_account) {
    if (err) return res.die(err);
    res.json(aws_account);
  });
});

/** POST /api/aws_accounts/:id
Update existing AWS account. */
R.post(/^\/api\/aws_accounts\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, aws_accounts_columns);

    db.Update('aws_accounts')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.die(err);
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/aws_accounts/:id
Delete AWS account. */
R.delete(/^\/api\/aws_accounts\/(\d+)$/, function(req, res, m) {
  db.Delete('aws_accounts')
  .whereEqual({id: m[1]})
  .execute(function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
