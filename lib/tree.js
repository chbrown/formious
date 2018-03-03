var _ = require('lodash');

function recursiveFilter(nodes, predicateFunction) {
  return nodes.filter(predicateFunction).map(function(node) {
    return _.assign({}, node, {children: recursiveFilter(node.children, predicateFunction)});
  });
}
exports.recursiveFilter = recursiveFilter;

function recursiveTransform(nodes, transformFunction) {
  return nodes.map(function(node) {
    return _.assign({}, transformFunction(node),
      {children: recursiveTransform(node.children, transformFunction)});
  });
}
exports.recursiveTransform = recursiveTransform;

function recursiveSearch(nodes, predicateFunction) {
  var results = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (predicateFunction(node)) {
      results.push(node);
    }
    Array.prototype.push.apply(results, recursiveSearch(node.children, predicateFunction));
  }
  return results;
}
exports.recursiveSearch = recursiveSearch;

/**
Returns the first result.
*/
function recursiveFind(nodes, predicateFunction) {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (predicateFunction(node)) {
      return node;
    }
    var children_result = recursiveFind(node.children, predicateFunction);
    if (children_result) {
      return children_result;
    }
  }
}
exports.recursiveFind = recursiveFind;

/**
depth-first recursion helper
*/
function recursiveEach(nodes, fn) {
  nodes.forEach(function(node) {
    fn(node);
    recursiveEach(node.children, fn);
  });
}
exports.recursiveEach = recursiveEach;
