<p style="float: right" id="remaining">You can do this HIT {{remaining_hits}} more time(s).</p>
<h2>English sentences</h2>
<p><i>By completing this task you acknowledge that we may use your responses in academic publication.</i></p>

<p>There are {{questions.length}} sentences below.</p>

<fieldset class="demo">
  <legend><b>Instructions</b></legend>
  <p>Please read each sentence, and then choose <b>how natural</b> the sentence sounds, from these options:</p>
  <table>
    <tr>
      <td><label disabled><input type="radio" disabled> completely normal</label></td>
      <td><label disabled><input type="radio" disabled> slightly unusual</label></td>
      <td><label disabled><input type="radio" disabled> very weird</label></td>
      <td><label disabled><input type="radio" disabled> does not make sense</label></td>
    </tr>
  </table>
  <p>Note that you can click the labels as well as the radio buttons, if that is easier.</p>
</fieldset>

<h3>You must select <i>one choice</i> from <i>each box</i> to receive credit for this HIT!</h3>

<form method="POST" action="{{host}}/mturk/externalSubmit">
  <input type="hidden" name="assignmentId" value="{{assignmentId}}" />
  <input type="hidden" name="turkerId" value="{{workerId}}" />
  <input type="hidden" name="originalHitId" value="{{hitId}}" />

  {{#questions -> question}}
    <fieldset id="{{question.id}}">
      <legend><b>{{question.index}} of {{questions.length}}</b></legend>
      <p>{{question.text}}</p>
      <table>
        <tr>
          <td><label><input type="radio" value="0" name="{{question.id}}" required> completely normal</label></td>
          <td><label><input type="radio" value="1" name="{{question.id}}" required> slightly unusual</label></td>
          <td><label><input type="radio" value="2" name="{{question.id}}" required> very weird</label></td>
          <td><label><input type="radio" value="3" name="{{question.id}}" required> does not make sense</label></td>
        </tr>
      </table>
    </fieldset>
  {{/}}

  <div style="visibility: hidden" id="ghostface">
    <input type="text" name="ghostface" value="damnfool" />
  </div>
  <div style="display: none">
    <input type="text" name="ghostkiller" />
  </div>

  <fieldset><legend>English familiarity (recommended)</legend>
    <p>We accept and encourage participation from every level of English familiarity, but we would like to record your background.</p>
    <p><b>Please select the first option that applies to you:</b></p>
    <div class="vlabels">
      <label><input type="radio" name="english_familiarity" value="1"> English was the first language I learned.</label>
      <label><input type="radio" name="english_familiarity" value="2"> I am fluent in English.</label>
      <label><input type="radio" name="english_familiarity" value="3"> I know English fairly well.</label>
      <label><input type="radio" name="english_familiarity" value="4"> I often have trouble with English.</label>
    </div>
  </fieldset>

  <fieldset><legend>Comments (optional)</legend>
    <p>Was this task unclear, mispriced, or useless? We want to ensure that our workers can work efficiently; if we are wasting your time, that means we are wasting our money, so let us know!</p>
    <textarea rows="2" cols="80" name="comments"></textarea>
  </fieldset>

  <div class="clear" style="padding: 10px">
    <input type="submit" />
  </div>
</form>

<script>
$(function() {
  var assignmentId = $('[name=assignmentId]').val();
  var workerId = $('[name=turkerId]').val();
  if (assignmentId === "ASSIGNMENT_ID_NOT_AVAILABLE") {
    $('input[type=submit]').prop('disabled', true);
    if (workerId) {
      // inform the user, on the preview, that they can only do this a few more times.
      $('#remaining').css('font-size', '150%').css('float', 'none');
    }
  }
  else if (workerId) {
    // mark things as seen after 5 seconds
    setTimeout(function() {
      var questionIds = $('fieldset[id]').map(function(i, el) { return el.id; }).toArray();
      $.post('/seen', {workerId: workerId, questionIds: questionIds}, function(result) {
      });
    }, 5000);
  }

  var $form = $('form');
  $('#ghostface').remove();
  $('<input type="hidden" name="ghostname" value="gesso">').attr('name', 'jsenabled').val('valid').appendTo($form);
  var loaded = new Date();
  var ms = (loaded.getTime() - started.getTime());
  $('<input type="hidden" name="pageload">').val(ms.toFixed(0)).appendTo($form);
});
// $('[required]').each(function(i, el) { setTimeout(function() { $(el).click(); }, Math.random()*1000); });
</script>
