/*jslint node: true */
var _ = require('underscore');
var async = require('async');
var child_process = require('child_process');
var logger = require('loge');
var mongodb = require('mongodb');
var path = require('path');
var pg_db = require('./lib/db');
var sqlcmd = require('sqlcmd');


var mongo = function(callback) {
  return mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/turkserv', function(err, mongo_db) {
    if (err) throw err;
    callback(mongo_db);
  });
};

var cli = function(command, callback) {
  child_process.exec(command, function(err, stdout, stderr) {
    if (stdout) logger.info(stdout);
    if (stderr) logger.error(stderr);

    if (err) logger.error(err);
    callback(err);
  });
};

function convert_awsaccounts(callback) {
  /** {
    "__v" : 0,
    "_id" : "UT1",
    "accessKeyId" : "AKasd98q98213",
    "secretAccessKey" : "asdas9das98da9s8d9as8u9dsa98sd8s",
    "created" : ISODate("2013-06-13T11:04:14.892Z")
  } */
  mongo(function(mongo_db) {
    mongo_db.collection('awsaccounts').find().toArray(function(err, awsaccounts) {
      if (err) return callback(err);
      console.log('Converting %d awsaccounts', awsaccounts.length);
      async.each(awsaccounts, function(awsaccount, callback) {
        new sqlcmd.Insert({table: 'aws_accounts'})
          .set({
            name: awsaccount._id,
            access_key_id: awsaccount.accessKeyId,
            secret_access_key: awsaccount.secretAccessKey,
            created: awsaccount.created,
          }).execute(pg_db, callback);
      }, callback);
    });
  });
}


function convert_stimtemplates(callback) {
  mongo(function(mongo_db) {
    mongo_db.collection('stimtemplates').find().toArray(function(err, stimtemplates) {
      if (err) return callback(err);
      console.log('Converting %d stimtemplates', stimtemplates.length);
      async.each(stimtemplates, function(stimtemplate, callback) {
        new sqlcmd.Insert({table: 'templates'})
          .set({
            name: stimtemplate._id,
            html: stimtemplate.html,
            created: stimtemplate.created,
          }).execute(pg_db, callback);
      }, callback);
    });
  });
}

function add_tickets(tickets, user_id, created, callback) {
  async.each(tickets, function(ticket, callback) {
    new sqlcmd.Insert({table: 'tickets'})
      .setIf({
        key: ticket,
        user_id: user_id,
        created: created,
      }).execute(pg_db, callback);
  }, callback);
}

function add_participant(user, callback) {
  console.log('adding participant %j with %d responses', _.omit(user, 'responses'), user.responses.length);

  new sqlcmd.Insert({table: 'participants'})
  .setIf({
    name: user._id,
    aws_bonus_paid: user.bonus_paid,
    aws_bonus_owed: user.bonus_owed,
    created: user.created,
  }).execute(pg_db, function(err, rows) {
    if (err) return callback(err);

    var participant_id = rows[0].id;

    // only save superusers' tickets
    // add_tickets(user.tickets, participant_id, user.created, function(err) {});

    // don't forget the responses!
    var responses = user.responses.filter(function(response) {
      return response.stimlist;
    });
    async.each(responses, function(response, callback) {
      var value = _.omit(response, 'created', 'workerId', 'host');
      new sqlcmd.Insert({table: 'responses'})
        .set({
          participant_id: participant_id,
          value: value,
          created: response.created
        }).execute(pg_db, callback);
    }, callback);
  });
}

function add_administrator(user, callback) {
  console.log('adding administrator', _.omit(user, 'responses'));

  new sqlcmd.Insert({table: 'administrators'})
  .setIf({
    // name: user._id,
    email: user.email,
    password: user.password,
    created: user.created,
  }).execute(pg_db, function(err, rows) {
    if (err) return callback(err);

    var administrator_id = rows[0].id;

    add_tickets(user.tickets, administrator_id, user.created, callback);
  });
}

function convert_users(callback) {
  mongo(function(mongo_db) {
    mongo_db.collection('users').find().toArray(function(err, users) {
      if (err) return callback(err);

      console.log('Converting %d users', users.length);
      async.each(users, function(user, callback) {
        async.parallel([
          function(callback) {
            add_participant(user, callback);
          },
          function(callback) {
            if (user.email && user.superuser) {
              add_administrator(user, callback);
            }
            else {
              callback();
            }
          },
        ], callback);
      }, callback);
    });
  });
}

function main() {
  async.series([
    function(callback) {
      cli('dropdb human', function(err) {
        // absorb the error
        callback();
      });
    },
    function(callback) {
      cli('createdb human', callback);
    },
    function(callback) {
      var schema_sql = path.join(__dirname, 'schema.sql');
      cli('psql human -f ' + schema_sql, callback);
    },
    function(callback) {
      convert_awsaccounts(callback);
    },
    function(callback) {
      convert_stimtemplates(callback);
    },
    function(callback) {
      convert_users(callback);
    },
  ], function(err, results) {
    if (err) logger.error(err);

    console.log('exiting');
  });
}

main();
