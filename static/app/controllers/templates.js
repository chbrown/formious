/*jslint browser: true, devel: true */ /*globals _, angular, app, p, Url, summarizeResponse */

app.controller('adminTemplatesCtrl', function($scope, $flash, Template) {
  $scope.templates = Template.query();
  $scope.delete = function(template) {
    // is this really the best way?
    var promise = template.$delete().then(function() {
      $scope.templates.splice($scope.templates.indexOf(template), 1);
      return 'Deleted';
    }, summarizeResponse);
    $flash(promise);
  };
});

app.controller('adminTemplateCtrl', function($scope, $http, $flash, $stateParams, $state, $location, Template) {
  $scope.template = Template.get($stateParams);

  $scope.keydown = function(ev) {
    if (ev.which == 83 && ev.metaKey) {
      // command+S
      ev.preventDefault();
      $scope.sync(ev);
    }
  };

  $scope.sync = function(ev) {
    var promise = $scope.template.$save().then(function(res) {
      $state.go('.', {id: $scope.template.id}, {notify: false});
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.clone = function() {
    $state.go('.', {id: 'new'}, {notify: false});
    $scope.template = new Template({
      name: $scope.template.name + ' copy',
      html: $scope.template.html,
    });
  };
});

// scope = angular.element($('[ng-controller]')).scope()


// /** POST /api/templates/:id/clone
// Create new template with properties of original, and go to it. */
// R.post(/^\/api\/templates\/(\d+)\/clone$/, function(req, res, m) {
//   models.Template.one({id: m[1]}, function(err, template) {
//     if (err) return res.die(err);

//     db.Insert('templates')
//     .set({
//       name: template.name + ' copy',
//       html: template.html,
//     })
//     .execute(function(err, rows) {
//       if (err) return res.die(err);

//       // redirect so that we aren't sitting with the previous template's id in the url
//       res.redirect('/admin/templates/' + rows[0].id);
//     });
//   });
// });
