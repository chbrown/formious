<h2 title="AssignmentId">{{AssignmentId}}</h2>

<p class="ids" title="WorkerId">{{WorkerId}} <a href="../Workers/{{WorkerId}}">json</a></p>

<p class="times details">
  <div><dfn>AutoApprovalTime</dfn> {{AutoApprovalTime}}</div>
  <div><dfn>AcceptTime</dfn> {{AcceptTime}}</div>
  <div><dfn>SubmitTime</dfn> {{SubmitTime}}</div>
</p>

<div class="status">
  <h3>{{AssignmentStatus}}</h3>
  <button class="approve">Approve</button>
</div>

<div class="details">
  {{#Answer}}
    <div><dfn>{{QuestionIdentifier}}</dfn> {{FreeText}}</div>
  {{/Answer}}
  {{#user_fields}}
    <div><dfn>{{key}}</dfn> {{value}}</div>
  {{/user_fields}}
</div>

<button class="responses">Load responses</button>
