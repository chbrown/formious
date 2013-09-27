(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['admin/HITs/one'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"hit\">\n  <h2>HIT: ";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n  <table class=\"keyval\">\n    <tr><td>HITId</td><td><a href=\"HITs/";
  if (stack1 = helpers.HITId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.HITId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.HITId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.HITId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></td></tr>\n    <tr><td>HITTypeId</td><td>";
  if (stack1 = helpers.HITTypeId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.HITTypeId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>CreationTime</td><td>";
  if (stack1 = helpers.CreationTime) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.CreationTime; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>Expiration</td><td>";
  if (stack1 = helpers.Expiration) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Expiration; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>Keywords</td><td>";
  if (stack1 = helpers.Keywords) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Keywords; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>Description</td><td>";
  if (stack1 = helpers.Description) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Description; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>HITStatus</td><td>";
  if (stack1 = helpers.HITStatus) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.HITStatus; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>HITReviewStatus</td><td>";
  if (stack1 = helpers.HITReviewStatus) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.HITReviewStatus; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>MaxAssignments</td><td>";
  if (stack1 = helpers.MaxAssignments) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.MaxAssignments; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n    <tr><td>Reward</td><td>"
    + escapeExpression(((stack1 = ((stack1 = depth0.Reward),stack1 == null || stack1 === false ? stack1 : stack1.FormattedPrice)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td></tr>\n    <tr><td>AssignmentDurationInSeconds</td><td>";
  if (stack2 = helpers.AssignmentDurationInSeconds) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.AssignmentDurationInSeconds; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n    <tr><td>AutoApprovalDelayInSeconds</td><td>";
  if (stack2 = helpers.AutoApprovalDelayInSeconds) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.AutoApprovalDelayInSeconds; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n    <tr><td>NumberOfAssignmentsPending</td><td>";
  if (stack2 = helpers.NumberOfAssignmentsPending) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.NumberOfAssignmentsPending; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n    <tr><td>NumberOfAssignmentsAvailable</td><td>";
  if (stack2 = helpers.NumberOfAssignmentsAvailable) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.NumberOfAssignmentsAvailable; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n    <tr><td>NumberOfAssignmentsCompleted</td><td>";
  if (stack2 = helpers.NumberOfAssignmentsCompleted) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.NumberOfAssignmentsCompleted; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td></tr>\n  </table>\n</div>\n";
  return buffer;
  });
templates['admin/assignments/one'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "\n      <button data-action=\"ApproveAssignment\">Approve</button>\n      <button data-action=\"RejectAssignment\">Reject</button>\n    ";
  }

function program3(depth0,data) {
  
  
  return "\n      <button data-action=\"ApproveRejectedAssignment\">Unreject and Approve</button>\n    ";
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr><td>ApprovalTime</td><td>";
  if (stack1 = helpers.ApprovalTime) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.ApprovalTime; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  ";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr><td>RejectionTime</td><td>";
  if (stack1 = helpers.RejectionTime) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.RejectionTime; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  ";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr><td>";
  if (stack1 = helpers.key) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.key; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td>";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  ";
  return buffer;
  }

function program11(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr><td>";
  if (stack1 = helpers.QuestionIdentifier) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.QuestionIdentifier; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td><td>";
  if (stack1 = helpers.FreeText) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FreeText; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  ";
  return buffer;
  }

  buffer += "<h3>Assignment: ";
  if (stack1 = helpers.AssignmentId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.AssignmentId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n\n<div class=\"controls\">\n  <fieldset class=\"status\"><legend>Status</legend>\n    <span class=\"";
  if (stack1 = helpers.AssignmentStatus) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.AssignmentStatus; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.AssignmentStatus) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.AssignmentStatus; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.Submitted) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.Submitted; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.Submitted) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};
  if (stack1 = helpers.Rejected) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.Rejected; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.Rejected) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </fieldset>\n\n  <fieldset class=\"bonus hform\"><legend>Bonus</legend>\n    <label><span>Amount:</span> <input name=\"amount\" value=\"";
  if (stack1 = helpers.bonus_owed) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.bonus_owed; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></label>\n    <label><span>Reason:</span> <input name=\"reason\" value=\"";
  if (stack1 = helpers.reason) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.reason; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></label>\n    <button data-action=\"GrantBonus\">Grant Bonus</button>\n  </fieldset>\n</div>\n\n<table class=\"keyval\">\n  <tr><th colspan=\"2\">AWS</th></tr>\n  <tr><td>WorkerId</td><td>";
  if (stack1 = helpers.WorkerId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.WorkerId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " <a href=\"../Workers/";
  if (stack1 = helpers.WorkerId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.WorkerId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">json</a></td></tr>\n  <tr><td>AutoApprovalTime</td><td>";
  if (stack1 = helpers.AutoApprovalTime) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.AutoApprovalTime; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  <tr><td>AcceptTime</td><td>";
  if (stack1 = helpers.AcceptTime) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.AcceptTime; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  <tr><td>SubmitTime</td><td>";
  if (stack1 = helpers.SubmitTime) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.SubmitTime; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n  ";
  options = {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data};
  if (stack1 = helpers.Approved) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.Approved; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.Approved) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ";
  options = {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data};
  if (stack1 = helpers.Rejected) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.Rejected; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.Rejected) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  <tr><th colspan=\"2\">User</th></tr>\n  ";
  options = {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data};
  if (stack1 = helpers.user_fields) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.user_fields; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.user_fields) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  <tr><th colspan=\"2\">Responses</th></tr>\n  ";
  options = {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data};
  if (stack1 = helpers.Answer) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.Answer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.Answer) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</table>\n\n<div style=\"clear: both\">\n  <button class=\"responses\">Load responses</button>\n</div>\n";
  return buffer;
  });
