/*jslint browser: true */ /*globals app, p, toMap */

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

  $stateProvider
  // access_tokens
  .state('access_tokens', {
    url: '/admin/access_tokens',
    templateUrl: '/templates/admin/access_tokens/all.mu',
  })
  .state('access_tokens-show', {
    url: '/admin/access_tokens/:id',
    templateUrl: '/templates/admin/access_tokens/one.mu',
  })
  // administrators
  .state('administrators', {
    url: '/admin/administrators',
    templateUrl: '/templates/admin/administrators/all.mu',
  })
  .state('administrators-show', {
    url: '/admin/administrators/:id',
    templateUrl: '/templates/admin/administrators/one.mu',
  })
  // aws_accounts
  .state('aws_accounts', {
    url: '/admin/aws_accounts',
    templateUrl: '/templates/admin/aws_accounts/all.mu',
  })
  .state('aws_accounts-show', {
    url: '/admin/aws_accounts/:id',
    templateUrl: '/templates/admin/aws_accounts/one.mu',
  })
  // experiments
  .state('experiments', {
    url: '/admin/experiments',
    templateUrl: '/templates/admin/experiments/all.mu',
  })
  .state('experiments-show', {
    url: '/admin/experiments/:id',
    templateUrl: '/templates/admin/experiments/one.mu',
  })
  // mturk
  .state('HITs', {
    url: '/admin/mturk/HITs?aws_account_id&host',
    templateUrl: '/templates/admin/mturk/HITS/all.mu',
  })
  .state('HITs-new', {
    url: '/admin/mturk/HITs/new?aws_account_id&host',
    templateUrl: '/templates/admin/mturk/HITS/new.mu',
  })
  .state('HITs-show', {
    url: '/admin/mturk/HITs/:HITId?aws_account_id&host',
    templateUrl: '/templates/admin/mturk/HITS/one.mu',
  })
  // templates
  .state('templates', {
    url: '/admin/templates',
    templateUrl: '/templates/admin/templates/all.mu',
  })
  .state('templates-show', {
    url: '/admin/templates/:id',
    templateUrl: '/templates/admin/templates/one.mu',
  });

  // configure html5 ?
  $locationProvider.html5Mode(true);
});
