<!-- <h4>Instructions</h4>
<p>You will see a series of phrases. Some of these phrases have been taken from real English texts. Others were produced by randomly combining English words. Your task is to identify the real phrases.
<p>You will see judgements from others to help you in making your decision. The number of other people whose judgement you see will vary from phrase to phrase.
 -->
<!-- <hr /> -->
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

var stimlist = new Stimlist({{{JSON.stringify(stimlist)}}});

function presentStim(index) {
  var states = stimlist.get('states');
  var state = states[index];
  var stim = new Stim(_.extend({}, context, state));
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
