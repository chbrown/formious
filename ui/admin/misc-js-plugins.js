/*jslint browser: true, esnext: true */ /*globals angular, Event */
/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/angular-plugins.js

jslint with 'browser: true' really ought to recognize 'Event' as a global type

*/
export var misc_js_plugins = angular.module('misc-js-plugins', [])
// # Directives
.directive('help', function() {
  /**
  <span class="help">This is a long but very useful help message but most often you probably won't want to read all of it because it's actually easy to remember and not all that helpful. Good for reference though.</span>

  This message will be truncated to the first 50 characters (TODO: make that configurable).
  */
  return {
    restrict: 'C',
    template:
      '<span class="summary" style="opacity: 0.5" ng-hide="expanded" ng-click="expanded = true"></span>' +
      '<span class="full" ng-show="expanded" ng-click="expanded = false" ng-transclude></span>',
    transclude: true,
    scope: {},
    link: function(scope, el, attrs) {
      var summary_el = el.children().eq(0);
      var full_el = el.children().eq(1);
      scope.expanded = false;

      // var content = el.text().trim();
      var content = full_el.text().trim();
      var summary = content.slice(0, 50) + ((content.length > 50) ? '...' : '');
      summary_el.text(summary);
    }
  };
})
.directive('jsonTransform', function() {
  /** parser/serializer to edit a JSON object within a textarea or input[type=text] */
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      // set up communicating from DOM to model
      el.on('blur keyup change', function() {
        scope.$apply(function() {
          ngModel.$setViewValue(el.val());
          // if we wanted to read from page's html before from the model, we'd
          // run this function at the link level (but usually we want the model)
        });
      });
      // set up communicating from model to DOM
      ngModel.$render = function() {
        el.val(ngModel.$viewValue);
        // this would trigger a textarea to resizeToFit, for example. kind of awkward, though.
        el[0].dispatchEvent(new Event('input'));
      };

      // set up translations
      ngModel.$formatters.push(function(value) {
        if (value === null) {
          return '';
        }
        // signature: angular.toJson(obj, [pretty]);
        return angular.toJson(value, true);
      });
      ngModel.$parsers.push(function(value) {
        // we'll interpret the empty string as 'null'
        if (value === '') {
          value = null;
        }

        try {
          ngModel.$setValidity('json', true);
          // angular uses an unwrapped JSON.parse, so it'll throw on failure
          return angular.fromJson(value);
        }
        catch (exc) {
          ngModel.$setValidity('json', false);
          // return undefined;
        }
      });
    }
  };
})
.directive('onUpload', function($parse) {
  /** AngularJS documentation for the input directive:

  > Note: Not every feature offered is available for all input types.
  > Specifically, data binding and event handling via ng-model is
  > unsupported for input[file].

  So we have this little shim to fill in for that.

  Use like:

      <input type="file" on-upload="file = $file">

  Or:

      <input type="file" on-upload="handle($files)" multiple>

  */
  return {
    restrict: 'A',
    compile: function(el, attrs) {
      var fn = $parse(attrs.onUpload);
      return function(scope, element, attr) {
        // the element we listen to inside the link function should not be the
        // element from the compile function signature; that one may match up
        // with the linked one, but maybe not, if this element does not occur
        // directly in the DOM, e.g., if it's inside a ng-repeat or ng-if.
        element.on('change', function(event) {
          scope.$apply(function() {
            var context = {$event: event};
            if (attrs.multiple) {
              context.$files = event.target.files;
            }
            else {
              context.$file = event.target.files[0];
            }
            fn(scope, context);
          });
        });
      };
    }
  };
})
// services
.service('$flash', function($rootScope) {
  // basically a $rootScope wrapper
  return function(value, timeout) {
    // value can be a string or a promise
    // default to a 3 second timeout, but allow permanent flashes
    if (timeout === undefined) timeout = 3000;
    $rootScope.$broadcast('flash', value, timeout);
  };
})
.directive('flash', function($timeout, $q) {
  /**
  Inject $flash and use like:
      $flash('OMG it burns!')
  or
      $flash(asyncResultPromise)
  */
  return {
    restrict: 'E',
    template:
      '<div class="flash" ng-show="messages.length > 0">' +
        '<span ng-repeat="message in messages track by $index" ng-bind="message"></span>' +
      '</div>',
    replace: true,
    scope: {messages: '&'},
    link: function(scope, el, attrs) {
      scope.messages = [];

      scope.add = function(message) {
        scope.messages.push(message);
      };
      scope.remove = function(message) {
        var index = scope.messages.indexOf(message);
        scope.messages.splice(index, 1);
      };

      scope.$on('flash', function(ev, value, timeout) {
        scope.add('...');

        // for some reason, .finally() doesn't get the promise's value,
        // so we have to use .then(a, a)
        var done = function(message) {
          // so we recreate
          scope.remove('...');
          scope.add(message);

          // if timeout is null, for example, leave the message permanently
          if (timeout) {
            $timeout(function() {
              scope.remove(message);
            }, timeout);
          }
        };
        // wrap value with .when() to support both strings and promises of strings
        $q.when(value).then(done, done);
      });
    }
  };
});
