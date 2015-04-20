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

app.service('Stim', function($resource) {
  // map: {'id': 'name'}
  var Stim = $resource('/api/experiments/:experiment_id/stims/:id', {
    experiment_id: '@experiment_id',
    id: '@id',
  });

  return Stim;
});

app.service('Template', function($resource) {
  // map: {'id': 'name'}
  var Template = $resource('/api/templates/:id', {
    id: '@id',
  }, {
    // query: {method: 'GET', isArray: true, cache: true},
  });

  Template.findOrCreate = function(name) {
    // query just return a naked promise?
    var templates = this.query();
    return templates.$promise.then(function() {
      var template = _.findWhere(templates, {name: name});
      return template ? template : new Template({name: name}).$save();
    });
  };

  return Template;
});
