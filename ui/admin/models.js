/*jslint browser: true */ /*globals _, app */

app.service('AccessToken', function($resource) {
  return $resource('/api/access_tokens/:id', {
    id: '@id',
  }, {
    generate: {
      method: 'POST',
      url: '/api/access_tokens/generate',
    }
  });
});

app.service('Administrator', function($resource) {
  // map: {'id': 'email'}
  return $resource('/api/administrators/:id', {
    id: '@id',
  }, {
    query: {
      cache: true,
      isArray: true,
    }
  });
});

app.service('AWSAccount', function($resource) {
  // map: {'id': 'name'}
  return $resource('/api/aws_accounts/:id', {
    id: '@id',
  });
});

app.service('AWSAccountAdministrator', function($resource) {
  return $resource('/api/administrators/:administrator_id/aws_accounts/:aws_account_id', {
    administrator_id: '@administrator_id',
    aws_account_id: '@aws_account_id',
  });
});

app.service('Experiment', function($resource, AccessToken) {
  var Experiment = $resource('/api/experiments/:id', {
    id: '@id',
  });
  Experiment.prototype.generateAccessToken = function() {
    return AccessToken.generate({
      relation: 'experiments',
      id: this.id,
      length: 10,
    });
  };
  return Experiment;
});

app.service('Participant', function($resource) {
  return $resource('/api/participants/:id', {
    id: '@id',
  });
});

app.service('Response', function($resource) {
  return $resource('/api/responses/:id', {
    id: '@id',
  });
});

app.service('Stim', function($resource) {
  // map: {'id': 'name'}
  var Stim = $resource('/api/experiments/:experiment_id/stims/:id', {
    experiment_id: '@experiment_id',
    id: '@id',
  });

  return Stim;
});

app.service('Template', function($resource, $q) {
  // map: {'id': 'name'}
  var Template = $resource('/api/templates/:id', {
    id: '@id',
  }, {
    // query: {method: 'GET', isArray: true, cache: true},
  });

  /**
  If `context` has a template_id field, return an initialized (but not
  saturated) Template with `template_id` as the `id`. Otherwise fetch all the
  templates and find one where `name` == `context.template`; otherwise, create
  a new Template with {name: `context.template`} and return it.
  */
  Template.findOrCreate = function(context) {
    return $q(function(resolve, reject) {
      if (context.template_id !== undefined) {
        resolve(new Template({id: context.template_id}));
      }
      else {
        // presumably, context.template is the desired Template's name
        var templates = Template.query();
        templates.$promise.then(function() {
          var template = _.findWhere(templates, {name: context.template});
          return template ? template : new Template({name: name}).$save();
        }).then(resolve, reject);
      }
    });
  };

  return Template;
});
