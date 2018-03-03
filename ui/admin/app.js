import _ from 'lodash'
import moment from 'moment'
import {h, create, diff, patch} from 'virtual-dom'
import {Url} from 'urlobject'
import {Request} from 'httprequest'
import {NotifyUI} from 'notify-ui'
import {CookieMonster} from 'cookiemonster'

// angular.js libraries:
import angular from 'angular'
import 'angular-resource'
import 'angular-ui-router'
import 'ngstorage'
import 'ng-upload'
// angular modules
import 'flow-copy'
import 'checkbox-sequence'
import 'textarea'

// for the misc-js-plugins module below. TODO: factor out
import './misc-js-plugins'

export var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'ngUpload',
  'misc-js-plugins', // TODO: factor this out
  'flow-copy', // exposes an EA 'fixedflow' directive
  'checkbox-sequence', // exposes an A 'checkbox-sequence' directive
  'textarea',
])

function renderObject(object) {
  // console.log('renderObject', object)
  if (object === undefined) {
    return h('i.undefined', 'undefined')
  }
  else if (object === null) {
    return h('b.null', 'null')
  }
  else if (Array.isArray(object)) {
    // check for tabular arrays (all of the items are objects with the same keys)
    var items_are_objects = object.every(function(value) {
      return (value !== null) && (value !== undefined) && (typeof value === 'object')
    })
    if (object.length > 0 && items_are_objects) {
      // now check that all the keys are the same
      var columns = Object.keys(object[0])
      var items_have_indentical_keys = object.slice(1).every(function(value) {
        return _.isEqual(Object.keys(value), columns)
      })
      if (items_have_indentical_keys) {
        var thead_children = h('tr', columns.map(function(column) {
          return h('th', column)
        }))
        var tbody_children = object.map(function(value) {
          var cells = columns.map(function(column) {
            return h('td', renderObject(value[column]))
          })
          return h('tr', cells)
        })
        return h('div.table', [
          h('table', [
            h('thead', thead_children),
            h('tbody', tbody_children),
          ]),
        ])
      }
    }
    // otherwise, it's an array of arbitrary objects
    var array_children = object.map(value => renderObject(value))
    return h('div.array', array_children)
  }
  else if (typeof object === 'object') {
    var object_children = _.map(object, function(value, key) {
      return h('tr', [
        h('td', key), h('td', renderObject(value)),
      ])
    })
    return h('div.object', h('table.keyval', object_children))
  }
  else if (typeof object === 'number') {
    return h('b.number', object.toString())
  }
  else if (typeof object === 'boolean') {
    return h('b.boolean', object.toString())
  }
  return h('span.string', object.toString())
}

app.directive('uiSrefActiveAny', function($state) {
  return {
    restrict: 'A',
    scope: {
      uiSrefActiveAny: '=',
    },
    link: function(scope, el) {
      var activeClasses = scope.uiSrefActiveAny
      function updateSrefActiveAny() {
        for (var key in activeClasses) {
          var match = $state.includes(activeClasses[key])
          el.toggleClass(key, match)
        }
      }
      scope.$on('$stateChangeSuccess', updateSrefActiveAny)
    },
  }
})

class VComponent {
  constructor(parentNode, renderFunction) {
    this.parentNode = parentNode
    this.renderFunction = renderFunction
    this.vtree = undefined
    this.element = undefined
  }
  update(value) {
    if (this.vtree === undefined) {
      this.vtree = this.renderFunction(value)
      this.element = create(this.vtree)
      // attach to the dom on the first draw
      this.parentNode.appendChild(this.element)
    }
    else {
      var new_vtree = this.renderFunction(value)
      var patches = diff(this.vtree, new_vtree)
      this.element = patch(this.element, patches)
      this.vtree = new_vtree
    }
  }
}

app.directive('object', function() {
  return {
    restrict: 'A',
    scope: {
      object: '=',
    },
    link: function(scope, el) {
      var component = new VComponent(el[0], renderObject)
      scope.$watch('object', function(newVal) {
        var object = angular.copy(newVal)
        component.update(object)
      }, true)
    },
  }
})

app.filter('where', function() {
  return function(list, predicate) {
    return _.where(list, predicate)
  }
})

app.filter('valueWhere', function() {
  return function(list, predicate, prop) {
    var match = _.findWhere(list, predicate)
    if (match) {
      return match[prop]
    }
  }
})

app.filter('keys', function() {
  return function(object) {
    return Object.keys(object)
  }
})

