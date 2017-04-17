# formious

Formious is a [node.js](http://nodejs.org/) experiment server. It fills a niche somewhere above Google Forms, SurveyMonkey, or Qualtrics, but below a full-fledged web application. It provides an opinionated way of presenting stimuli to a participant, which requires more technical knowledge than the previously mentioned form services, but allows much greater flexibility in the construction and presentation of the form questions.

In particular, it was originally built to interface with [Amazon Mechanical Turk](https://requester.mturk.com/). In addition to serving as the backend for External Questions, it also provides an alternate interface to parts of the AWS MT interface available via the [API](http://aws.amazon.com/mturk/).


## Installation

    npm install -g formious
    formious

By default, the HTTP server listens on port `1451`.


## Cross-platform routing

Routes (URLs) are defined as a single `bidi` structure (a tree) in [`formious.routes/routes`](src/formious/routes.cljc),
for which all endpoints (leaves) are qualified keywords (qualified with the `formious.routes` namespace).

On the server side, we assign handlers to URLs via a mapping from the `:formious.routes/` keywords to ring handlers.
A ring handler is simply a function that takes a ring request and, synchronously, returns a ring response.

On the client side, it's a bit more complex, due to partial page loads, nested components, and ubiquitous asynchronousness.
Here, a URL corresponds to a couple things:
* one or more components
  - if more, they will be nested, where the lefter ones will be fed in the result of the righter ones as the first argument.
  - the rightmost (or only) component needs to know where it gets its data
* one or more functions that are responsible for fetching the data and updating the global state.
  - each one of these is handed:
    + route information
    + a sort of callback function that can be called multiple times with incrementally updated state.

Questions:
* should the components ever be called directly by the router?
  or only triggered via the global state changes as the fetching function(s) update it?


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

To update, pull the latest image and remove the running container:

    docker pull chbrown/formious && docker rm -f app

Then enter the same `docker run` command as before.

Update, stop, and redeploy all in one go:

    docker pull chbrown/formious && \
      docker rm -f app && \
      docker run -d -e VIRTUAL_HOST=formious.com --link db:db --restart always --name app chbrown/formious


## License

Copyright 2011-2016 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2011-2016).
