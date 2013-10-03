<div class="container" style="padding: 10px">
  <div id="root"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script src="/static/local.js"></script>
<script>
// stim_globals is given to all stims, in case they want the values. it's mostly metadata, compared to the states.
var stim_globals = {
  assignmentId: '{{assignmentId}}',
  hit_started: {{hit_started}},
  hitId: '{{hitId}}',
  host: '{{host}}',
  workerId: '{{workerId}}',
  stimlist: '{{slug}}'
};

var states = {{{JSON.stringify(states)}}};

function presentStim(index) {
  var state = states[index];
  // hopefully stim_globals and state won't conflict
  var stim_context = _.extend({}, stim_globals, state);
  var stim = new StimView(stim_context);
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