templates['admin/stimlists/edit'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "checked";
  }

  buffer += "<h3 class=\"section\">Stimlist: ";
  if (stack1 = helpers._id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0._id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n\n<section class=\"box hform\">\n  <label><span>Slug</span>\n    <input name=\"slug\" type=\"text\" value=\"";
  if (stack1 = helpers.slug) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.slug; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n    URL: <a href=\"/stimlists/";
  if (stack1 = helpers.slug) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.slug; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.slug) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.slug; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>\n  </label>\n\n  <label><span>Creator</span>\n    <input name=\"creator\" type=\"text\" value=\"";
  if (stack1 = helpers.creator) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.creator; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  </label>\n\n  <label>\n    <input name=\"segmented\" type=\"checkbox\" ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.segmented) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.segmented; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.segmented) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " />\n    <span>Segmented (by Participant)</span>\n  </label>\n\n  <label><span>Paste</span>\n    <textarea placeholder=\"Paste csv here\" name=\"paste\" rows=\"1\">\n    </textarea>\n  </label>\n\n  <label><span>Upload</span>\n    <input type=\"file\" name=\"upload\">\n  </label>\n\n  <button>Save</button>\n</section>\n\n<section class=\"fill states\"></section>\n";
  return buffer;
  });
templates['form-input'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<label>";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</label><input name=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" value=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />";
  return buffer;
  });
templates['stims/aircraft/batch-debriefing'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<p> Based on your performance, you have an available bonus of $";
  if (stack1 = helpers.bonus) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.bonus; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ".\n<div>\n  <button data-id=\"continue\">Claim bonus and continue</button>\n  <!-- <button data-id=\"stop\">Claim bonus and quit task</button> -->\n</div>\n";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\n<div>\n  <button data-id=\"continue\">Continue</button>\n  <!-- <button data-id=\"stop\">Quit task</button> -->\n</div>\n";
  }

  buffer += "<h3>End of Batch ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n\n";
  stack1 = helpers['if'].call(depth0, depth0.bonus_available, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<p>Note that the number of estimated aircraft in the sky may change in the next series of scenes.\n";
  return buffer;
  });
