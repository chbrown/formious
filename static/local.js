"use strict"; /*jslint indent: 2, es5: true */
function now() { return (new Date()).getTime(); }

function makeTable(cols, data) {
  var trs = data.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}

// requires Backbone and Handlebards to be loaded
var TemplateView = Backbone.View.extend({
  initialize: function(opts) {
    this.render(opts || {});
  },
  preRender: function(ctx) {
    if (this.model) {
      _.extend(ctx, this.model.toJSON());
    }
  },
  render: function(ctx) {
    if (this.preRender) this.preRender(ctx);
    this.el.innerHTML = Handlebars.templates[this.template](ctx);
    if (this.postRender) this.postRender(ctx);
    return this;
  }
});

var TemplatedCollection = Backbone.Collection.extend({
  renderTo: function($el, View) {
    var fragment = document.createDocumentFragment();
    this.each(function(model) {
      var ctx = model.toJSON();
      ctx.model = model;
      var view = new View(ctx);
      fragment.appendChild(view.el);
    });
    $el.append(fragment);
  }
});

var HIT = Backbone.Model.extend({});
var HITCollection = TemplatedCollection.extend({url: 'hits'});
var HITView = TemplateView.extend({
  template: 'hit.mu',
});

var Assignment = Backbone.Model.extend({
  idAttribute: 'AssignmentId'
});
var AssignmentCollection = TemplatedCollection.extend({
  model: Assignment,
  url: '../Assignments',
});

var Worker = Backbone.Model.extend({
  urlRoot: '../Workers'
});
// var WorkerCollection = TemplatedCollection.extend({
//   url: '../Workers'
// });
