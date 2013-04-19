function now() { return (new Date()).getTime(); }

// requires Backbone and Handlebards to be loaded
var TemplateView = Backbone.View.extend({
  initialize: function(opts) {
    this.render(opts || {});
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
