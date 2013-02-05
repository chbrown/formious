# Configuration

http://turk.enron.me/

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

    #!/bin/sh
    cd /var/www/turkserv
    env -i git pull

## Symbols:

http://www.fileformat.info/info/unicode/char/2639/index.htm,
http://www.fileformat.info/info/unicode/char/263a/index.htm

- Frown: &#9785;
- Smile: &#9786;

messerschmitt vs. spitfire
