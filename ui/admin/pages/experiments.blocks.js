import React from 'react';
import _ from 'lodash';

export class BlocksTree extends React.Component {
  render() {
    return (
      <div>
        <table className="striped grid padded fill blocks">
          <thead>
            <tr>
              <th></th>
              <th>block_id</th>
              <th>template/block params</th>
              <th ng-repeat="parameter in parameters">
                {parameter}
              </th>
              <th>view_order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr ng-repeat="block in blocks | orderBy:'view_order'" ng-className="{container: !block.template_id}">
              <td style="padding-right: 5px">
                <input type="checkbox" ng-model="block.selected" />
              </td>
              <td>
                <span>{block.id || 'unsaved'}</span>
                <a ng-click="block.editing = !block.editing">{block.editing ? 'View' : 'Edit'}</a>
              </td>
              {/* swap (template_id, context) / (randomize, children) */}
              {/* stim-type blocks */}
              <td ng-if="block.template_id">
                <a-template ng-if="!block.editing" template-id="{block.template_id}" className="nowrap"></a-template>
                <select-template ng-if="block.editing" model="block.template_id" ></select-template>
              </td>
              <td ng-if="block.template_id && !block.editing" ng-repeat="parameter in parameters">
                <span ng-bind="block.context[parameter]"></span>
              </td>
              <td ng-if="block.template_id && block.editing" colspan="{parameters.length}">
                <jsonarea ng-model="block.context" style="width: 100%; height: 100px; font: 8pt monospace;"></jsonarea>
              </td>
              {/* container-type blocks */}
              <td ng-if="!block.template_id" colspan="{parameters.length + 1}" style="padding: 0">
                <div>
                  Block:
                  <label>
                    <input type="checkbox" ng-model="block.randomize" /> Randomize
                  </label>
                  <label>
                    <b>Quota</b>: <input type="number" ng-model="block.quota" />
                  </label>
                  <button ng-click="$emit('collapseBlock', block)">Collapse</button>
                </div>

                <div blocks="block.children"></div>
              </td>
              {/* the rest are common to both types of blocks */}
              <td>
                <input ng-if="block.editing" type="number" ng-model="block.view_order" step="any" style="width: 50px" />
                <span ng-if="!block.editing">{block.view_order}</span>
              </td>
              <td className="nowrap">
                <a href="/experiments/{block.experiment_id}/blocks/{block.id}?workerId=testing" target="_blank">Public</a>
                <button ng-click="$emit('deleteBlock', block)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export class BlocksTable extends React.Component {
  render() {
    return (
      <div>
        <section className="box hpad">
          <form className="vform">
            <label className="block">
              <div><b>Default template</b></div>
              <select ng-model="$storage.default_template_id"
                ng-options="template.id as template.name for template in templates"></select>
            </label>
            <label className="block">
              <div><b>Import blocks from file</b></div>
              <input type="file" ng-upload="importFile($file)" />
            </label>
          </form>
        </section>

        <section className="box vpad">
          <div blocks="root.children" checkbox-sequence style="font-size: 90%"></div>
        </section>

        <nav fixedflow style="bottom: 0; border-top: 1px solid #BBB; padding: 5px; background-color: #EEE;">
          <ui-view>
            <button ng-click="deleteSelectedBlocks()">Delete selection</button>
            <button ng-click="groupSelectedBlocks()">Group selection</button>
            <button ng-click="saveTree()">Save tree</button>
            <button ng-click="addEmptyBlock()">Add empty block</button>
          </ui-view>
        </nav>
      </div>
    );
  }
}

export class BlocksEdit extends React.Component {
  render() {
    return (
      <div>
        <form ng-submit="syncBlock($event)">
          <div style="display: inline-block; min-width: 200px; vertical-align: top;">
            <label>
              <div><b>Parent Block ID</b></div>
              <input type="number" ng-model="block.parent_block_id" disabled />
            </label>

            <label>
              <div>
                <input type="checkbox" ng-model="block.randomize" /> <b>Randomize</b>
              </div>
            </label>

            <label>
              <div><b>Quota</b></div>
              <input type="number" ng-model="block.quota" />
            </label>

            <label>
              <div><b>Template</b></div>
              <select-template model="block.template_id"></select-template>
            </label>

            <label>
              <div><b>View order</b></div>
              <input type="number" ng-model="block.view_order" step="any" />
            </label>

            <p><button>Save</button></p>
          </div>

          <div style="display: inline-block; vertical-align: top;">
            <label>
              <div><b>Context</b></div>
              <jsonarea ng-model="block.context" style="width: 600px; height: 100px; font: 8pt monospace;"></jsonarea>
            </label>
          </div>
        </form>
      </div>
    );
  }
}





/**
interface Node {
  children: Node[];
}

The `nodes` argument to each static function should implement the Node interface above.
*/
export class Node {
  /**
  Returns new Nodes
  */
  static recursiveFilter(nodes, predicateFunction) {
    return nodes.filter(predicateFunction).map(node => {
      return Object.assign({}, node, {children: Node.recursiveFilter(node.children, predicateFunction)});
    });
  }

  /**
  Returns new Nodes
  */
  static recursiveTransform(nodes, transformFunction) {
    return nodes.map(node => {
      return Object.assign({}, transformFunction(node),
        {children: Node.recursiveTransform(node.children, transformFunction)});
    });
  }

  /**
  jslint complains about the *, but it's fine.

  This is a search function, and doesn't copy anything, because it doesn't change anything.
  */
  static* depthFirstSearch(nodes, predicateFunction) {
    for (var node, i = 0; (node = nodes[i]); i++) {
      if (predicateFunction(node)) {
        yield node;
      }
      yield* Node.depthFirstSearch(node.children, predicateFunction);
    }
  }
}

function pluralize(singular, array) {
  if (array.length == 1) {
    return singular;
  }
  return singular + 's';
}

app
.controller('admin.experiments.edit.blocks', function($scope, $q, $http, $localStorage, $state,
  Template, Block, parseTabularFile) {
  $scope.$storage = $localStorage;
  $scope.templates = Template.query();
  var root = $scope.root = {children: []};

  // Block.queryTree({experiment_id: $state.params.experiment_id}).then(function(blocks) {});
  $http.get(`/api/experiments/${$state.params.experiment_id}/blocks/tree`).then(res => {
    root.children = res.data;
  });

  function getNextViewOrder() {
    var max_view_order = Math.max.apply(Math, _.pluck(root.children, 'view_order'));
    return Math.max(max_view_order, 0) + 1;
  }

  $scope.$on('deleteBlock', function(ev, deleted_block) {
    root.children = Node.recursiveFilter(root.children, block => block !== deleted_block);
  });

  $scope.deleteSelectedBlocks = function() {
    root.children = Node.recursiveFilter(root.children, block => !block.selected);
  };

  $scope.$on('collapseBlock', function(ev, collapsed_block) {
    // 1. find the parent of the collapsed_block
    var parent_block = Node.depthFirstSearch([root],
      block => block.children.includes(collapsed_block)).next().value;
    // 2. add the collapsed_block's children to the parent
    parent_block.children = parent_block.children.concat(collapsed_block.children);
    // 3. remove the collapsed_block from the parent
    parent_block.children = parent_block.children.filter(block => block !== collapsed_block);
  });

  /**
  Move the selected blocks into a new block of their own.
  */
  $scope.groupSelectedBlocks = function() {
    var selected_blocks = Array.from(Node.depthFirstSearch(root.children, block => block.selected));
    if (selected_blocks.length === 0) {
      throw new Error('Cannot group empty selection');
    }
    // set the parent's view_order to the lowest view_order in the selection
    var view_order = Math.min.apply(null, selected_blocks.map(block => block.view_order));
    // 1. if the selected blocks all have the same parent block, group them
    //   inside it, otherwise, group them inside the root block.
    var original_parent_blocks = selected_blocks.map(selected_block => {
      return Node.depthFirstSearch([root],
        block => block.children.includes(selected_block)).next().value;
    });
    // determine if all the items in original_parent_blocks are the same
    var common_parent = original_parent_blocks.every(parent_block => parent_block === original_parent_blocks[0]);
    // use the root block as the new parent_block unless all selected_blocks are siblings
    var parent_block = common_parent ? original_parent_blocks[0] : root;
    function transformFunction(block) {
      // 2. remove the selection from the current tree
      // compute the new_children as children without selected_blocks
      var new_children = block.children
        .filter(child_block => !selected_blocks.includes(child_block))
        .map(transformFunction);
      if (block === parent_block) {
        // 3. create new block with the selected blocks as its children, and add
        // it to the designated parent block
        new_children.push({
          // context and template_id are omitted from parent blocks
          experiment_id: $scope.experiment.id,
          view_order: view_order,
          children: selected_blocks,
        });
      }
      return Object.assign({}, block, {children: new_children});
    }
    root = $scope.root = transformFunction(root);
  };

  $scope.addEmptyBlock = () => {
    var view_order = getNextViewOrder();
    root.children = root.children.concat({
      children: [],
      experiment_id: $scope.experiment.id,
      context: {},
      view_order: view_order,
      template_id: $scope.$storage.default_template_id,
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
  $scope.importFile = (file) => {
    var promise = parseTabularFile(file).then(records => {
      // and then add the blocks to the table
      var view_order = getNextViewOrder();
      var blocks_lookup = {};
      // iterate through the given flat list of blocks.
      records.forEach((context, i) => {
        // block has properties like: context, template_id, view_order
        // handle templates that cannot be found simply by creating new ones
        // compute this outside because the promises are not guaranteed to execute in order
        // return Template.findOrCreate(context).then(template => {
        var block = {
          experiment_id: $scope.experiment.id,
          context: context,
          view_order: view_order + i,
          // created: assigned automatically
          randomize: context.randomize === 'true',
          // children is a UI-side abstraction
          children: [],
        };

        if (context.quota) {
          block.quota = parseInt(context.quota, 10);
        }

        // 1) if a node has a block_id field, add that node to a list of lookup-nodes
        if (context.block_id) {
          blocks_lookup[context.block_id] = block;
        }
        // 1b) otherwise, it should have a template_id
        else {
          block.template_id = $scope.$storage.default_template_id;
        }
        // 2a) if a node has a parent_block_id field, add it to that node's children
        if (context.parent_block_id) {
          blocks_lookup[context.parent_block_id].children.push(block);
        }
        // 2b) otherwise, add it to the root's children
        else {
          root.children.push(block);
        }
      });

      return `Added ${records.length} blocks`;
    }, err => {
      return `Error uploading file "${file.name}": ${err.toString()}`;
    });
    NotifyUI.addPromise(promise);
  };

  $scope.saveTree = () => {
    var url = `/api/experiments/${$state.params.experiment_id}/blocks/tree`;
    var promise = $http.put(url, root.children).then(() => {
      return 'Saved all blocks';
    });
    NotifyUI.addPromise(promise);
  };
})
// .controller('admin.experiments.edit.block', ($scope, $localStorage, $state,
//   Template, Block) => {
//   $scope.$storage = $localStorage;
//   $scope.block = Block.get({
//     experiment_id: $state.params.experiment_id,
//     id: $state.params.block_id,
//   }, function() {
//     // set template_id to the default if it's not set
//     _.defaults($scope.block, {template_id: $localStorage.default_template_id});
//   });
//   $scope.templates = Template.query();

//   // the 'save' event is broadcast on rootScope when command+S is pressed
//   // not sure why it doesn't work here.
//   $scope.$on('save', $scope.syncBlock);

//   $scope.syncBlock = function() {
//     var promise = $scope.block.$save(function() {
//       $state.go('^');
//       // $state.go('.', {id: $scope.block.id}, {notify: false});
//     }).then(function() {
//       return 'Saved block';
//     });
//     NotifyUI.addPromise(promise);
//   };
// })
.directive('blocks', (RecursionHelper) => {
  return {
    restrict: 'A',
    scope: {
      blocks: '=',
    },
    templateUrl: '/ui/admin/experiments/blocks/tree.html',
    replace: true,
    link: function(scope) {
      scope.$watchCollection('blocks', () => {
        // whenever blocks change, we may need to update the parameters list
        var parameters_object = {};
        scope.blocks.forEach(block => {
          for (var key in block.context) {
            parameters_object[key] = 1;
          }
        });
        delete parameters_object.template;
        var parameters = _.keys(parameters_object);
        scope.parameters = parameters;
      });
    },
    compile: function(element) {
      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element, this.link);
    }
  };
});

