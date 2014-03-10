# human

Human is a [node.js](http://nodejs.org/) experiment server. It fills a niche somewhere above Google Forms, SurveyMonkey, or Qualtrics, but below a full-fledged web application. It provides an opinionated way of presenting stimuli to a participant, which requires more technical knowledge than the previously mentioned form services, but allows much greater flexibility in the construction and presentation of the form questions.

In particular, it was originally built to interface with [Amazon Mechanical Turk](https://requester.mturk.com/). In addition to serving as the backend for External Questions, it also provides an alternate interface to parts of the AWS MT interface available via the [API](http://aws.amazon.com/mturk/).


http://enron.me/


## Installation

    git clone https://github.com/chbrown/human.git
    cd human
    npm install


## Suggested Configuration

* Use [supervisord](http://supervisord.org/) to monitor and restart the process if it dies.

`/etc/supervisor.d/human` (e.g.):

    [program:human]
    directory=/www/human
    command=node server.js
    user=chbrown


## License

Copyright © 2011–2014 Christopher Brown. [MIT Licensed](LICENSE).
