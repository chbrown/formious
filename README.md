# Installation

Get the repo and the [static-lib](https://github.com/chbrown/static-lib) submodule:

    git clone --recursive https://github.com/chbrown/turkserv.git

And install the Node dependencies:

    cd turkserv
    npm install

# Configuration

`Nginx` is used as a reverse-proxy and static file handler, and `supervisord` is used to monitor and restart the process.

## nginx

    server {
      listen 1450;
      server_name kl;
      proxy_set_header X-Real-IP $remote_addr;
      gzip on;

      set $turkserv /Users/chbrown/github/turkserv;

      location /static    { root $turkserv; }
      location /templates { root $turkserv; }
      location /lib       { root $turkserv/static; }
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
