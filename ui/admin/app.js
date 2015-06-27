/*jslint browser: true, esnext: true */

import _ from 'lodash';
import h from 'virtual-dom/h';
import {Url} from 'urlobject';

// angular.js libraries:
import angular from 'angular';
import 'angular-resource';
import 'angular-ui-router';
import 'ngstorage';
// angular modules
import 'flow-copy';
import 'checkbox-sequence';
import 'textarea';

// for the misc-js-plugins module below. TODO: factor out
import './misc-js-plugins';

export var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js-plugins', // TODO: factor this out
  'flow-copy', // exposes an EA 'fixedflow' directive
  'checkbox-sequence', // exposes an A 'checkbox-sequence' directive
  'textarea',
]);

function renderObject(object) {
  if (object === undefined) {
    return h('i.undefined', 'undefined');
  }
  else if (object === null) {
    return h('b.null', 'null');
  }
  else if (Array.isArray(object)) {
    // check for tabular arrays (all of the items are objects with the same keys)
    var items_are_objects = object.every(function(value) {
      return (value !== null) && (value !== undefined) && (typeof value === 'object');
    });
    if (object.length > 0 && items_are_objects) {
      // now check that all the keys are the same
      var columns = Object.keys(object[0]);
      var items_have_indentical_keys = object.slice(1).every(function(value) {
        return _.isEqual(Object.keys(value), columns);
      });
      if (items_have_indentical_keys) {
        var thead_children = h('tr', columns.map(function(column) {
          return h('th', column);
        }));
        var tbody_children = object.map(function(value) {
          var cells = columns.map(function(column) {
            return h('td', renderObject(value[column]));
          });
          return h('tr', cells);
        });
        return h('div.table', [
          h('table', [
            h('thead', thead_children),
            h('tbody', tbody_children),
          ])
        ]);
      }
    }
    // otherwise, it's an array of arbitrary objects
    var array_children = object.map(function(value) {
      return renderObject(value);
    });
    return h('div.array', array_children);
  }
  else if (typeof object === 'object') {
    var object_children = _.map(object, function(value, key) {
      return h('tr', [
        h('td', key), h('td', renderObject(value))
      ]);
    });
    return h('div.object', h('table.keyval', object_children));
  }
  else if (typeof object === 'number') {
    return h('b.number', object.toString());
  }
  else if (typeof object === 'boolean') {
    return h('b.boolean', object.toString());
  }
  return h('span.string', object.toString());
}

function summarizeResponse(res) {
  var parts = [];
  if (res.status != 200) {
    parts.push('Error ');
  }
  parts.push(res.status);
  if (res.data) {
    parts.push(': ' + res.data.toString());
  }
  return parts.join('');
}

app.directive('uiSrefActiveAny', function($state) {
  return {
    restrict: 'A',
    scope: {
      uiSrefActiveAny: '=',
    },
    link: function(scope, el) {
      var activeClasses = scope.uiSrefActiveAny;
      function updateSrefActiveAny() {
        for (var key in activeClasses) {
          var match = $state.includes(activeClasses[key]);
          el.toggleClass(key, match);
        }
      }
      scope.$on('$stateChangeSuccess', updateSrefActiveAny);
    }
  };
});

app.directive('object', function() {
  return {
    restrict: 'A',
    scope: {
      object: '=',
    },
    link: function(scope, el) {
      // var state = mercury.state({
      //   object: mercury.value(object),
      // });
      scope.$watch('object', function(newVal) {
        var object = angular.copy(newVal);

        throw new Error('[object] directive not yet implemented');
        // renderObject(object);
      });

      // mercury.app(el[0], state, function(state) {
      //   return renderObject(state.object);
      // });
    }
  };
});

