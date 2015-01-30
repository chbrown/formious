/*jslint node: true */
var sqlorm = require('sqlorm');

var db = require('../db');

var AccessToken = sqlorm.createModel(db, 'access_tokens',
  ['token', 'relation', 'foreign_id', 'expires', 'redacted', 'created']);

var AWSAccount = sqlorm.createModel(db, 'aws_accounts',
  ['name', 'access_key_id', 'secret_access_key']);

var Experiment = sqlorm.createModel(db, 'experiments',
  ['name', 'administrator_id', 'html', 'parameters']);

var Template = sqlorm.createModel(db, 'templates',
  ['name', 'html']);

var Response = sqlorm.createModel(db, 'responses',
  ['participant_id', 'stim_id', 'value', 'assignment_id']);

module.exports = {
  AccessToken: require('./AccessToken'),
  Administrator: require('./Administrator'),
  AWSAccount: AWSAccount,
  Experiment: Experiment,
  Participant: require('./Participant'),
  Response: Response,
  Stim: require('./Stim'),
  Template: Template,
};