templates['stims/aircraft/conclusion'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<form method=\"POST\" action=\"";
  if (stack1 = helpers.host) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.host; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/mturk/externalSubmit\">\n  <input type=\"hidden\" name=\"assignmentId\" value=\"";
  if (stack1 = helpers.assignmentId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.assignmentId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <input type=\"hidden\" name=\"turkerId\" value=\"";
  if (stack1 = helpers.workerId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.workerId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <input type=\"hidden\" name=\"duration\" value=\"";
  if (stack1 = helpers.duration) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.duration; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n\n  <h3>Comments</h3>\n  <label>\n    <div>Did you find one of the allies more useful than others?\n      Please discuss any overall thoughts on the allies: ";
  if (stack1 = helpers.all_allies_string) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.all_allies_string; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ".</div>\n    <textarea rows=\"4\" cols=\"80\" name=\"allies_comments\"></textarea>\n  </label>\n\n  <label>\n    <div>What characterized enemy planes?</div>\n    <textarea rows=\"2\" cols=\"80\" name=\"enemy_comments\"></textarea>\n  </label>\n\n  <label>\n    <div>What characterized friendly planes?</div>\n    <textarea rows=\"2\" cols=\"80\" name=\"friendly_comments\"></textarea>\n  </label>\n\n  <label>\n    <div>Was this task unclear, mispriced, or frustrating? If we could make it better, let us know!</div>\n    <textarea rows=\"4\" cols=\"80\" name=\"task_comments\"></textarea>\n  </label>\n\n  <p class=\"clear\">\n    <input type=\"submit\" value=\"Submit Responses and Finish Task\" />\n  </p>\n</form>\n";
  return buffer;
  });
templates['stims/aircraft/scene'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <tr class=\"";
  if (stack1 = helpers.judgment) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.judgment; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n          <td>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "&nbsp;";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</td>\n          <td><span>";
  if (stack1 = helpers.judgment) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.judgment; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n        </tr>\n        ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <img src=\"/static/aircraft/pixelated/";
  if (stack1 = helpers.src) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.src; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n ";
  return buffer;
  }

  buffer += "<h3>Batch ";
  if (stack1 = helpers.batch_id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.batch_id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " / Scene ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n<table>\n  <tr>\n    <td><img src=\"/static/aircraft/pixelated/";
  if (stack1 = helpers.src) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.src; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></td>\n    <td style=\"padding-left: 20px; vertical-align: top;\">\n      <table class=\"stats\">\n        <tr><td>Estimated number of friendly aircraft in the sky:</td><td>";
  if (stack1 = helpers.total_friendly) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.total_friendly; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n        <tr><td>Estimated number of enemy aircraft in the sky:</td><td>";
  if (stack1 = helpers.total_enemy) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.total_enemy; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td></tr>\n      </table>\n\n      <h3>Allies:</h3>\n      <table class=\"allies\">\n        ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.allies) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.allies; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.allies) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </table>\n\n      <h3>Your decision:</h3>\n      <div class=\"spaced-buttons\">\n        <button data-id=\"enemy\">Enemy</button>\n        <button data-id=\"friend\">Pass</button>\n      </div>\n    </td>\n  </tr>\n</table>\n<div style=\"display: none\">\n ";
  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};
  if (stack1 = helpers.next) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.next; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.next) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  return buffer;
  });
