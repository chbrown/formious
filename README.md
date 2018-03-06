# formious

Formious is a [node.js](http://nodejs.org/) experiment server. It fills a niche somewhere above Google Forms, SurveyMonkey, or Qualtrics, but below a full-fledged web application. It provides an opinionated way of presenting stimuli to a participant, which requires more technical knowledge than the previously mentioned form services, but allows much greater flexibility in the construction and presentation of the form questions.

In particular, it was originally built to interface with [Amazon Mechanical Turk](https://requester.mturk.com/). In addition to serving as the backend for External Questions, it also provides an alternate interface to parts of the AWS MT interface available via the [API](http://aws.amazon.com/mturk/).


## Installation

    npm install -g formious
    formious


## Deployment

We'll deploy to a Digital Ocean droplet.

    DIGITALOCEAN_ACCESS_TOKEN=6c4a0280d36dc219n0t4ctua11ymydigital0ceant0k3n9186729fe910b157bb
    docker-machine create -d digitalocean --digitalocean-region nyc3 --digitalocean-size 1gb formious

The `formious` application requires a PostgreSQL database.

    docker run -d --name db -p 127.0.0.1:15432:5432 \
      -v /var/docker/db:/var/lib/postgresql/data postgres:9.4

* the `-v` argument stores the data on the host machine so that we don't lose all our data if we accidentally remove or update the postgres container.
* the `-p` argument opens the database for access directly from the host machine, which makes backing up the data easier. E.g., if on Ubuntu, run `apt-get install postgresql-client` to get the appropriate tools, then run `pg_dump -h localhost -p 15432 -U postgres formious` to dump the database to `stdout`.

We'll use the handy [`jwilder/nginx-proxy`](https://github.com/jwilder/nginx-proxy) container to back-proxy HTTP(S) requests to the formious app.

    docker run -d -v /var/run/docker.sock:/tmp/docker.sock \
       -p 80:80 -p 443:443 --name nginx jwilder/nginx-proxy

This repo is automatically built as a docker container on Docker Hub at [`chbrown/formious`](https://registry.hub.docker.com/u/chbrown/formious/).

    docker run -d -e VIRTUAL_HOST=formious.com --link db:db \
      --restart always --name app chbrown/formious

* The `-e VIRTUAL_HOST=formious.com` argument tells nginx-proxy to forward `formious.com` requests to this container. You would use a different hostname here, since I own `formious.com`.
* The `--link db:db` exposes to the database container, named `db`, to the formious application, under the alias `db`.

To update, pull the latest image, remove the running container, then enter the same `docker run` command as above:

    docker pull chbrown/formious && \
      docker rm -f app && \
      docker run -d -e VIRTUAL_HOST=formious.com --link db:db \
        --restart always --name app chbrown/formious


## License

Copyright 2011–2015 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2011-2015).
