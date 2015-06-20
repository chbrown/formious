# formious

Formious is a [node.js](http://nodejs.org/) experiment server. It fills a niche somewhere above Google Forms, SurveyMonkey, or Qualtrics, but below a full-fledged web application. It provides an opinionated way of presenting stimuli to a participant, which requires more technical knowledge than the previously mentioned form services, but allows much greater flexibility in the construction and presentation of the form questions.

In particular, it was originally built to interface with [Amazon Mechanical Turk](https://requester.mturk.com/). In addition to serving as the backend for External Questions, it also provides an alternate interface to parts of the AWS MT interface available via the [API](http://aws.amazon.com/mturk/).


## Installation

    npm install -g formious
    formious


## Deployment

New docker images are automatically built on Docker Hub: [`chbrown/formious`](https://registry.hub.docker.com/u/chbrown/formious/)

Initial:

    docker run -d --name db -p 127.0.0.1:15432:5432 -v /var/docker/db:/var/lib/postgresql/data postgres:9.4
    docker run -d --name formious -h formious --link db:db -p 127.0.0.1:1451:80 --restart always chbrown/formious

Updating:

    docker pull chbrown/formious && \
      docker rm -f formious && \
      docker run -d --name formious -h formious --link db:db -p 127.0.0.1:1451:80 --restart always chbrown/formious


### Development

Pull the remote server's database into a local database:

    dropdb formious; createdb formious
    ssh -C semantics 'pg_dump -h localhost -p 15432 -U postgres formious' | psql formious


## License

Copyright 2011–2015 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2011-2015).
