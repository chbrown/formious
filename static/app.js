/*jslint browser: true, devel: true */ /*globals _, angular, Url, p, fileinputText */

var app = angular.module('app', ['ngStorage']);

app.filter('trust', function($sce) {
  return function(string) {
    return $sce.trustAsHtml(string);
  };
});

app.directive('help', function() {
  return {
    restrict: 'C',
    template: '<div class="summary" ng-bind="summary"></div>' +
      '<div class="content" ng-transclude></div>',
    transclude: true,
    link: function(scope, el, attrs) {
      scope.summary = el.text().slice(0, 50) + '...'; // &hellip;
      el.on('click', function() {
        el.toggleClass('expanded');
      });
    }
  };
});

app.directive('fixedflow', function() {
  /** This directive is intended to be used with a <nav> element, so that it
  drops out of flow, in the current position, but creates an empty shadow
  element to keep its place

  <nav fixedflow>
    <a href="/admin/aws">AWS Accounts</a>
    <a href="/admin/administrators">Administrators</a>
  </nav>
  */
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      var height = el.css('height');
      // placeholder is just a super simple empty shadow element
      var placeholder = angular.element('<div>');
      placeholder.css('height', height);
      el.after(placeholder);
    }
  };
});


app.directive('jsonTransform', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      // enhance textarea (presumably it's a textarea)
      var textarea = el[0];
      var textarea_enhanced = Textarea.enhance(textarea);

      // set up communicating from DOM to model
      function dom2model() {
        ngModel.$setViewValue(el.val());
      }
      el.on('blur keyup change', function() {
        scope.$apply(dom2model);
      });

      // set up communicating from model to DOM
      function model2dom() {
        el.val(ngModel.$viewValue);
        textarea_enhanced.resizeToFit();
      }
      ngModel.$render = model2dom;

      // set up translations
      ngModel.$formatters.push(function(value) {
        if (value === null) {
          return '';
        }
        return angular.toJson(value, true);
      });
      ngModel.$parsers.push(function(value) {
        // we'll interpret the empty string as 'null'
        if (value === '') {
          value = null;
        }

        try {
          ngModel.$setValidity('json', true);
          return angular.fromJson(value);
        }
        catch (exc) {
          ngModel.$setValidity('json', false);
          // return undefined;
        }
      });

      // dom2model(); // read from page's html before from the model (thus default to empty, usually)
    }
  };
});

// app.directive('ngCallbackClick', function($parse) {
//   // see angular.js:18074 for what this is based on
//   return {
//     restrict: 'A',
//     link: function(scope, el, attrs) {
//       var fn = $parse(attrs['ngCallbackClick']);
//       var throbber_el = angular.element('<img src="/static/lib/img/throbber-16.gif" />');
//       throbber_el.css('margin', '2px');
//       var error_el = angular.element('<span>');
//       error_el.css('margin', '2px');
//       var callback = function(err) {
//         throbber_el.remove();
//         if (err) {
//           error_el.text(err.toString());
//           el.after(error_el);
//           setTimeout(function() {
//             error_el.remove();
//           }, 5000);
//         }
//       };
//       el.on('click', function(event) {
//         // add progress element:
//         error_el.remove();
//         el.after(throbber_el);
//         // normal click handling
//         scope.$apply(function() {
//           fn(scope, {$event: event, $callback: callback});
//         });
//       });
//     }
//   };
// });

app.directive('ajaxform', function($http) {
  return {
    restrict: 'E',
    replace: true,
    template: '<form style="display: inline" ng-submit="submit($event)" ng-transclude></form>',
    transclude: true,
    link: function(scope, el, attrs) {
      scope.submit = function(ev) {
        if (attrs.method === 'DELETE') {
          ev.preventDefault();
          $http({method: attrs.method, url: attrs.action}).then(function(res) {
            window.location = window.location;
          }, p);
        }
        // other methods can handle themselves?
        // TODO: intercept PUT and PATCH, too
      };
    },
  };
});

var afterPromise = function(target, promise) {
  var el = angular.element(target);
  var throbber_el = angular.element('<img src="/static/lib/img/throbber-16.gif" />');
  throbber_el.css('margin', '2px');
  var error_el = angular.element('<span>');
  error_el.css('margin', '2px');
  var callback = function(err) {
    throbber_el.remove();
    if (err) {
      error_el.text(err.toString());
      el.after(error_el);
      setTimeout(function() {
        error_el.remove();
      }, 5000);
    }
  };

  // add progress element:
  error_el.remove();
  el.after(throbber_el);
  promise.then(callback, callback);
};