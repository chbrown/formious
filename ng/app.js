/*jslint browser: true */ /*globals _, angular, Url */

var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
]);

var summarizeResponse = function(res) {
  var parts = [];
  if (res.status != 200) {
    parts.push('Error ');
  }
  parts.push(res.status);
  if (res.data) {
    parts.push(': ' + res.data.toString());
  }
  return parts.join('');
};

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

app.directive('jsonarea', function() {
  // mostly from github.com/chbrown/rfc6902 [gh-pages]
  // <jsonarea ng-model="stim.context" style="width: 600px; height: 200px"></jsonarea>
  return {
    restrict: 'E',
    template: '<div>' +
      '<textarea ng-model="raw" ng-change="change()" ng-blur="blur()" style="{{style}}"></textarea>' +
      '<div ng-if="model.$valid" class="valid">Valid JSON</div>' +
      '<div ng-if="model.$invalid" class="invalid">Invalid JSON: {{error}}</div>' +
    '</div>',
    scope: {
      style: '@style',
    },
    require: 'ngModel',
    replace: true,
    link: function(scope, el, attrs, ngModel) {
      scope.model = ngModel;

      // not sure why Angular decides to automatically transclude all the attributes when we say 'replace: true'
      el.attr({style: ''});

      // scope.raw.viewChangeListeners = [];
      scope.change = function() {
        ngModel.$setViewValue(scope.raw);
      };

      ngModel.$parsers = [function(string) {
        try {
          var obj = angular.fromJson(string);
          ngModel.$setValidity('jsonInvalid', true);
          return obj;
        }
        catch (exc) {
          scope.error = exc.message.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
          ngModel.$setValidity('jsonInvalid', false);
          // otherwise return the last valid value so that we don't lose the original
          return ngModel.$modelValue;
        }
      }];

      ngModel.$render = function() {
        // just set the textarea to the JSON, but only if the current raw value is valid JSON
        if (ngModel.$valid) {
          scope.raw = angular.toJson(ngModel.$modelValue, true);
        }
      };
    }
  };
});

/** readBinaryFile(file: File, callback: (error: Error, data?: Uint8Array))

File: a native browser File object, as provided by an input[type="file"]'s
files[i] property.
*/
function readBinaryFile(file, callback) {
  var reader = new FileReader();
  reader.onerror = function(error) {
    callback(error);
  };
  reader.onload = function(event) {
    var data = new Uint8Array(reader.result);
    // data is an arraybufferview as basic bytes / chars
    callback(null, data);
  };
  reader.readAsArrayBuffer(file);
}

/** parseTabularFile(file: File, callback: (error: Error, table?: object[]))

File: a native browser File object, as provided by an input[type="file"]'s
files[i] property.

This method will read the file's contents, send it via AJAX to the
/util/parseTable endpoint to be parsed as an Excel spreadsheet or CSV, as needed.
*/
function parseTabularFile(file, callback) {
  var file_name = file.name;
  var file_size = file.size;
  readBinaryFile(file, function(error, data) {
    if (error) return callback(error);

    // send excel data off to the server to parse
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/util/parse-table');
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('X-Filename', file.name);
    xhr.onerror = function(error) {
      callback(error);
    };
    xhr.onload = function(event) {
      if (xhr.status >= 300) {
        var error = new Error(xhr.responseText);
        return callback(error);
      }

      var body = xhr.responseText;
      var content_type = xhr.getResponseHeader('content-type');
      if (content_type.match(/application\/json/)) {
        body = JSON.parse(body);
      }
      callback(null, body);
    };
    xhr.send(data);
  });
}

/** parseTabularFile(file) => Promise<Error,object[]>

Wrap the non-Angular parseTabularFile function as a injectable that returns
a promise.
*/
app.factory('parseTabularFile', function($q) {
  return function(file) {
    return $q(function(resolve, reject) {
      parseTabularFile(file, function(err, data) {
        // split out typical async callback into reject/resolve calls:
        return err ? reject(err) : resolve(data);
      });
    });
  };
});

