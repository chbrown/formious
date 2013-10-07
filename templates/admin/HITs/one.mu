{{#hit}}
<h3 class="section">HIT: {{Title}}</h3>

<section class="fill">
  <table class="keyval">
    <tr><td>HITId</td><td><a href="HITs/{{HITId}}">{{HITId}}</a></td></tr>
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
    <tr><td>NumberOfAssignmentsPending</td><td>{{NumberOfAssignmentsPending}}</td></tr>
    <tr><td>NumberOfAssignmentsAvailable</td><td>{{NumberOfAssignmentsAvailable}}</td></tr>
    <tr><td>NumberOfAssignmentsCompleted</td><td>{{NumberOfAssignmentsCompleted}}</td></tr>
  </table>
</section>

<section class="fill">
  <h3>Download</h3>
  <ul>
    <li><a href="{{HITId}}.csv">{{HITId}}.csv</a> (comma-separated)</li>
    <li><a href="{{HITId}}.tsv">{{HITId}}.tsv</a> (tab-separated)</li>
  </ul>
</section>
{{/hit}}

<section class="fill">
  <h3>Bonuses</h3>
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

<section class="fill">
  <h3>Assignments</h3>
  <div id="assignments"></div>
</section>

<script>
var assignments = new AssignmentCollection({{{JSON.stringify(assignments)}}});
assignments.renderTo($('#assignments'), AssignmentView);
</script>
