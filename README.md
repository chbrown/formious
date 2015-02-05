# formious

Formious is a [node.js](http://nodejs.org/) experiment server. It fills a niche somewhere above Google Forms, SurveyMonkey, or Qualtrics, but below a full-fledged web application. It provides an opinionated way of presenting stimuli to a participant, which requires more technical knowledge than the previously mentioned form services, but allows much greater flexibility in the construction and presentation of the form questions.

In particular, it was originally built to interface with [Amazon Mechanical Turk](https://requester.mturk.com/). In addition to serving as the backend for External Questions, it also provides an alternate interface to parts of the AWS MT interface available via the [API](http://aws.amazon.com/mturk/).


http://enron.me/


## Installation

    git clone https://github.com/chbrown/formious.git
    cd formious
    npm install


## Initialization

    dropdb formious; createdb formious; psql formious -f schema.sql


## Suggested Configuration

* Use [supervisord](http://supervisord.org/) to monitor and restart the process if it dies.

`/etc/supervisor.d/formious` (e.g.):

    [program:formious]
    directory=/www/formious
    command=node server.js
    user=chbrown


## Development

Debugging angular closures, this helps:

    scope = angular.element($('[ng-controller]')).scope()

## Controllers

All modules in `/controllers/**/*.js` should, for the most part, define only a single export:

```javascript
module.exports = function(req, res) {
  ...
}
```

E.g., `controllers/fancy.js` might look like this

```javascript
module.exports = function(req, res) {
  /** handle any requests for /fancy/*

  req is an http-enhanced version of the http.IncomingMessage object
  res is an http-enhanced version of the http.ServerResponse object

  Additionally:

  * req.url will be the full url ("/fancy/index", not just "/index")
  */
  ...
  res.end();
};
```

And, heck, while we're making arbitrary rules, let's say that this export should go at the bottom.


## Deployment


docker run –name my_postgres -d -v /var/docker/pwd/volumes/data:/var/lib/postgresql/data postgres


    docker run -d --name db -p 127.0.0.1:5432:5432 -v /var/db:/var/lib/postgresql/data postgres:9.3
    docker run -d --name app --link db:db -p 1451:80 chbrown/typing-evaluation


## License

Copyright 2011–2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
