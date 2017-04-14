import _ from 'lodash';
import moment from 'moment';
import {Url} from 'urlobject';
import JSONArea from 'jsonarea';
import React from 'react';
import {render} from 'react-dom';
import {Router, Route, IndexRoute, Link, browserHistory} from 'react-router';

// import 'textarea';

// app.filter('where', function() {
//   return function(list, predicate) {
//     return _.where(list, predicate);
//   };
// });

// app.filter('valueWhere', function() {
//   return function(list, predicate, prop) {
//     var match = _.findWhere(list, predicate);
//     if (match) {
//       return match[prop];
//     }
//   };
// });

// app.filter('keys', function() {
//   return function(object) {
//     return Object.keys(object);
//   };
// });


export function sendTurkRequest(data, callback) {
  // ui-router reloads the controllers before changing the location URL, which
  // means this will get called with the wrong url after a account/environment change
  // console.log('sendTurkRequest pathname', location.pathname, data);
  var path_match = window.location.pathname.match(/^\/admin\/mturk\/(\w+)\/(\d+)/);
  if (path_match === null) {
    throw new Error('Cannot find AWS Account ID and MTurk environment parameters in URL');
  }
  var environment = path_match[1];
  var aws_account_id = path_match[2];
  var url = new Url({path: '/api/mturk', query: {environment, aws_account_id}}).toString();

  var request = new Request('POST', url).sendJSON(data, (err, res) => {
    if (err) return callback(err);
    // res is a Document instance
    window.request = request;
    var valid = res.querySelector('IsValid').textContent === 'True';
    if (!valid) {
      var Messages = res.querySelectorAll('Errors > Error > Message');
      var errors = _.map(Messages, Message => Message.textContent);
      var message = `AWS API Error: ${errors.join(', ')}`;
      return callback(new Error(message));
    }
    callback(null, res);
  });
}

// app.service('Cache', function($q, $localStorage) {
//   var cache = $localStorage.$default({cache: {}).cache;
//   // 1 hour expiration
//   var max_age = 60*60*1000;
//   this.get = function(key, fetchFunction) {
//     // key is some string that refers to a cache wrapper object:
//     //   $localStorage.cache[key] = {fetched: Date, value: ...}
//     // fetchFunction will never get called unless the cached value is missing or stale
//     var fetched = (cache[key] === undefined) ? 0 : cache[key].fetched;
//     var now = new Date().getTime();
//     if (now - fetched > max_age) {
//       // fetch and cache
//       // fetchFunction() will return something like an $http with successes filtered to a single value
//       return fetchFunction().then(function(res) {
//         cache[key] = {
//           fetched: now,
//           value: res,
//         };
//       });
//     }
//     else {
//       // resolvable immediately
//       var deferred = $q.defer();
//       deferred.resolve(cache[key].value);
//       return deferred.promise;
//     }
//   };
// });

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
app.run(function($rootScope, $state, $timeout) {
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


/*
the admin controller handles login and logout actions
Admin -> '/ui/admin/layout.html',
AdminLogin ->  '/ui/admin/login.html',
  url: '/login?to',

HITSNew -> url: '/new?Title&ExternalURL',
*/



render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="admin" component={AdminLayout}>
        <Route path="login" component={AdminLogin} />

        <Route path="access_tokens"> // '/ui/admin/access_tokens/layout.html',
          <Route path=":access_token_id" component={AccessTokensEdit} />  // '/ui/admin/access_tokens/one.html',
          <IndexRoute component={AccessTokensTable} /> // '/ui/admin/access_tokens/all.html',
        </Route>
        <Route path="administrators">
          <Route path=":administrator_id" component={AdministratorsEdit} />
          <IndexRoute component={AdministratorsTable} />
        </Route>
        <Route path="aws_accounts">
          <Route path=":aws_account_id" component={AWSAccountsEdit} />
          <IndexRoute component={AWSAccountsTable} />
        </Route>
        <Route path="experiments">
          <Route path=":experiment_id" component={ExperimentsEdit}>
            <Route path="blocks" component={ExperimentsEditBlocks} />
            {/*<Route path="blocks/:block_id" component={ExperimentsEditBlockEdit} />*/}
          </Route>
          <IndexRoute component={ExperimentsTable} />
        </Route>
        <Route path="mturk/:environment/:aws_account_id" component={MTurkEdit}>
          <Route path="dashboard" component={MTurkDashboard} />
          <Route path="hits">
            <Route path="new" component={MTurkHITsNew} />
            <Route path=":HITId" component={MTurkHITsEdit} />
            <IndexRoute component={MTurkHITsTable} />
          </Route>
          <Route path="qualification_types">
            <Route path="new" component={MTurkQualificationTypesNew} />
            <Route path=":HITId" component={MTurkQualificationTypesEdit} />
            <IndexRoute component={MTurkQualificationTypesTable} />
          </Route>
          <IndexRoute component={ExperimentsTable} />
        </Route>
        <Route path="responses">
          <IndexRoute component={ResponsesTable}/>
        </Route>
        <Route path="templates">
          <Route path=":template_id" component={TemplatesEdit} />
          <IndexRoute component={TemplatesTable}/>
        </Route>
      </Route>
      <Route path="*" component={NoMatch} />
    </Route>
  </Router>
), document.getElementById('root'));

