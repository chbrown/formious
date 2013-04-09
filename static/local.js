// requires Backbone.js to be loaded
function now() { return (new Date()).getTime(); }

var TemplateView = Backbone.View.extend({
  // template: "conclusion"
  initialize: function(opts) {
    var name = (opts || {}).template_id || this.template_id;
    this.template_id = 'aircraft-' + name + '.mu';
    // var template_content = $().html();
    // console.log(template_content, template_id, $('#template-' + template_id));
    // this.Template = Hogan.compile(template_content, {delimiters: '<% %>'});
    this.render(opts);
  },
  render: function(ctx) {
    // console.log("rendering", this.Template, ctx);
    var Template = Handlebars.templates[this.template_id];
    this.$el.html(Template(ctx));
    return this;
  }
});