export function sendTurkRequest(data, callback) {
  // ui-router reloads the controllers before changing the location URL, which
  // means this will get called with the wrong url after a account/environment change
  // console.log('sendTurkRequest pathname', location.pathname, data)
  var path_match = window.location.pathname.match(/^\/admin\/mturk\/(\w+)\/(\d+)/)
  if (path_match === null) {
    throw new Error('Cannot find AWS Account ID and MTurk environment parameters in URL')
  }
  var environment = path_match[1]
  var aws_account_id = path_match[2]
  var url = new Url({path: '/api/mturk', query: {environment, aws_account_id}}).toString()

  var request = new Request('POST', url).sendJSON(data, (err, res) => {
    if (err) return callback(err)
    // res is a Document instance
    window.request = request
    var valid = res.querySelector('IsValid').textContent === 'True'
    if (!valid) {
      var Messages = res.querySelectorAll('Errors > Error > Message')
      var errors = _.map(Messages, Message => Message.textContent)
      var message = `AWS API Error: ${errors.join(', ')}`
      return callback(new Error(message))
    }
    callback(null, res)
  })
}

app.factory('$turk', function($q) {
  return function(data) {
    return $q(function(resolve, reject) {
      sendTurkRequest(data, function(err, response) {
        return err ? reject(err) : resolve(response)
      })
    })
  }
})

app.service('Cache', function($q, $localStorage) {
  var cache = $localStorage.$default({cache: {}}).cache
  // 1 hour expiration
  var max_age = 60 * 60 * 1000

  this.get = function(key, fetchFunction) {
    // key is some string that refers to a cache wrapper object:
    //   $localStorage.cache[key] = {fetched: Date, value: ...}
    // fetchFunction will never get called unless the cached value is missing or stale
    var fetched = (cache[key] === undefined) ? 0 : cache[key].fetched
    var now = new Date().getTime()
    if (now - fetched > max_age) {
      // fetch and cache
      // fetchFunction() will return something like an $http with successes filtered to a single value
      return fetchFunction().then(function(res) {
        cache[key] = {
          fetched: now,
          value: res,
        }
      })
    }
    else {
      // resolvable immediately
      var deferred = $q.defer()
      deferred.resolve(cache[key].value)
      return deferred.promise
    }
  }
})

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
      scope.model = ngModel

      // not sure why Angular decides to automatically transclude all the attributes when we say 'replace: true'
      el.attr({style: ''})

      // scope.raw.viewChangeListeners = []
      scope.change = function() {
        ngModel.$setViewValue(scope.raw)
      }

      ngModel.$parsers = [function(string) {
        try {
          var obj = angular.fromJson(string)
          ngModel.$setValidity('jsonInvalid', true)
          return obj
        }
        catch (exc) {
          scope.error = exc.message.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
          ngModel.$setValidity('jsonInvalid', false)
          // otherwise return the last valid value so that we don't lose the original
          return ngModel.$modelValue
        }
      }]

      ngModel.$render = function() {
        // just set the textarea to the JSON, but only if the current raw value is valid JSON
        if (ngModel.$valid) {
          scope.raw = angular.toJson(ngModel.$modelValue, true)
        }
      }
    },
  }
})

/** readBinaryFile(file: File, callback: (error: Error, data?: Uint8Array))

File: a native browser File object, as provided by an input[type="file"]'s
files[i] property.
*/
function readBinaryFile(file, callback) {
  var reader = new FileReader()
  reader.onerror = function(error) {
    callback(error)
  }
  reader.onload = function() {
    var data = new Uint8Array(reader.result)
    // data is an arraybufferview as basic bytes / chars
    callback(null, data)
  }
  reader.readAsArrayBuffer(file)
}

/** parseTabularFile(file: File, callback: (error: Error, table?: object[]))

File: a native browser File object, as provided by an input[type="file"]'s
files[i] property.

This method will read the file's contents, send it via AJAX to the
/util/parseTable endpoint to be parsed as an Excel spreadsheet or CSV, as needed.
*/
function parseTabularFile(file, callback) {
  readBinaryFile(file, function(error, data) {
    if (error) return callback(error)

    // send excel data off to the server to parse
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/util/parse-table')
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('X-Filename', file.name)
    xhr.onerror = function(error) {
      callback(error)
    }
    xhr.onload = function() {
      if (xhr.status >= 300) {
        var error = new Error(xhr.responseText)
        return callback(error)
      }

      var body = xhr.responseText
      var content_type = xhr.getResponseHeader('content-type')
      if (content_type.match(/application\/json/)) {
        body = JSON.parse(body)
      }
      callback(null, body)
    }
    xhr.send(data)
  })
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
        return err ? reject(err) : resolve(data)
      })
    })
  }
})

app.config(function($httpProvider) {
  // trying to inject $state here creates a circular dependency conflict, so
  // we have to emit an event and listen for it below, in app.run, where we can
  // inject $state
  $httpProvider.interceptors.push(function($q, $rootScope) {
    return {
      responseError: function(res) {
        if (res.status == 401) {
          $rootScope.$broadcast('unauthorized', res)
        }
        return $q.reject(res)
      },
    }
  })
})

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
    var to = $state.current.name
    $timeout(function() {
      $state.go('admin.login', {to: to})
    })
  })
})