app.controller('admin', function($scope, $state, $http) {
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
    NotifyUI.addPromise(promise);
  };

  $scope.logout = function() {
    cookies.del('administrator_token', {path: '/'});
    NotifyUI.add('Deleted administrator token');
    $state.go('.', {}, {reload: true});
  };
});

app.directive('durationString', function() {
  var units = {
    d: 86400,
    h: 3600,
    m: 60,
  };
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      ngModel.$formatters.push((seconds) => {
        seconds = Number(seconds);
        var parts = [];
        if (seconds > units.d) {
          var d = seconds / units.d | 0;
          parts.push(`${d}d`);
          seconds -= d * units.d;
        }
        if (seconds > units.h) {
          var h = seconds / units.h | 0;
          parts.push(`${h}h`);
          seconds -= h * units.h;
        }
        if (seconds > units.m) {
          var m = seconds / units.m | 0;
          parts.push(`${m}m`);
          seconds -= m * units.m;
        }
        if (seconds > 0) {
          parts.push(`${seconds}s`);
        }
        return parts.join(' ');
      });
      ngModel.$parsers.push((string) => {
        // take a string, return a number
        // e.g., "5h" -> 5*60*60, the number of seconds in five hours
        var matches = string.match(/\d+\w/g);
        if (matches !== null) {
          var duration = moment.duration(0);
          matches.forEach((match) => {
            var parts = match.match(/(\d+)(\w)/);
            duration.add(parseInt(parts[1], 10), parts[2]);
          });
          return duration.asSeconds();
        }
      });
    },
  };
});


app.factory('appResourceCache', function($cacheFactory) {
  return $cacheFactory('appResourceCache');
});

app.service('AccessToken', function($resource) {
  return $resource('/api/access_tokens/:id', {
    id: '@id',
  });
})
.service('Administrator', function($resource, appResourceCache) {
  // map: {'id': 'email'}
  return $resource('/api/administrators/:id', {
    id: '@id',
  }, {
    get: {
      method: 'GET',
      cache: appResourceCache,
    },
    query:  {
      method: 'GET',
      isArray: true,
      cache: appResourceCache,
    },
  });
})
.service('AWSAccount', function($resource, appResourceCache) {
  // map: {'id': 'name'}
  return $resource('/api/aws_accounts/:id', {
    id: '@id',
  }, {
    get: {
      method: 'GET',
      cache: appResourceCache,
    },
    query:  {
      method: 'GET',
      isArray: true,
      cache: appResourceCache,
    },
  });
})
.service('AWSAccountAdministrator', function($resource) {
  return $resource('/api/administrators/:administrator_id/aws_accounts/:aws_account_id', {
    administrator_id: '@administrator_id',
    aws_account_id: '@aws_account_id',
  });
})
.service('Experiment', function($resource) {
  var Experiment = $resource('/api/experiments/:id', {
    id: '@id',
  });
  return Experiment;
})
.service('Participant', function($resource) {
  return $resource('/api/participants/:id', {
    id: '@id',
  });
})
.service('Response', function($resource) {
  return $resource('/api/responses/:id', {
    id: '@id',
  });
})
.service('Block', function($resource) {
  var Block = $resource('/api/experiments/:experiment_id/blocks/:id', {
    experiment_id: '@experiment_id',
    id: '@id',
  });

  /**
  Reconstruct block tree from flat list of blocks in an experiment.
  */
  Block.queryTree = function(params) {
    var all_blocks = Block.query(params);
    return all_blocks.$promise.then(function(all_blocks) {
      var block_hash = _.object(all_blocks.map(function(block) {
        block.children = [];
        return [block.id, block];
      }));
      var root_blocks = [];
      all_blocks.forEach(function(block) {
        if (block.parent_block_id) {
          // block_hash and root blocks contents are linked by reference, so order doesn't matter here
          block_hash[block.parent_block_id].children.push(block);
        }
        else {
          // blocks with no parent_block_id are added to the root list
          root_blocks.push(block);
        }
      });
      return root_blocks;
    });
  };

  return Block;
})
.service('Template', function($resource, $q, appResourceCache) {
  // map: {'id': 'name'}
  var Template = $resource('/api/templates/:id', {
    id: '@id',
  }, {
    get: {
      method: 'GET',
      cache: appResourceCache,
    },
    // save:   {
    //   method: 'POST',
    // },
    query:  {
      method: 'GET',
      isArray: true,
      cache: appResourceCache,
    },
    // delete: {
    //   method: 'DELETE',
    // },
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

