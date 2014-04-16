/*jslint browser: true, devel: true */ /*globals _, angular, app, p, Url, summarizeResponse */

app.controller('adminTemplatesCtrl', function($scope, Template) {
  $scope.templates = Template.query();

  $scope.delete = function(template) {
    // is this really the best way?
    template.$delete(function() {
      $scope.templates = Template.query();
    });
  };
});
app.controller('adminTemplateCtrl', function($scope, $http, $flash, Template) {
  var current_url = Url.parse(window.location);
  var template_id = _.last(current_url.path.split('/'));

  $scope.template = Template.get({id: template_id});

  $scope.keydown = function(ev) {
    if (ev.which == 83 && ev.metaKey) {
      // command+S
      ev.preventDefault();
      $scope.sync(ev);
    }
  };

  $scope.sync = function(ev) {
    var promise = $scope.template.$save().then(function(res) {
      // refactor this url / history handling somehow
      var template_url = '/admin/templates/' + $scope.template.id;
      history.replaceState(null, '', template_url);
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };
});