/**
global listener for command+S keypresses

Broadcasts global "save" event and prevents the browser's default save action.
*/
app.run(function($rootScope) {
  document.addEventListener('keydown', function(ev) {
    if (ev.which == 83 && ev.metaKey) { // command+S
      ev.preventDefault()
      $rootScope.$broadcast('save')
    }
  })
})

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $urlRouterProvider.otherwise(function() {
    // the returned value should be a url expressed relative to the page's base[href]
    return 'admin/administrators/'
  })

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
    template: '<ui-view></ui-view>',
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
  .state('admin.mturk.qualification_types', {
    url: '/qualification_types',
    template: '<ui-view></ui-view>',
    abstract: true,
  })
  .state('admin.mturk.qualification_types.table', {
    url: '/',
    templateUrl: '/ui/admin/mturk/qualification_types/all.html',
    controller: 'admin.mturk.qualification_types.table',
  })
  .state('admin.mturk.qualification_types.new', {
    url: '/new',
    templateUrl: '/ui/admin/mturk/qualification_types/new.html',
    controller: 'admin.mturk.qualification_types.new',
  })
  .state('admin.mturk.qualification_types.edit', {
    url: '/:QualificationTypeId',
    templateUrl: '/ui/admin/mturk/qualification_types/one.html',
    controller: 'admin.mturk.qualification_types.edit',
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
  })

  // configure html5 ?
  $locationProvider.html5Mode(true)
})

app.controller('admin', function($scope, $state, $http) {
  $scope.login = function(email, password) {
    var promise = $http.post('/login', {
      email: email,
      password: password,
    }).then(function(res) {
      $state.go($state.params.to)
      return res.data.message
    }, function(res) {
      return res.data.message
    })
    NotifyUI.addPromise(promise)
  }

  $scope.logout = function() {
    var cookies = new CookieMonster(document)
    cookies.del('administrator_token', {path: '/'})
    NotifyUI.add('Deleted administrator token')
    $state.go('.', {}, {reload: true})
  }
})

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
      // Normalize the link parameter and extract pre/post
      var {pre = null, post} = angular.isFunction(link) ? {post: link} : link

      // Break the recursion loop by removing the contents
      var contents = element.contents().remove()
      var compiledContents
      return {
        pre,
        /**
         * Compiles and re-adds the contents
         */
        post: function(scope, element) {
          // Compile the contents
          if (!compiledContents) {
            compiledContents = $compile(contents)
          }
          // Re-add the compiled contents to the element
          compiledContents(scope, function(clone) {
            element.append(clone)
          })

          // Call the post-linking function, if any
          if (post) {
            link.post.apply(null, arguments)
          }
        },
      }
    },
  }
})

app.directive('selectTemplate', function(Template) {
  return {
    restrict: 'E',
    scope: {
      model: '=',
    },
    template: '<select ng-model="model" ng-options="template.id as template.name for template in templates"></select>',
    replace: true,
    link: function(scope) {
      scope.templates = Template.query()
    },
  }
})

app.directive('aTemplate', function(Template) {
  return {
    restrict: 'E',
    scope: {
      id: '@templateId',
    },
    template: '<a ui-sref="admin.templates.edit({id: template.id})">{{template.name}}</a>',
    replace: true,
    link: function(scope) {
      scope.template = Template.get({id: scope.id})
    },
  }
})

app.directive('durationString', function() {
  var units = {
    d: 86400,
    h: 3600,
    m: 60,
  }
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      ngModel.$formatters.push((inputSeconds) => {
        var seconds = Number(inputSeconds)
        var parts = []
        if (seconds > units.d) {
          var d = seconds / units.d | 0
          parts.push(`${d}d`)
          seconds -= d * units.d
        }
        if (seconds > units.h) {
          var h = seconds / units.h | 0
          parts.push(`${h}h`)
          seconds -= h * units.h
        }
        if (seconds > units.m) {
          var m = seconds / units.m | 0
          parts.push(`${m}m`)
          seconds -= m * units.m
        }
        if (seconds > 0) {
          parts.push(`${seconds}s`)
        }
        return parts.join(' ')
      })
      ngModel.$parsers.push((string) => {
        // take a string, return a number
        // e.g., "5h" -> 5*60*60, the number of seconds in five hours
        var matches = string.match(/\d+\w/g)
        if (matches !== null) {
          var duration = moment.duration(0)
          matches.forEach((match) => {
            var parts = match.match(/(\d+)(\w)/)
            duration.add(parseInt(parts[1], 10), parts[2])
          })
          return duration.asSeconds()
        }
      })
    },
  }
})
