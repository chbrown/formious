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
