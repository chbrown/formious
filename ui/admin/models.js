import {app} from './app';
import _ from 'lodash';

app
.factory('appResourceCache', function($cacheFactory) {
  return $cacheFactory('appResourceCache');
});

app
.service('AccessToken', function($resource) {
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
