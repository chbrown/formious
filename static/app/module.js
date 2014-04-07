/*jslint browser: true, devel: true */ /*globals _, angular, Url, p, toMap, time, valueWhere */

var app = angular.module('app', ['ngResource', 'ngStorage', 'misc-js/angular-plugins']);

app.filter('valueWhere', function() {
  return valueWhere;
});

app.directive('nav', function($window) {
  // the most specific link inside each nav that matches
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      var window_pathname = $window.location.pathname;
      var anchors = element.find('a');
      // try for exact matches first
      var i, anchor;
      for (i = 0; (anchor = anchors[i]); i++) {
        if (window_pathname == anchor.pathname) {
          anchor.classList.add('current');
          return;
        }
      }
      // then for anchors with a prefix of the current url
      for (i = 0, anchor; (anchor = anchors[i]); i++) {
        if (window_pathname.indexOf(anchor.pathname) === 0) {
          anchor.classList.add('current');
          return;
        }
      }
    }
  };
});

app.directive('administrator', function(Administrator) {
  return {
    restrict: 'E',
    template: '<span ng-bind="administrator.email"></span>',
    scope: {
      id: '=',
    },
    link: function(scope, el, attrs) {
      var administrators = Administrator.query(function() {
        scope.administrator = _.findWhere(administrators, {id: scope.id});
      });
    }
  };
});

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
