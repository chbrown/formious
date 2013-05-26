"use strict"; /*jslint indent: 2, es5: true */ /*globals _, $, Backbone, Handlebars */
function now() { return (new Date()).getTime(); }





// handlebars debug / caching
var _cache = {};
function renderHandlebars(template_name, context, debug) {
  // returns html
  // not necessarily truly async
  if (debug === undefined) {
    // DEBUG is a special global, which may be missing.
    debug = typeof(DEBUG) != 'undefined' && DEBUG;
  }

  var template;
  if (debug) {
    // only cache once per page load (this is debug, after all)
    template = _cache[template_name];
    if (template === undefined) {
      $.ajax({
        url: '/templates/' + template_name,
        async: false,
        success: function(template_src) {
          template = _cache[template_name] = Handlebars.compile(template_src);
        }
      });
    }
  }
  else {
    template = Handlebars.templates[template_name];
  }
  return template(context);
}





function makeTable(cols, data) {
  var trs = data.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}





// requires Backbone and Handlebars to be loaded
var TemplateView = Backbone.View.extend({
  initialize: function(opts) {
    // prePreRender
    var ctx = _.extend(this.model ? this.model.toJSON() : {}, opts);
    this.render(ctx);
    if (this.postInitialize) this.postInitialize(ctx);
  },
  render: function(ctx) {
    var self = this;
    if (this.preRender) this.preRender(ctx);
    self.el.innerHTML = renderHandlebars(this.template, ctx);
    if (this.postRender) this.postRender(ctx);
    if (ctx.replace) {
      // if .replace is given, it's the parent node that this new view should
      // attach to, replacing the old contents.
      ctx.replace.replaceWith(this.$el);
    }
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







// ####### ADMIN #######
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

var TurkWorker = Backbone.Model.extend({
  urlRoot: '../Workers'
});
// var WorkerCollection = TemplatedCollection.extend({
//   url: '../Workers'
// });

// ####### EXPERIMENT #######
var Response = Backbone.Model.extend({
  url: '/responses'
});
