<div class="admin">

  <h2>Accounts</h2>
  <ul>
  {{#accounts}}
    <li><a href="/accounts/{{id}}/{{aws_host_id}}/dashboard">{{id}}</a> ({{accessKeyId}})
  {{/}}
  </ul>

  <h3>Hosts</h3>
  <ul>
  {{#aws_hosts}}
    <li><a href="/accounts/{{account_id}}/{{id}}/dashboard">{{id}}</a> ({{url}})
  {{/}}
  </ul>

  <h3>Available Funds</h3>
  {{available_price.FormattedPrice}}

  <h2>HITs</h2>
  <ul>
    <li><a href="HITs">View HITs</a></li>
  </ul>

  <form method="POST" action="CreateHIT" id="create">
    <fieldset>
      <legend>Create Hit</legend>
      <div class="inputs"></div>
      <button>Create HIT</button>
    </fieldset>
  </form>

</div>


<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script>
var Response = Backbone.Model.extend({
  url: '/responses'
});

var FormInput = TemplateView.extend({
  template: 'form-input.mu',
  preRender: function(ctx) {
    this.id = ctx.id;
    ctx.label = ctx.label || this.id;
    ctx.value = localStorage[this.id];
  },
  postRender: function(ctx) {
    // window.form = this;
    // console.log(this.$('input'),
    this.$('input').css({width: ctx.width});
  },
  events: {
    'change input': function(ev) {
      // this.$('input')
      var value = ev.target.value;
      localStorage[this.id] = value;
    }
  }
});

var create_hit_fields = [
  {
    id: 'MaxAssignments',
  },
  {
    id: 'Title',
    width: '600',
  },
  {
    id: 'Description',
    label: 'Description (2000 character max)',
    width: '600',
  },
  {
    id: 'Reward',
    label: 'Reward, in USD',
  },
  {
    id: 'Keywords',
    label: 'Comma-separated keywords',
    width: '600',
  },
  {
    id: 'ExternalURL',
    width: '600',
  },
  {
    id: 'FrameHeight',
  },
  {
    id: 'AssignmentDuration',
    label: 'Assignment Duration (e.g., 3h)',
  },
  {
    id: 'Lifetime',
    label: 'Lifetime (e.g., 3d)',
  },
  {
    id: 'AutoApprovalDelay',
    label: 'Auto-approval Delay (e.g., 60m)',
  },
];

create_hit_fields.forEach(function(field) {
  var form_input = new FormInput(field)
  $('#create .inputs').append(form_input.$el);
});

</script>

