/*jslint browser: true */ /*globals app, p, toMap */

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

  $stateProvider
  // access_tokens
  .state('access_tokens', {
    url: '/admin/access_tokens',
    templateUrl: '/templates/admin/access_tokens/all.html',
  })
  .state('access_tokens-show', {
    url: '/admin/access_tokens/:id',
    templateUrl: '/templates/admin/access_tokens/one.html',
  })
  // administrators
  .state('administrators', {
    url: '/admin/administrators',
    templateUrl: '/templates/admin/administrators/all.html',
  })
  .state('administrators-show', {
    url: '/admin/administrators/:id',
    templateUrl: '/templates/admin/administrators/one.html',
  })
  // aws_accounts
  .state('aws_accounts', {
    url: '/admin/aws_accounts',
    templateUrl: '/templates/admin/aws_accounts/all.html',
  })
  .state('aws_accounts-show', {
    url: '/admin/aws_accounts/:id',
    templateUrl: '/templates/admin/aws_accounts/one.html',
  })
  // experiments
  .state('experiments', {
    url: '/admin/experiments',
    templateUrl: '/templates/admin/experiments/all.html',
  })
  .state('experiments-show', {
    url: '/admin/experiments/:id',
    templateUrl: '/templates/admin/experiments/one.html',
  })
  // mturk
  .state('HITs', {
    url: '/admin/mturk/HITs?aws_account_id&host',
    templateUrl: '/templates/admin/mturk/HITs/all.html',
  })
  .state('HITs-new', {
    url: '/admin/mturk/HITs/new?aws_account_id&host',
    templateUrl: '/templates/admin/mturk/HITs/new.html',
  })
  .state('HITs-show', {
    url: '/admin/mturk/HITs/:HITId?aws_account_id&host',
    templateUrl: '/templates/admin/mturk/HITs/one.html',
  })
  // templates
  .state('templates', {
    url: '/admin/templates',
    templateUrl: '/templates/admin/templates/all.html',
  })
  .state('templates-show', {
    url: '/admin/templates/:id',
    templateUrl: '/templates/admin/templates/one.html',
  });

  // configure html5 ?
  $locationProvider.html5Mode(true);
});
