# turkserv

Turkserv is a [node.js](http://nodejs.org/) [Mechanical Turk](https://requester.mturk.com/) server layer.
The main purpose is to provide a framework for External Questions, but there are also some tools to replace parts of the AWS MT interface that are available via the [API](http://aws.amazon.com/mturk/).

## Installation

    git clone https://github.com/chbrown/turkserv.git
    cd turkserv
    npm install
    birdie
    grunt

## Suggested Configuration

* Use [nginx](http://nginx.org/) as a reverse-proxy and static file handler.
* Use [supervisord](http://supervisord.org/) to monitor and restart the process if it dies.

### nginx

`/etc/nginx/sites/turkserv` (e.g.):

    server {
      listen 80;
      server_name localhost;
      proxy_set_header X-Real-IP $remote_addr;
      gzip on;

      set $root /var/www/turkserv;
      location /static    { root $root; }
      location /templates { root $root; }
      location / { proxy_pass http://127.0.0.1:1451; }
    }

### supervisord

`/etc/supervisor.d/turkserv` (e.g.):

    [program:turkserv]
    directory=/var/www/turkserv
    command=/usr/local/bin/node turkserv.js
    user=chbrown

## post-receive hook for quick development

And just because Node and supervisord are so fast, kill the app when it needs to reload.

`~/git/turkserv.git/hooks/post-receive` (e.g.):

    #!/bin/sh
    cd /var/www/turkserv
    env -i git pull
    pkill -f turkserv.js

### Notes:

This repository should be at least served live from [http://turk.enron.me/]

http://www.fileformat.info/info/unicode/char/2639/index.htm,
http://www.fileformat.info/info/unicode/char/263a/index.htm

- Frown: &#9785;
- Smile: &#9786;

The two planes are Messerschmitts and Spitfires, particularly, models taken from the Google Sketchup marketplace and rendered with Kerkythea.

### A few queries for the database:

    var two_weeks_ago = new Date(new Date().getTime() - 14*24*60*60*1000);
    var priors = {};
    db.users.find({created: {$gt: two_weeks_ago}, $where: "this.responses.length == 100"}).forEach(function(user) {
      var prior = user.responses[0].prior;
      priors[prior] = (priors[prior] || 0) + 1;
    });

    db.users.find({created: {$gt: two_weeks_ago}}).sort({created: -1}).forEach(function(user) {
      var last = user.responses.length ? ' => ' + user.responses[0].prior : '';
      print(user.created + ' - ' + user.responses.length + ': ' + user._id + last);
    });

### Debug shortcut:

    // for (var x in _.range(47)) ;

    cd(frames[0]) // Firefox

    _.range(1, 7).forEach(function(i) {
      console.log('Shortening batch#', i);
      var scenes = batch_collection.get(i).scenes;
      scenes.remove(scenes.slice(3));
    });
    batch_collection.remove(batch_collection.slice(1));

    feedback_duration = 100

### Quick MD5

    var crypto = require('crypto');
    function md5(string) {
      var md5sum = crypto.createHash('md5');
      md5sum.update(string);
      return md5sum.digest('hex');
    }

#### Some other snippets:

    function repeat(item, count) {
      var list = [];
      for (var i = 0; i < count; i++)
        list.push(item);
      return list;
    }
    function extend(list, other_list) {
      return list.push.apply(list, other_list);
    }

#### Not yet relevant, since MTurk doesn't allow bonuses during incomplete assignments.

    if (unpaid >= unpaid_minimum) {
      var turk_client = mechturk_params.mechturk('sandbox', 'ut', {logger: logger});
      var params = {
        AssignmentId: fields.assignmentId,
        WorkerId: workerId,
        BonusAmount: new mechturk.models.Price(amount),
        Reason: 'Batch completion'
      };
      turk_client.GrantBonus(params, function(err, result) {
        if (err) {
          logger.error(err);
          res.json({success: false, message: 'Error awarding bonus. ' + err.toString()});
        }
        else {
          var result_string = util.inspect(result, {showHidden: true, depth: 5});
          logger.info('Bonus of ' + amount + ' granted to worker: ' + workerId + '. ' + result_string);
          user.set('paid', user.responses.length);
          user.save();
          res.json({success: true, message: 'Bonus awarded: $' + amount, amount: amount});
        }
      });

    }
    else {
      var message = 'Not yet eligible for bonus. Must answer at least ' + (unpaid_minimum - unpaid) + ' more hits.';
      res.json({success: false, message: message, unpaid: unpaid});
    }

## License

Copyright © 2011–2013 Christopher Brown. [MIT Licensed](LICENSE).
