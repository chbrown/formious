<section>
  <h3>Stim Template: {{stim._id}}</h3>
  <a href="/templates/stims/{{stim.name}}.bars">View</a> &middot;
  <a href="clone">Clone</a>
</section>

<section class="fill vform" id="stim">
  <label><span>Name</span>
    <input name="name" type="text" value="{{stim.name}}" style="width: 30em" />
  </label>

  <label><span>HTML</span>
    <textarea name="html" placeholder="HTML / Handlebars content" style="width: 100%" class="code">{{stim.html}}</textarea>
  </label>

  <button>Save</button>
</section>

<script>
var StimTemplateView = Backbone.View.extend({
  events: {
    'click button': function(ev) {
      var attrs = {
        name: $('[name="name"]').val(),
        html: $('[name="html"]').val(),
      };
      this.model.save(attrs, {
        patch: true,
        success: function(model, response, options) {
          $(ev.target).flag({text: 'Saved successfully', fade: 3000});
        }
      });
    },
  }
});

var StimTemplate = Backbone.Model.extend({
  urlRoot: '/admin/stims',
  idAttribute: '_id'
});

var stim_template = new StimTemplate({{{JSON.stringify(stim)}}});
var stim_template_view = new StimTemplateView({model: stim_template, el: $('#stim')});
</script>

<script src="/static/lib/textarea.js"></script>
<script>
var textarea = document.querySelector('textarea');
var textarea_enhanced = Textarea.enhance(textarea);
</script>
