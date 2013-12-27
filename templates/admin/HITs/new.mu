<h3 class="section">Create HIT</h3>

<form method="POST" action="CreateHIT" class="vform">
  <section class="box">
    <label title="The number of times the HIT can be accepted and completed before the HIT becomes unavailable">
      <span>Max Assignments</span>
      <input type="text" name="MaxAssignments" />
    </label>

    <label title="The title of the HIT. A title should be short and descriptive about the kind of task the HIT contains">
      <span>Title</span>
      <input type="text" name="Title" style="width: 500px" />
    </label>

    <label>
      <span>Description (2000 character max)</span>
      <input type="text" name="Description" style="width: 500px" />
    </label>

    <label title="The amount of money the Requester will pay a Worker for successfully completing the HIT">
      <span>Reward, in USD</span>
      <input type="text" name="Reward" />
    </label>

    <label title="One or more words or phrases that describe the HIT, separated by commas">
      <span>Keywords</span>
      <input type="text" name="Keywords" style="width: 500px" />
    </label>

    <label title="The amount of time that a Worker has to complete the HIT after accepting it">
      <span>Assignment Duration (e.g., 3h)</span>
      <input type="text" name="AssignmentDuration" />
    </label>

    <label title="The amount of time that a HIT can be accepted; after the lifetime expires, the HIT no longer appears in searches">
      <span>Lifetime (e.g., 3d)</span>
      <input type="text" name="Lifetime" />
    </label>

    <label title="The amount of time after a HIT has been submitted before the assignment is automatically approved">
      <span>Auto-approval Delay (e.g., 60m)</span>
      <input type="text" name="AutoApprovalDelay" />
    </label>
  </section>

  <h3 class="section">External</h3>
  <section class="box">
    <label title="The URL of your web form, to be displayed in a frame in the Worker's web browser">
      <span>External URL</span>
      <input type="text" name="ExternalURL" style="width: 500px" />
    </label>

    <label title="The height of the frame, in pixels">
      <span>Frame Height (integer)</span>
      <input type="text" name="FrameHeight" />
    </label>

    <button>Create HIT</button>
  </section>
</form>

<section>
  <h3>Preview</h3>
  <div style="border: 1px dotted #4d8">
    <iframe scrolling="auto" height="580" width="100%" frameborder="0" align="center" name="ExternalQuestionIFrame" src=""></iframe>
  </div>
</div>

<script>
var form_defaults = {
  MaxAssignments: '20',
  Title: 'Exciting task!',
  Description: 'Look at some cool pictures and answer a lot of really easy questions.',
  Reward: '0.05',
  Keywords: 'linguistic,verbal,words,meaning,research',
  AssignmentDuration: '2h',
  Lifetime: '12h',
  AutoApprovalDelay: '24h',
  FrameHeight: '580'
};

try {
  form_defaults = JSON.parse(localStorage.new_hit_defaults);
}
catch (exc) {
  // look seriously it's not a big deal so don't worry about it alright?
  console.error(exc);
}

var $form = $('form');
var form = new Form($form[0]);
form.set(form_defaults);

$form.on('change', 'input', function(ev) {
  localStorage.new_hit_defaults = JSON.stringify(form.get());
});

// handle preview updating (based on url and frame height)
var preview_frame = $('iframe[name="ExternalQuestionIFrame"]');

$('[name="FrameHeight"]').on('change', function(ev) {
  preview_frame.attr('height', this.value);
}).trigger('change');

$('[name="ExternalURL"]').on('change', function(ev) {
  var original_url = this.value;

  // use native DOM url manipulation (thanks to https://gist.github.com/jlong/2428561)
  var anchor = document.createElement('a');
  anchor.href = original_url;

  var search_parts = anchor.search ? anchor.search.slice(1).split('&') : [];
  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo
  search_parts.push(
    // Once assigned, assignmentId is a 30-character alphadecimal mess
    'assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE',
    'hitId=0PREVIEWPREVIEWPREVIEWPREVIEW9',
    'workerId={{ticket_user._id}}', // interpolate current user's id
    // turkSubmitTo is normally https://workersandbox.mturk.com/ or https://www.mturk.com
    'turkSubmitTo=//'
  );
  // http://turk.enron.me/stimlists/phrasestudy1?segment=11
  anchor.search = '?' + search_parts.join('&');

  var preview_url = anchor.href;
  preview_frame.attr('src', preview_url).attr('title', preview_url);
}).trigger('change');
</script>
