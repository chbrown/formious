<fieldset><legend>Create HIT</legend>
  <form method="POST" action="CreateHIT">
    <button type="submit">Create HIT</button>
  </form>
</fieldset>

<script>
var fields = [
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

var FormInput = TemplatedView.extend({
  template: 'form-input',
  preRender: function(ctx) {
    this.id = ctx.id;
    ctx.label = ctx.label || this.id;
    ctx.value = localStorage[this.id];
  },
  postRender: function(ctx) {
    // window.form = this;
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

fields.reverse().forEach(function(field) {
  var form_input = new FormInput(field);
  $('form').prepend(form_input.$el);
});
</script>
