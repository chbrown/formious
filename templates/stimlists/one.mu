<div class="container" style="padding: 10px">
  <div id="root"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script src="/static/local.js"></script>
<script>
// the context is given to all stims, in case they want the values
var context = {
  assignmentId: '{{assignmentId}}',
  hit_started: {{hit_started}},
  hitId: '{{hitId}}',
  host: '{{host}}',
  workerId: '{{workerId}}'
};

// stim_globals will be merged onto each response payload
var stim_globals = new Backbone.Model({
  hit_started: context.hit_started,
  stimlist: '{{slug}}'
});

var states = {{{JSON.stringify(states)}}};

function presentStim(index) {
  var state = states[index];
  var stim = new StimView(_.extend({model: stim_globals}, context, state));
  stim.on('finish', function() {
    // stim.stopListening('finish') ?
    presentStim(index + 1);
  });
  $('#root').empty().append(stim.$el);
}

$(function() {
  presentStim({{index}});
});
</script>
