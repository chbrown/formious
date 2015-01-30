/*jslint browser: true */ /*globals _, angular, Url, p, toMap, time */

var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
]);

app.directive('tbodyMap', function() {
  return {
    restrict: 'A',
    template: '<tr ng-repeat="(key, val) in object">' +
                '<td ng-bind="key"></td><td ng-bind="val"></td>' +
              '</tr>',
    // replace: true,
    scope: {
      object: '=tbodyMap',
    },
  };
});

app.filter('valueWhere', function() {
  return function(list, predicate, prop) {
    var match = _.findWhere(list, predicate);
    if (match) {
      return match[prop];
    }
  };
});

// app.directive('administrator', function(Administrator) {
//   return {
//     restrict: 'E',
//     template: '<span ng-bind="administrator.email"></span>',
//     scope: {
//       id: '=',
//     },
//     link: function(scope, el, attrs) {
//       var administrators = Administrator.query(function() {
//         scope.administrator = _.findWhere(administrators, {id: scope.id});
//       });
//     }
//   };
// });

app.service('Cache', function($q, $localStorage) {
  var cache = $localStorage.$default({cache: {}}).cache;
  // 1 hour expiration
  var max_age = 60*60*1000;

  this.get = function(key, fetchFunction) {
    // key is some string that refers to a cache wrapper object:
    //   $localStorage.cache[key] = {fetched: Date, value: ...}
    // fetchFunction will never get called unless the cached value is missing or stale
    var fetched = (cache[key] === undefined) ? 0 : cache[key].fetched;
    var now = new Date().getTime();
    if (now - fetched > max_age) {
      // fetch and cache
      // fetchFunction() will return something like an $http with successes filtered to a single value
      return fetchFunction().then(function(res) {
        cache[key] = {
          fetched: now,
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

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $urlRouterProvider.otherwise(function($injector, $location) {
    var url = $location.url();
    console.log('otherwise: $location.url() = %s', url);
    // window.location = url;
    // if (url.match(/^\/api/)) {
    //   // TODO: is there a better way to leave ui-router control than with window.location ?
    //   window.location = url;
    // }
    // return '/annotate';
    // if (!unmatched_path.match(/^\/admin/)) {}
  });

  $stateProvider
  .state('admin', {
    url: '/admin',
    templateUrl: '/ng/admin/layout.html',
    abstract: true,
  })
  // access_tokens
  .state('admin.accessTokensTable', {
    url: '/access_tokens',
    templateUrl: '/ng/admin/access_tokens/all.html',
  })
  .state('admin.accessTokenEdit', {
    url: '/access_tokens/:id',
    templateUrl: '/ng/admin/access_tokens/one.html',
  })
  // administrators
  .state('admin.administratorsTable', {
    url: '/administrators',
    templateUrl: '/ng/admin/administrators/all.html',
  })
  .state('admin.administratorEdit', {
    url: '/administrators/:id',
    templateUrl: '/ng/admin/administrators/one.html',
  })
  // aws_accounts
  .state('admin.awsAccountsTable', {
    url: '/aws_accounts',
    templateUrl: '/ng/admin/aws_accounts/all.html',
  })
  .state('admin.awsAccountEdit', {
    url: '/aws_accounts/:id',
    templateUrl: '/ng/admin/aws_accounts/one.html',
  })
  // experiments
  .state('admin.experimentsTable', {
    url: '/experiments',
    templateUrl: '/ng/admin/experiments/all.html',
  })
  .state('admin.experimentEdit', {
    url: '/experiments/:id',
    templateUrl: '/ng/admin/experiments/one.html',
  })
  // stims
  .state('admin.experiments.Stim', {
    url: '/experiments/:experiment_id/stims/:id',
    templateUrl: '/ng/admin/experiments/stims/one.html',
  })
  // mturk
  .state('admin.mturk', {
    url: '/mturk',
    templateUrl: '/ng/admin/mturk/layout.html',
    abstract: true,
  })
  .state('admin.mturk.hitsTable', {
    url: '/HITs?aws_account_id&host',
    templateUrl: '/ng/admin/mturk/HITs/all.html',
  })
  .state('admin.mturk.hitCreate', {
    url: '/HITs/new?aws_account_id&host',
    templateUrl: '/ng/admin/mturk/HITs/new.html',
  })
  .state('admin.mturk.hitEdit', {
    url: '/HITs/:HITId?aws_account_id&host',
    templateUrl: '/ng/admin/mturk/HITs/one.html',
  })
  // templates
  .state('admin.templatesTable', {
    url: '/templates',
    templateUrl: '/ng/admin/templates/all.html',
  })
  .state('admin.templateEdit', {
    url: '/templates/:id',
    templateUrl: '/ng/admin/templates/one.html',
  });

  // configure html5 ?
  $locationProvider.html5Mode(true);
});
