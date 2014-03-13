/*jslint browser: true */ /*globals _, angular, app, p, toMap, time */

app.service('Cache', function($q, $localStorage) {
  var cache = $localStorage.$default({cache: {}}).cache;
  // 1 hour expiration
  var max_age = 60*60*1000;

  this.get = function(key, fetchFunction) {
    // key is some string that refers to a cache wrapper object:
    //   $localStorage.cache[key] = {fetched: Date, value: ...}
    // fetchFunction will never get called unless the cached value is missing or stale
    var fetched = (cache[key] === undefined) ? 0 : cache[key].fetched;
    if (time() - fetched > max_age) {
      // fetch and cache
      // fetchFunction() will return something like an $http with successes filtered to a single value
      return fetchFunction().then(function(res) {
        cache[key] = {
          fetched: time(),
          value: res,
        };
      });
    }
    else {
      // resolvable immediately
      var deferred = $q.defer();
      deferred.resolve(cache[key].value);
      return deferred.promise;
    }
  };
});

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
    // self.lookup = toMap(self.all, 'id', 'name');
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
    self.accounts = res;
  }, function(res) {
    p('Error', res);
  });
});
