/*jslint esnext: true */
import _ from 'lodash';
import {app} from '../../app';

function pluralize(singular, array) {
  if (array.length == 1) {
    return singular;
  }
  return singular + 's';
}

app
.controller('admin.experiments.edit.blocks', function($scope, $localStorage, $state, $flash, $q,
  Template, Block, parseTabularFile) {
  $scope.$storage = $localStorage;
  $scope.templates = Template.query();
  $scope.blocks = [];

  Block.queryTree({experiment_id: $state.params.experiment_id}).then(function(blocks) {
    $scope.blocks = blocks;
  });

  function getNextViewOrder() {
    var max_view_order = Math.max.apply(Math, _.pluck($scope.blocks, 'view_order'));
    return Math.max(max_view_order, 0) + 1;
  }

  $scope.$on('deleteBlock', function(ev, block) {
    var promise = block.$delete().then(function() {
      $scope.blocks.splice($scope.blocks.indexOf(block), 1);
      return 'Deleted block';
    });
    $flash(promise);
  });

  $scope.$on('collapseBlock', function(ev, block) {
    // 1. set all of the block's children's parent_block_id to the deleted
    // block's parent_block_id. I.e., their grandparents adopt them.
    var promises = block.children.map(function(child_block) {
      child_block.parent_block_id = block.parent_block_id;
      return child_block.$save();
    });
    var promise = $q.all(promises).then(function() {
      // 2. delete the block, which would orphan the children,
      // except that they've been adopted.
      return block.$delete().then(function() {
        return 'Collapsed block';
      });
    });
    $flash(promise);
  });

  $scope.deleteSelectedBlocks = function() {
    var promises = $scope.blocks.filter(function(block) {
      return block.selected;
    }).map(function(block) {
      return block.$delete();
    });
    var promise = $q.all(promises).then(function() {
      $scope.blocks = $scope.blocks.filter(function(block) { return !block.selected; });
      return 'Deleted ' + promises.length + ' ' + pluralize('block', promises);
    });
    $flash(promise);
  };

  /**
  Move the selected blocks into a new block of their own.
  */
  $scope.groupSelectedBlocks = function() {
    var selected_blocks = $scope.blocks.filter(function(block) { return block.selected; });
    // 1. create new root-level block
    // var view_order = getNextViewOrder();
    var view_order = Math.min.apply(null, selected_blocks.map(function(block) { return block.view_order; }));
    var new_block = new Block({
      // context and template_id are omitted from parent blocks
      experiment_id: $scope.experiment.id,
      view_order: view_order,
    });
    new_block.$save(function() {
      // 2. set all of the selected block's parent_block_id (probably blank, but maybe not) to the new block
      var promises = selected_blocks.map(function(block) {
        block.parent_block_id = new_block.id;
        return block.$save();
      });
      var promise = $q.all(promises).then(function() {
        return 'Grouped ' + promises.length + ' block(s)';
      });
      $flash(promise);
    });
  };

  /** addBlockData(contexts: any[])
  */
  var addBlockData = function(contexts) {
    var view_order = getNextViewOrder();
    var default_context = {template_id: $scope.$storage.default_template_id};

    // and then add the blocks to the table
    var block_promises = contexts.map(function(context, i) {
      context = _.extend({}, default_context, context);
      // block has properties like: context, template_id, view_order
      // handle templates that cannot be found simply by creating new ones
      // compute this outside because the promises are not guaranteed to execute in order
      return Template.findOrCreate(context).then(function(template) {
        return new Block({
          experiment_id: $scope.experiment.id,
          context: context,
          view_order: view_order + i,
          template_id: template.id,
        }).$save();
      });
    });

    return $q.all(block_promises).then(function(blocks) {
      // = Block.query({experiment_id: $scope.experiment.id});
      $scope.blocks = $scope.blocks.concat(blocks);
      return 'Added ' + block_promises.length + ' blocks';
    });
  };

  /**
  Import blocks from a file.

  Sample Excel (xlsx) spreadsheet:

      {
        lastModifiedDate: Tue Mar 04 2014 15:57:25 GMT-0600 (CST),
        name: "asch-blocks.xlsx",
        size: 34307,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        webkitRelativePath: ""
      }

  Sample JSON:

      {
        lastModified: 1429379237000,
        lastModifiedDate: Sat Apr 18 2015 12:47:17 GMT-0500 (CDT),
        name: "questions-sample-100.json",
        size: 33125,
        type: "application/json",
        webkitRelativePath: ""
      }

  */
  $scope.importFile = function(file) {
    var promise = parseTabularFile(file).then(function(data) {
      return addBlockData(data);
    }, function(err) {
      return 'Error uploading file "' + file.name + '": ' + err.toString();
    });
    $flash(promise);
  };
})
.controller('admin.experiments.edit.blocks.edit', function($scope, $localStorage, $state, $flash, Template, Block) {
  $scope.$storage = $localStorage;
  $scope.block = Block.get({
    experiment_id: $state.params.experiment_id,
    id: $state.params.block_id,
  }, function() {
    // set template_id to the default if it's not set
    _.defaults($scope.block, {template_id: $localStorage.default_template_id});
  });
  $scope.templates = Template.query();

  // the 'save' event is broadcast on rootScope when command+S is pressed
  // not sure why it doesn't work here.
  $scope.$on('save', $scope.syncBlock);

  $scope.syncBlock = function() {
    var promise = $scope.block.$save(function() {
      $state.go('^');
      // $state.go('.', {id: $scope.block.id}, {notify: false});
    }).then(function() {
      return 'Saved block';
    });
    $flash(promise);
  };
})
.directive('blocks', function(RecursionHelper) {
  return {
    restrict: 'A',
    scope: {
      blocks: '=',
    },
    templateUrl: '/ui/admin/experiments/blocks/tree.html',
    replace: true,
    link: function(scope) {
      scope.$watchCollection('blocks', function() {
        // whenever blocks change, we may need to update the parameters list
        var parameters_object = {};
        scope.blocks.forEach(function(block) {
          for (var key in block.context) {
            parameters_object[key] = 1;
          }
        });
        delete parameters_object.template;
        var parameters = _.keys(parameters_object);
        scope.parameters = parameters;
      });
    },
    // compile: RecursionHelper.compile,
    compile: function(element) {
      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element, this.link);
    }
  };
});
