// requires Backbone.js to be loaded
function now() { return (new Date()).getTime(); }

var TemplateView = Backbone.View.extend({
  initialize: function(opts) {
    this.template = (opts || {}).template_id || this.template;
    this.render(opts);
  },
  render: function(ctx) {
    var Template = Handlebars.templates[this.template];
    this.$el.html(Template(ctx));
    return this;
  }
});
