// requires Backbone.js to be loaded
function now() { return (new Date()).getTime(); }

var TemplateView = Backbone.View.extend({
  // template: "conclusion"
  initialize: function(opts) {
    var template_id = (opts || {}).template_id || this.template_id;
    var template_content = $('#template-' + template_id).html();
    // console.log(template_content, template_id, $('#template-' + template_id));
    this.Template = Hogan.compile(template_content, {delimiters: '<% %>'});
    this.render(opts);
  },
  render: function(ctx) {
    // console.log("rendering", this.Template, ctx);
    this.$el.html(this.Template.render(ctx));
    return this;
  }
});
