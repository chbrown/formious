<h2 title="AssignmentId">{{AssignmentId}}</h2>

<div class="ids" title="WorkerId">
  {{WorkerId}} <a href="../Workers/{{WorkerId}}">json</a>
</div>

<div class="times details">
  <div><dfn>AutoApprovalTime</dfn> {{AutoApprovalTime}}</div>
  <div><dfn>AcceptTime</dfn> {{AcceptTime}}</div>
  <div><dfn>SubmitTime</dfn> {{SubmitTime}}</div>

  {{#Approved}}
    <div><dfn>ApprovalTime</dfn> {{ApprovalTime}}</div>
  {{/Approved}}
  {{#Rejected}}
    <div><dfn>RejectionTime</dfn> {{RejectionTime}}</div>
  {{/Rejected}}
</div>

<div class="status">
  <span class="{{AssignmentStatus}}">{{AssignmentStatus}}</span>
  {{#Submitted}}
    <button data-action="ApproveAssignment">Approve</button>
    <button data-action="RejectAssignment">Reject</button>
  {{/Submitted}}
  {{#Rejected}}
    <button data-action="ApproveRejectedAssignment">Unreject and Approve</button>
  {{/Rejected}}
</div>

<div class="bonus">
  <label>Amount: <input name="amount" value="{{bonus_owed}}" /></label>
  <label>Reason: <input name="reason" value="{{reason}}" /></label>
  <button data-action="GrantBonus">Grant Bonus</button>
</div>

<div class="details">
  {{#Answer}}
    <div><dfn>{{QuestionIdentifier}}</dfn> {{FreeText}}</div>
  {{/Answer}}
  {{#user_fields}}
    <div><dfn>{{key}}</dfn> {{value}}</div>
  {{/user_fields}}
</div>

<button class="load-responses">Load responses</button>
