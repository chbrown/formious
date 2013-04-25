<div class="assignment">
  <h3>Assignment: {{AssignmentId}}</h3>

  <div class="controls" style="float: left; width: 32%;">
    <fieldset class="status">
      <legend>Status</legend>
      <span class="{{AssignmentStatus}}">{{AssignmentStatus}}</span>
      {{#Submitted}}
        <button data-action="ApproveAssignment">Approve</button>
        <button data-action="RejectAssignment">Reject</button>
      {{/Submitted}}
      {{#Rejected}}
        <button data-action="ApproveRejectedAssignment">Unreject and Approve</button>
      {{/Rejected}}
    </fieldset>

    <fieldset class="bonus">
      <legend>Bonus</legend>
      <label>Amount: <input name="amount" value="{{bonus_owed}}" /></label>
      <label>Reason: <input name="reason" value="{{reason}}" style="width: 200px" /></label>
      <button data-action="GrantBonus">Grant Bonus</button>
    </fieldset>
  </div>

  <table class="keyval" style="float: left; width: 64%;">
    <tr><td>WorkerId</td><td>{{WorkerId}} <a href="../Workers/{{WorkerId}}">json</a></td></tr>
    <tr><td>AutoApprovalTime</td><td>{{AutoApprovalTime}}</td></tr>
    <tr><td>AcceptTime</td><td>{{AcceptTime}}</td></tr>
    <tr><td>SubmitTime</td><td>{{SubmitTime}}</td></tr>
    {{#Approved}}
      <tr><td>ApprovalTime</td><td>{{ApprovalTime}}</td></tr>
    {{/Approved}}
    {{#Rejected}}
      <tr><td>RejectionTime</td><td>{{RejectionTime}}</td></tr>
    {{/Rejected}}
    <tr><th colspan="2">Responses</th></tr>
    {{#Answer}}
      <tr><td>{{QuestionIdentifier}}</td><td>{{FreeText}}</td></tr>
    {{/Answer}}
    {{#user_fields}}
      <tr><td>{{key}}</td><td>{{value}}</td></tr>
    {{/user_fields}}
  </table>

  <div style="clear: both">
    <button class="responses">Load responses</button>
  </div>
</div>

