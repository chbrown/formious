<!--
/templates/admin/HITs/one.bars is almost exactly the same as this section, but we want:
  1. not to show a url
  2. not to show the fields that only SearchHITs returns for a HIT (like NumberOfAssignments*)
-->
{{#hit}}
<h3 class="section">HIT: {{Title}}</h3>
<section class="box">
  <table class="keyval">
    <tr><td>HITId</td><td>{{HITId}}</td></tr>
    <tr><td>HITTypeId</td><td>{{HITTypeId}}</td></tr>
    <tr><td>CreationTime</td><td>{{CreationTime}}</td></tr>
    <tr><td>Expiration</td><td>{{Expiration}}</td></tr>
    <tr><td>Keywords</td><td>{{Keywords}}</td></tr>
    <tr><td>Description</td><td>{{Description}}</td></tr>
    <tr><td>HITStatus</td><td>{{HITStatus}}</td></tr>
    <tr><td>HITReviewStatus</td><td>{{HITReviewStatus}}</td></tr>
    <tr><td>MaxAssignments</td><td>{{MaxAssignments}}</td></tr>
    <tr><td>Reward</td><td>{{Reward.FormattedPrice}}</td></tr>
    <tr><td>AssignmentDurationInSeconds</td><td>{{AssignmentDurationInSeconds}}</td></tr>
    <tr><td>AutoApprovalDelayInSeconds</td><td>{{AutoApprovalDelayInSeconds}}</td></tr>
  </table>
</section>

<section>
  <h3>Export</h3>
  <div>
    <a href="{{HITId}}.csv">HIT_{{HITId}}.csv</a>
    &middot; <a href="{{HITId}}.csv?view">View</a>
  </div>
  <div>
    <a href="{{HITId}}.tsv">HIT_{{HITId}}.tsv</a>
    &middot; <a href="{{HITId}}.tsv?view">View</a>
  </div>
</section>
{{/hit}}

<h3 class="section">Bonuses</h3>
<section class="fill">
  <table>
    <thead>
      <tr>
        <th>WorkerId</th>
        <th>BonusAmount</th>
        <th>Reason</th>
        <th>GrantTime</th>
      </tr>
    </thead>
    <tbody>
    {{#BonusPayments}}
      <tr>
        <td>{{WorkerId}}</td>
        <td>{{BonusAmount.FormattedPrice}}</td>
        <td>{{Reason}}</td>
        <td>{{GrantTime}}</td>
      </tr>
    {{/BonusPayments}}
    </tbody>
  </table>
</section>

<h3 class="section">Assignments</h3>
<div id="assignments"></div>

<script>
var assignments = new AssignmentCollection({{{JSON.stringify(assignments)}}});
assignments.renderTo($('#assignments'), AssignmentView);
</script>
