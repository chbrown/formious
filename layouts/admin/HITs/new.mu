<form method="POST" action="CreateHIT" id="create">
  <fieldset><legend>Create HIT</legend>
    <div class="inputs"></div>
    <button>Create HIT</button>
  </fieldset>
</form>

<script>
[
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
].forEach(function(field) {
  var form_input = new FormInput(field)
  $('#create .inputs').append(form_input.$el);
});
</script>
