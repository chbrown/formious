/*jslint browser: true, devel: true */ /*globals _, angular, Url, p, fileinputText, Textarea */

var app = angular.module('app', ['ngStorage']);

// here's how you can completely disable SCE:
//   angular.module('myAppWithSceDisabledmyApp', []).config(function($sceProvider) {
//     $sceProvider.enabled(false);
//   });

app.filter('trust', function($sce) {
  /** | trust lets us easily trust something as html */
  return function(string) {
    return $sce.trustAsHtml(string);
  };
});


app.directive('help', function() {
  return {
    restrict: 'C',
    template: '<span class="summary" ng-bind="summary"></span>' +
      '<span class="full" ng-transclude></span>',
    transclude: true,
    scope: {},
    link: function(scope, el, attrs) {
      var text_content = el.text().trim();
      scope.summary = text_content.slice(0, 50); // &hellip;
      if (text_content.length > 50) {
        scope.summary += '...';
      }
      el.on('click', function() {
        el.toggleClass('expanded');
      });
    }
  };
});

app.directive('map', function() {
  return {
    restrict: 'A',
    scope: {
      key: '=',
      map: '=',
    },
    link: function(scope, el, attrs) {
      if (scope.map) {
        el.text(scope.map[scope.key]);
      }
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
        // this will tell the textarea to resizeToFit
        // this is awkward.
        el[0].dispatchEvent(new Event('input'));
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

app.directive('enhance', function() {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      // enhance textarea (presumably it's a textarea)
      Textarea.enhance(el[0]);
    },
  };
});


app.directive('time', function() {
  return {
    restrict: 'E',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      ngModel.$render = function() {
        var date = new Date(ngModel.$modelValue);
        // move the actual datetime to the attribute
        attrs.datetime = date.toISOString();
        // and reformat the text content according to the class
        if (el.hasClass('date')) {
          el.text(date.toISOString().split('T')[0]);
        }
        else if (el.hasClass('long')) {
          el.text(date.toString());
        }
        else { // default: datetime but in short iso8601
          el.text(date.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
        }
      };
    },
  };
});

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
        p('Not doing anything with non-DELETE ajaxform');
        // other methods can handle themselves?
        // TODO: intercept PUT and PATCH, too
      };
    },
  };
});

// app.factory('$search', function($http, $httpqueue, $localStorage) {});

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

app.directive('checkboxSequence', function($http) {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      var previous_checkbox = null;
      // previous_action == true means the last selection was to change
      // a checkbox from unchecked to checked
      var previous_action = null;

      // addEventListener('DOMSubtreeModified', function()
      // requires jQuery (not just jQ-lite) for the selector stuff
      var sel = 'input[type="checkbox"]';
      el.on('click', sel, function(ev) {
        var action = ev.target.checked; // true = just checked, false = just unchecked
        if (ev.shiftKey) {
          if (action === previous_action && previous_checkbox) {
            var checkboxes = el.find(sel);
            var inside = false;
            // select all entries between the two, inclusive
            for (var i = 0, l = checkboxes.length; i < l; i++) {
              var checkbox = checkboxes[i];
              var boundary = checkbox == previous_checkbox || checkbox == ev.target;
              if (boundary) {
                if (inside === false) {
                  // the first boundary we hit puts us inside
                  inside = true;
                }
                else {
                  // the secondary boundary puts us outside, so we break out
                  break;
                }
              }
              else if (inside) {
                checkbox.checked = action;
                // checkbox.dispatchEvent(new Event('input', true, true));
                // angular.element(checkbox).trigger('click');
                // angular.element(checkbox).trigger('change');
                // angular.element(checkbox).prop('checked', action);
                angular.element(checkbox).triggerHandler('click');
              }
            }
          }
        }
        previous_checkbox = ev.target;
        previous_action = action;
      });

    },
  };
});