templates['stims/clock2'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div style=\"width: 200px; margin: 0 auto\">\n\n  <div id=\"digitimage\"></div>\n\n  <!-- perhaps this is wasteful, to include this here, everytime we load this stim,\n    but it's more generic to load all resources required by the stim, in the stim,\n    rather than including them into the global compiled.js file. Maybe use head.js? -->\n  <script src=\"/static/lib/clock.js\"></script>\n  <script>\n  var segments = [\n    ";
  if (stack1 = helpers.DIGITLINE1) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE1; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n    ";
  if (stack1 = helpers.DIGITLINE2) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE2; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n    ";
  if (stack1 = helpers.DIGITLINE3) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE3; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n    ";
  if (stack1 = helpers.DIGITLINE4) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE4; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n    ";
  if (stack1 = helpers.DIGITLINE5) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE5; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n    ";
  if (stack1 = helpers.DIGITLINE6) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE6; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n    ";
  if (stack1 = helpers.DIGITLINE7) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITLINE7; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ",\n  ];\n  $('#digitimage').digit(segments, {\n    hmargin: 20,\n    width: 110,\n    height: 145,\n    background: 'brown',\n    foreground: 'orange',\n    noise: 32\n  });\n  </script>\n\n  <h4>Allies</h4>\n  <div class=\"allies\">\n    <table>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT1) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT1; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT1) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT1; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT2) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT2; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT2) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT2; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT3) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT3; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT3) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT3; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT4) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT4; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT4) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT4; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT5) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT5; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT5) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT5; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT6) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT6; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT6) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT6; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT7) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT7; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT7) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT7; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT8) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT8; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT8) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT8; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT9) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT9; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT9) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT9; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n      <tr class=\"";
  if (stack1 = helpers.INFORMANT10) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT10; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <td></td>\n        <td><span>";
  if (stack1 = helpers.INFORMANT10) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.INFORMANT10; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n      </tr>\n    </table>\n  </div>\n\n  <div>\n    <p>Is this a ";
  if (stack1 = helpers.DIGITTOASKABOUT) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DIGITTOASKABOUT; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "?</p>\n    <!-- it was originally a ";
  if (stack1 = helpers.STARTINGDIGIT) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.STARTINGDIGIT; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", so answer should be ";
  if (stack1 = helpers.CORRECTANSWERTOQUESTION) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.CORRECTANSWERTOQUESTION; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " -->\n    <!-- flipprob was ";
  if (stack1 = helpers.FLIPPROB) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FLIPPROB; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", and prior was ";
  if (stack1 = helpers.PRIOR) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.PRIOR; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " -->\n    <form>\n      <button type=\"submit\" name=\"choice\" value=\"yes\">Yes</button>\n      <button type=\"submit\" name=\"choice\" value=\"no\">No</button>\n    </form>\n  </div>\n\n</div>\n";
  return buffer;
  });
templates['stims/conclusion'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<form method=\"POST\" action=\"";
  if (stack1 = helpers.host) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.host; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/mturk/externalSubmit\">\n  <input type=\"hidden\" name=\"assignmentId\" value=\"";
  if (stack1 = helpers.assignmentId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.assignmentId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <input type=\"hidden\" name=\"turkerId\" value=\"";
  if (stack1 = helpers.workerId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.workerId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <input type=\"hidden\" name=\"duration\" value=\"";
  if (stack1 = helpers.duration) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.duration; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n\n  <label>\n    <div>Was this task unclear, mispriced, or frustrating? If we could make it better, let us know! (optional)</div>\n    <textarea rows=\"4\" cols=\"80\" name=\"task_comments\"></textarea>\n  </label>\n\n  <button>Submit responses and finish task</button>\n</form>\n";
  return buffer;
  });
templates['stims/consent'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h3>Consent form</h3>\n<p>\n  You are invited to participate in a study, entitled \"Learning in Social Networks\". The study is being conducted by Colin Bannard in the Linguistics department of The University of Texas at Austin.\n<p>\n  Department of Linguistics<br/>\n  University of Texas at Austin,<br/>\n  305 E. 23rd Street B5100,<br/>\n  Austin, TX 78712, USA<br/>\n  (512) 471-9022\n<p>The purpose of this study is to examine how people learn. We estimate that it will take about half a minute of your time to complete each question, and you will be paid 2 cents for each question you respond to. You are free to contact the investigator at the above address and phone number to discuss the survey.\n<p>Risks to participants are considered minimal. There will be no costs for participating. You will be paid for each HIT you complete, but will not otherwise benefit from participating. Your Amazon Mechanical Turk identification will be kept while we collect data for tracking purposes only. A limited number of research team members will have access to the data during data collection. This information will be stripped from the final dataset.\n<p>Your participation in this survey is voluntary. You may decline to answer any question and you have the right to withdraw from participation at any time without penalty. If you wish to withdraw from the study or have any questions, contact the investigator listed above.\n<p>If you have any questions, please email Colin Bannard at bannard@utexas.edu. You may also request a hard copy of the survey from the contact information above.\n<p>This study has been reviewed and approved by The University of Texas at Austin Institutional Review Board (IRB Study Number 2010-10-0051). If you have questions about your rights as a study participant, or are dissatisfied at any time with any aspect of this study, you may contact - anonymously, if you wish - the Institutional Review Board by phone at (512) 471-8871 or email at orsc@uts.cc.utexas.edu.\n<p>\n\n<form>\n  <button>I Consent</button>\n</form>\n";
  });
