<main ng-controller="adminHITReviewer">
  <h3>HIT: {{hit.Title}}</h3>

  <section class="box">
    <table class="keyval">
      <tr ng-repeat="(key, val) in hit">
        <td>{{key}}</td>
        <td>{{val}}</td>
      </tr>
    </table>
  </section>

  <section class="box">
    <h3>Import</h3>
    <span class="help">Import data that was submitted to Mechanical Turk directly into the local database. Because each Assignment has a unique identifier (the AssignmentId field), duplicate imports will be ignored.</span>
    <p>
      <form method="POST" action="{{hit.HITId + '/import'}}">
        <button>Import</button>
      </form>
    </p>
  </section>

  <section class="box">
    <h3>Export</h3>
    <div>
      <a href="{{hit.HITId}}.csv">HIT_{{hit.HITId}}.csv</a>
      &middot; <a href="{{hit.HITId}}.csv?view">View</a>
    </div>
    <div>
      <a href="{{hit.HITId}}.tsv">HIT_{{hit.HITId}}.tsv</a>
      &middot; <a href="{{hit.HITId}}.tsv?view">View</a>
    </div>
  </section>

  <h3>Bonuses</h3>
  <section class="box">
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
        <tr ng-repeat="bonus_payment in bonus_payments">
          <td>{{bonus_payment.WorkerId}}</td>
          <td>{{bonus_payment.BonusAmount.FormattedPrice}}</td>
          <td>{{bonus_payment.Reason}}</td>
          <td>{{bonus_payment.GrantTime}}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <h3>Assignments</h3>
  <section class="box" ng-repeat="assignment in assignments">
    <h3>Assignment: {{assignment.AssignmentId}}</h3>

    <div ng-controller="adminAssignmentEditor">
      <div>
        Status:
        <span class="{{assignment.AssignmentStatus}}">{{assignment.AssignmentStatus}}</span>
        <span ng-switch="assignment.AssignmentStatus">
          <span ng-switch-when="Submitted">
            <button ng-click="approve(assignment, $event)">Approve</button>
            <button ng-click="reject(assignment, $event)">Reject</button>
          </span>
          <span ng-switch-when="Rejected">
            <button ng-click="approve_rejected(assignment, $event)">Unreject and Approve</button>
          </span>
        </span>
      </div>
      <div>
        <label>
          <input value="{{assignment.bonus_owed}}" placeholder="Amount">
        </label>
        <label>
          <input value="{{assignment.reason}}" placeholder="Reason">
        </label>
        <button ng-click="GrantBonus">Grant Bonus</button>
      </div>
    </div>

    <div>
      <a href="../Workers/{{assignment.WorkerId}}">Worker json</a>
      <table class="keyval">
        <!-- <tr><th colspan="2">AWS</th></tr> -->
        <tr ng-repeat="(key, val) in assignment">
          <td>{{key}}</td>
          <td>{{val}}</td>
        </tr>
        <tr ng-repeat="answer in assignment.Answers">
          <td>{{answer.QuestionIdentifier}}</td>
          <td>{{answer.FreeText}}</td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 10px; white-space: nowrap;">
      <!-- <worker worker-id="" class="responses"></worker> -->
    </div>


  </section>
</main>

<script>
var hit = <%& serialize(hit) %>;
var bonus_payments = <%& serialize(bonus_payments) %>;
var assignments = <%& serialize(assignments) %>;
</script>
