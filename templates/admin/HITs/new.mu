<h3 class="section">Create HIT</h3>

<section class="box">
  <form method="POST" action="CreateHIT" class="vform">

    <label><span>Max Assignments</span>
      <input type="text" name="MaxAssignments" />
    </label>

    <label><span>Title</span>
      <input type="text" name="Title" style="width: 500px" />
    </label>

    <label><span>Description (2000 character max)</span>
      <input type="text" name="Description" style="width: 600px" />
    </label>

    <label><span>Reward, in USD</span>
      <input type="text" name="Reward" />
    </label>

    <label><span>Comma-separated keywords</span>
      <input type="text" name="Keywords" style="width: 600px" />
    </label>

    <label><span>External URL</span>
      <input type="text" name="ExternalURL" style="width: 600px" />
    </label>

    <label><span>Frame Height</span>
      <input type="text" name="FrameHeight" />
    </label>

    <label><span>Assignment Duration (e.g., 3h)</span>
      <input type="text" name="AssignmentDuration" />
    </label>

    <label><span>Lifetime (e.g., 3d)</span>
      <input type="text" name="Lifetime" />
    </label>

    <label><span>Auto-approval Delay (e.g., 60m)</span>
      <input type="text" name="AutoApprovalDelay" />
    </label>

    <button>Create HIT</button>
  </form>
</section>

<script>
// .on('submit', function(ev) {
//   ev.preventDefault();
//   var form_obj = form.get();
// });

var form_defaults = {};
try {
  form_defaults = JSON.parse(localStorage.new_hit_defaults);
}
catch (exc) {
  console.error(exc);
}

var $form = $('form');
var form = new Form($form[0]);
form.set(form_defaults);

$form.on('change', 'input', function(ev) {
  console.log('change', ev);
  localStorage.new_hit_defaults = JSON.stringify(form.get());
});
</script>