templates['stims/default'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <dt>";
  if (stack1 = helpers.key) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.key; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</dt>\n  <dd>";
  if (stack1 = helpers.val) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.val; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</dd>\n";
  return buffer;
  }

  buffer += "<h5>";
  if (stack1 = helpers._id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0._id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h5>\n<dl>\n";
  stack1 = helpers.each.call(depth0, depth0.keyvals, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</dl>\n<p><em>This is the default stim display (you should customize it).</em></p>";
  return buffer;
  });
templates['stims/digits/batch'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin: 0 auto\">\n  <tr>\n    <th colspan=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.scenes),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" style=\"text-align: left;\">\n      <h3>Bomb ";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h3>\n    </th>\n  </tr>\n  <tr id=\"digits\"></tr>\n  <tr>\n    <td colspan=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.scenes),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" style=\"padding: 20px 0; text-align: right;\">\n      <button disabled=\"true\">Submit</button>\n    </td>\n  </tr>\n</table>\n";
  return buffer;
  });
templates['stims/digits/conclusion'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<form method=\"POST\" action=\"";
  if (stack1 = helpers.host) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.host; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/mturk/externalSubmit\">\n  <input type=\"hidden\" name=\"assignmentId\" value=\"";
  if (stack1 = helpers.assignmentId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.assignmentId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <input type=\"hidden\" name=\"turkerId\" value=\"";
  if (stack1 = helpers.workerId) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.workerId; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n  <input type=\"hidden\" name=\"duration\" value=\"";
  if (stack1 = helpers.duration) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.duration; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n\n  <p>Comments are optional, but much appreciated.</p>\n\n  <label>\n    <div>Did you find one of your colleagues more useful than others?\n      Please discuss whether they (";
  if (stack1 = helpers.all_allies_string) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.all_allies_string; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ") were helpful or not.</div>\n    <textarea rows=\"4\" cols=\"80\" name=\"allies_comments\"></textarea>\n  </label>\n\n  <label>\n    <div>What strategy worked the best?</div>\n    <textarea rows=\"2\" cols=\"80\" name=\"strategy_comments\"></textarea>\n  </label>\n\n  <label>\n    <div>Was this task unclear, mispriced, or frustrating? If we could make it better, let us know!</div>\n    <textarea rows=\"4\" cols=\"80\" name=\"task_comments\"></textarea>\n  </label>\n\n  <p class=\"clear\">\n    <button>Submit Responses and Finish Task</button>\n  </p>\n</form>\n";
  return buffer;
  });
templates['stims/digits/scene'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr class=\"";
  if (stack1 = helpers.judgment) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.judgment; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n      <td>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "&nbsp;";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ":</td>\n      <td><span>";
  if (stack1 = helpers.judgment) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.judgment; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></td>\n    </tr>\n    ";
  return buffer;
  }

  buffer += "<div class=\"image\"><!-- fill in with canvas rendering --></div>\n\n<div class=\"allies\">\n  <h3>Colleagues:</h3>\n  <table>\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.allies) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.allies; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.allies) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </table>\n</div>\n\n<div class=\"user-judgment\">\n  <h3>Your<br/> judgment:</h3>\n  <input type=\"text\" maxlength=\"1\" min=\"0\" max=\"10\" required />\n</div>\n";
  return buffer;
  });
templates['stims/feedback'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n    <img src=\"/static/smile.gif\" alt=\"☺\" />\n  ";
  }

function program3(depth0,data) {
  
  
  return "\n    <img src=\"/static/frown.gif\" alt=\"☹\" />\n  ";
  }

  buffer += "<div class=\"emoticon\">\n  ";
  stack1 = helpers['if'].call(depth0, depth0.correct, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  return buffer;
  });
})();