app.filter('where', function() {
  return function(list, predicate) {
    return _.where(list, predicate);
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

app.filter('keys', function() {
  return function(object) {
    return Object.keys(object);
  };
});

/**
interface XHROptions {
  method: string;
  url: string;
  params: any;
  data?: any;
}

interface XMLResponse {
  config: XHROptions;
  data: Document;
  status: number;
  statusText: string;
}

xhr(options: XHROptions, callback: (error: Error, response?: XMLResponse) => void) { ... }

The 'Content-Type' header of the outgoing request will be set to
'application/json', and options.data will be serialized with JSON.stringify().
*/
function xhrXML(options,  callback) {
  var url = new Url({path: options.url, query: options.params}).toString();
  var xhr = new XMLHttpRequest();
  xhr.open(options.method, url);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onerror = function(error) {
    callback(error);
  };
  xhr.onload = function() {
    if (xhr.status >= 300) {
      var error = new Error(xhr.responseText);
      return callback(error);
    }
    // a 'Content-Type: text/xml' header in the response will prompt
    // XMLHttpRequest to automatically parse it into a Document instance.
    // we return a `response` object that's much like Angular's own $http
    // response object, except that we use that document as the `data` field.
    callback(null, {
      config: options,
      data: xhr.responseXML,
      status: xhr.status,
      statusText: xhr.statusText,
    });
  };
  xhr.send(JSON.stringify(options.data));
}

app.factory('$xml', function($q) {
  return function(options) {
    return $q(function(resolve, reject) {
      xhrXML(options, function(err, response) {
        return err ? reject(err) : resolve(response);
      });
    });
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
  // <jsonarea ng-model="block.context" style="width: 600px; height: 200px"></jsonarea>
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
  reader.onload = function() {
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
    xhr.onload = function() {
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

app.config(function($httpProvider) {
  // trying to inject $state here creates a circular dependency conflict, so
  // we have to emit an event and listen for it below, in app.run, where we can
  // inject $state
  $httpProvider.interceptors.push(function($q, $rootScope) {
    return {
      responseError: function(res) {
        if (res.status == 401) {
          $rootScope.$broadcast('unauthorized', res);
        }
        return $q.reject(res);
      },
    };
  });
});

/**
The global $http response interceptor broadcasts an "unauthorized" event on
$rootScope whenever a HTTP 401 status is returned from the server.

If multiple "unauthorized" events are broadcast, we only want to change
$state once, so we use $timeout to wait for the next digest. It'll still
be called as many times as there were errors at the same time, but they'll all
be 'to' the original state name (since it's scoped outside the $timeout).
*/
app.run(function($rootScope, $state, $flash, $timeout) {
  $rootScope.$on('unauthorized', function() {
    var to = $state.current.name;
    $timeout(function() {
      $state.go('admin.login', {to: to});
    });
  });
});

/**
global listener for command+S keypresses

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
  $urlRouterProvider.otherwise(function() {
    // the returned value should be a url expressed relative to the page's base[href]
    return 'admin/administrators/';
  });

  $stateProvider
  .state('admin', {
    url: '/admin',
    templateUrl: '/ui/admin/layout.html',
    abstract: true,
    // the admin controller handles login and logout actions
    controller: 'admin',
  })
  // login
  .state('admin.login', {
    url: '/login?to',
    templateUrl: '/ui/admin/login.html',
  })
  // access_tokens
  .state('admin.access_tokens', {
    url: '/access_tokens',
    templateUrl: '/ui/admin/access_tokens/layout.html',
    abstract: true,
  })
  .state('admin.access_tokens.table', {
    url: '/',
    templateUrl: '/ui/admin/access_tokens/all.html',
    controller: 'admin.access_tokens.table',
  })
  .state('admin.access_tokens.edit', {
    url: '/:access_token_id',
    templateUrl: '/ui/admin/access_tokens/one.html',
    controller: 'admin.access_tokens.edit',
  })
  // administrators
  .state('admin.administrators', {
    url: '/administrators',
    templateUrl: '/ui/admin/administrators/layout.html',
    abstract: true,
  })
  .state('admin.administrators.table', {
    url: '/',
    templateUrl: '/ui/admin/administrators/all.html',
    controller: 'admin.administrators.table',
  })
  .state('admin.administrators.edit', {
    url: '/:id',
    templateUrl: '/ui/admin/administrators/one.html',
    controller: 'admin.administrators.edit',
  })
  // aws_accounts
  .state('admin.aws_accounts', {
    url: '/aws_accounts',
    templateUrl: '/ui/admin/aws_accounts/layout.html',
    abstract: true,
  })
  .state('admin.aws_accounts.table', {
    url: '/',
    templateUrl: '/ui/admin/aws_accounts/all.html',
    controller: 'admin.aws_accounts.table',
  })
  .state('admin.aws_accounts.edit', {
    url: '/:id',
    templateUrl: '/ui/admin/aws_accounts/one.html',
    controller: 'admin.aws_accounts.edit',
  })
  // experiments
  .state('admin.experiments', {
    url: '/experiments',
    templateUrl: '/ui/admin/experiments/layout.html',
    abstract: true,
  })
  .state('admin.experiments.table', {
    url: '/',
    templateUrl: '/ui/admin/experiments/all.html',
    controller: 'admin.experiments.table',
  })
  .state('admin.experiments.edit', {
    url: '/:experiment_id',
    templateUrl: '/ui/admin/experiments/one.html',
    controller: 'admin.experiments.edit',
  })
  // experiments/blocks
  .state('admin.experiments.edit.blocks', {
    url: '/blocks',
    templateUrl: '/ui/admin/experiments/blocks/all.html',
    controller: 'admin.experiments.edit.blocks',
  })
  // .state('admin.experiments.edit.block', {
  //   url: '/blocks/:block_id',
  //   templateUrl: '/ui/admin/experiments/blocks/one.html',
  //   controller: 'admin.experiments.edit.block',
  // })
  // mturk
  .state('admin.mturk', {
    url: '/mturk/:environment/:aws_account_id',
    templateUrl: '/ui/admin/mturk/layout.html',
    controller: 'admin.mturk',
    abstract: true,
  })
  .state('admin.mturk.dashboard', {
    url: '/dashboard',
    templateUrl: '/ui/admin/mturk/dashboard.html',
    controller: 'admin.mturk.dashboard',
  })
  .state('admin.mturk.hits', {
    url: '/hits',
    templateUrl: '/ui/admin/mturk/hits/layout.html',
    abstract: true,
  })
  .state('admin.mturk.hits.table', {
    url: '/',
    templateUrl: '/ui/admin/mturk/hits/all.html',
    controller: 'admin.mturk.hits.table',
  })
  .state('admin.mturk.hits.new', {
    url: '/new?Title&ExternalURL',
    templateUrl: '/ui/admin/mturk/hits/new.html',
    controller: 'admin.mturk.hits.new',
  })
  .state('admin.mturk.hits.edit', {
    url: '/:HITId',
    templateUrl: '/ui/admin/mturk/hits/one.html',
    controller: 'admin.mturk.hits.edit',
  })
  // responses
  .state('admin.responses', {
    url: '/responses',
    template: '<ui-view></ui-view>',
    abstract: true,
  })
  .state('admin.responses.table', {
    url: '/',
    templateUrl: '/ui/admin/responses/all.html',
    controller: 'admin.responses.table',
  })
  // templates
  .state('admin.templates', {
    url: '/templates',
    templateUrl: '/ui/admin/templates/layout.html',
    abstract: true,
  })
  .state('admin.templates.table', {
    url: '/',
    templateUrl: '/ui/admin/templates/all.html',
    controller: 'admin.templates.table',
  })
  .state('admin.templates.edit', {
    url: '/:id',
    templateUrl: '/ui/admin/templates/one.html',
    controller: 'admin.templates.edit',
  });

  // configure html5 ?
  $locationProvider.html5Mode(true);
});

app.controller('admin', function($scope, $flash, $state, $http) {
  $scope.login = function(email, password) {
    var promise = $http.post('/login', {
      email: email,
      password: password,
    }).then(function(res) {
      $state.go($state.params.to);
      return res.data.message;
    }, function(res) {
      return res.data.message;
    });
    $flash(promise);
  };

  $scope.logout = function() {
    cookies.del('administrator_token', {path: '/'});
    $flash('Deleted administrator token');
    $state.go('.', {}, {reload: true});
  };
});

/**
From http://stackoverflow.com/a/18609594/424651, with formatting fixes.
*/
app.factory('RecursionHelper', function($compile) {
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function(element, link) {
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = { post: link };
      }

      // Break the recursion loop by removing the contents
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        /**
         * Compiles and re-adds the contents
         */
        post: function(scope, element) {
          // Compile the contents
          if (!compiledContents) {
            compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element
          compiledContents(scope, function(clone) {
            element.append(clone);
          });

          // Call the post-linking function, if any
          if (link && link.post) {
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
});

app.directive('selectTemplate', function(Template) {
  return {
    restrict: 'E',
    scope: {
      model: '=',
    },
    template: '<select ng-model="model" ng-options="template.id as template.name for template in templates"></select>',
    replace: true,
    link: function(scope) {
      scope.templates = Template.query();
    }
  };
});

app.directive('aTemplate', function(Template) {
  return {
    restrict: 'E',
    scope: {
      id: '@templateId',
    },
    template: '<a ui-sref="admin.templates.edit({id: template.id})">{{template.name}}</a>',
    replace: true,
    link: function(scope) {
      scope.template = Template.get({id: scope.id});
    }
  };
});
