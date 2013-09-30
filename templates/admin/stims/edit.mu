<section>
  <h3>Stim Template: {{stim._id}}</h3>
  <a href="/templates/stims/{{stim.name}}.bars">{{stim.name}}</a>
</section>

<section class="fill vform" id="stim">
  <label><span>Name</span>
    <input name="name" type="text" value="{{stim.name}}" />
  </label>

  <label><span>HTML</span>
    <textarea name="html" placeholder="HTML / Handlebars content"
      style="min-height: 300px; width: 100%" class="code">{{{stim.html}}}</textarea>
  </label>

  <button>Save</button>
</section>

<script src="/static/lib/jquery-flexibleArea.js"></script>
<script>
var StimTemplateView = Backbone.View.extend({
  events: {
    'click button': function(ev) {
      var attrs = {
        name: $('[name=name]').val(),
        html: $('[name=html]').val(),
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

$('textarea').flexible();

var StimTemplate = Backbone.Model.extend({
  urlRoot: '/admin/stims',
  idAttribute: '_id'
});

var stim_template = new StimTemplate({{{JSON.stringify(stim)}}});
var stim_template_view = new StimTemplateView({model: stim_template, el: $('#stim')});
</script>
