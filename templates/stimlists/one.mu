<!-- <h4>Instructions</h4>
<p>You will see a series of phrases. Some of these phrases have been taken from real English texts. Others were produced by randomly combining English words. Your task is to identify the real phrases.
<p>You will see judgements from others to help you in making your decision. The number of other people whose judgement you see will vary from phrase to phrase.
 -->
<!-- <hr /> -->
<style>
.container {
  padding: 10px;
}
</style>
<div class="container">
  <div id="root"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script src="/static/local.js"></script>
<script>
var stimlist = new Stimlist({{{JSON.stringify(stimlist)}}});

function presentStim(index) {
  var states = stimlist.get('states');
  var stim = new Stim(states[index]);
  stim.on('finish', function() {
    // stim.stopListening('finish');
    presentStim(index + 1);
  });
  $('#root').empty().append(stim.$el);
}

var assignmentId = '{{assignmentId}}';
var hitId = '{{hitId}}';
var config = {
  task_started: {{task_started}},
  host: '{{host}}',
  feedback_duration: 2000,
  workerId: '{{workerId}}',
};

$(function() {
  presentStim(0);
});
</script>