/** global listener for command+S keypresses

Broadcasts global "save" event and prevents the browser's default save action.
*/
app.run(function($rootScope) {
  document.addEventListener('keydown', function(ev) {
    if (ev.which == 83 && ev.metaKey) { // command+S
      ev.preventDefault();
      $rootScope.$broadcast('save');
    }
  });
});

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $urlRouterProvider.otherwise(function($injector, $location) {
    var url = $location.url();
    console.log('otherwise: $location.url() = %s', url);

    // TODO: is there a better way to leave ui-router control than with window.location ?
    window.location = '/admin/administrators/';
  });

  $stateProvider
  .state('admin', {
    url: '/admin',
    templateUrl: '/ng/admin/layout.html',
    abstract: true,
  })
  // access_tokens
  .state('admin.access_tokens', {
    url: '/access_tokens',
    templateUrl: '/ng/admin/access_tokens/all.html',
    abstract: true,
  })
  .state('admin.access_tokens.table', {
    url: '/',
    templateUrl: '/ng/admin/access_tokens/all.html',
    controller: 'admin.access_tokens.table',
  })
  .state('admin.access_tokens.edit', {
    url: '/:id',
    templateUrl: '/ng/admin/access_tokens/one.html',
    // controller: 'admin.access_tokens.edit',
  })
  // administrators
  .state('admin.administrators', {
    url: '/administrators',
    templateUrl: '/ng/admin/administrators/layout.html',
    abstract: true,
  })
  .state('admin.administrators.table', {
    url: '/',
    templateUrl: '/ng/admin/administrators/all.html',
    controller: 'admin.administrators.table',
  })
  .state('admin.administrators.edit', {
    url: '/:id',
    templateUrl: '/ng/admin/administrators/one.html',
    controller: 'admin.administrators.edit',
  })
  // aws_accounts
  .state('admin.aws_accounts', {
    url: '/aws_accounts',
    templateUrl: '/ng/admin/aws_accounts/layout.html',
    abstract: true,
  })
  .state('admin.aws_accounts.table', {
    url: '/',
    templateUrl: '/ng/admin/aws_accounts/all.html',
    controller: 'admin.aws_accounts.table',
  })
  .state('admin.aws_accounts.edit', {
    url: '/:id',
    templateUrl: '/ng/admin/aws_accounts/one.html',
    controller: 'admin.aws_accounts.edit',
  })
  // experiments
  .state('admin.experiments', {
    url: '/experiments',
    templateUrl: '/ng/admin/experiments/layout.html',
    abstract: true,
  })
  .state('admin.experiments.table', {
    url: '/',
    templateUrl: '/ng/admin/experiments/all.html',
    controller: 'admin.experiments.table',
  })
  .state('admin.experiments.edit', {
    url: '/:id',
    templateUrl: '/ng/admin/experiments/one.html',
    controller: 'admin.experiments.edit',
  })
  // stims
  .state('admin.experiments.stims.edit', {
    url: '/:experiment_id/stims/:id',
    templateUrl: '/ng/admin/experiments/stims/one.html',
    controller: 'stimEditCtrl',
  })
  // mturk
  .state('admin.mturk', {
    url: '/mturk',
    templateUrl: '/ng/admin/mturk/layout.html',
    controller: 'admin.mturk',
    abstract: true,
  })
  .state('admin.mturk.hits', {
    url: '/hits',
    templateUrl: '/ng/admin/mturk/hits/layout.html',
    abstract: true,
  })
  .state('admin.mturk.hits.table', {
    url: '/?aws_account_id&host',
    templateUrl: '/ng/admin/mturk/hits/all.html',
    controller: 'admin.mturk.hits.table',
  })
  .state('admin.mturk.hits.new', {
    url: '/new?aws_account_id&host',
    templateUrl: '/ng/admin/mturk/hits/new.html',
    controller: 'admin.mturk.hits.new',
  })
  .state('admin.mturk.hits.edit', {
    url: '/:HITId?aws_account_id&host',
    templateUrl: '/ng/admin/mturk/hits/one.html',
    controller: 'admin.mturk.hits.edit',
  })
  // templates
  .state('admin.templates', {
    url: '/templates',
    templateUrl: '/ng/admin/templates/layout.html',
    abstract: true,
  })
  .state('admin.templates.table', {
    url: '/',
    templateUrl: '/ng/admin/templates/all.html',
    controller: 'admin.templates.table',
  })
  .state('admin.templates.edit', {
    url: '/:id',
    templateUrl: '/ng/admin/templates/one.html',
    controller: 'admin.templates.edit',
  });

  // configure html5 ?
  $locationProvider.html5Mode(true);
});
