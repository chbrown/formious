# Installation

Get the repo and the [static-lib](https://github.com/chbrown/static-lib) submodule:

    git clone --recursive https://github.com/chbrown/turkserv.git

And install the Node dependencies:

    cd turkserv
    npm install

To bring your submodules (static-lib) up to date:

    git submodule foreach git pull

# Configuration

`Nginx` is used as a reverse-proxy and static file handler, and `supervisord` is used to monitor and restart the process.

## nginx

    server {
      listen 1450;
      server_name kl;
      proxy_set_header X-Real-IP $remote_addr;
      gzip on;

      set $base /Users/chbrown/github/turkserv;

      location /static    { root $base; }
      location /templates { root $base; }
      location /lib       { root $base/static; }
      location / { proxy_pass http://127.0.0.1:1451; }
    }

## supervisord

    vim /etc/supervisor.d/turkserv.ini

    [program:turkserv]
    directory=/var/www/turkserv
    user=chbrown
    command=/usr/local/bin/node turkserv.js
    autorestart=true

## post-receive hook

And just because Node and supervisord are so fast, kill the app when it needs to reload.

    vim ~/git/turkserv.git/hooks/post-receive

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
})

feedback_duration = 100
