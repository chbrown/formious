/*jslint browser: true */ /*globals app, p, toMap */

// app.service('Administrator', function($resource) {
//   return $resource('/api/administrators/:id', {
//     id: '@id',
//   });
// });

app.service('Templates', function($http, Cache) {
  // services are singletons, so we use this. to access its scope
  var self = this;

  Cache.get('templates', function() {
    return $http({method: 'GET', url: '/admin/templates.json'}).then(function(res) {
      return res.data.templates;
    });
  }).then(function(res) {
    self.all = res;
    self.lookup = toMap(self.all, 'id', 'name');
  }, function(res) {
    p('Error', res);
  });
});

app.service('Administrators', function($http, Cache) {
  var self = this;

  Cache.get('administrators', function() {
    return $http({method: 'GET', url: '/admin/administrators.json'}).then(function(res) {
      return res.data.administrators;
    });
  }).then(function(res) {
    self.all = res;
    self.lookup = toMap(self.all, 'id', 'email');
  }, function(res) {
    p('Error', res);
  });
});

app.service('AWS', function($http, Cache) {
  var self = this;
  this.hosts = [{name: 'deploy'}, {name: 'sandbox'}];

  Cache.get('aws', function() {
    return $http({method: 'GET', url: '/admin/aws.json'}).then(function(res) {
      return res.data.aws_accounts;
    });
  }).then(function(res) {
    self.all = res;
    self.lookup = toMap(self.all, 'id', 'name');
  }, function(res) {
    p('Error', res);
  });
});
