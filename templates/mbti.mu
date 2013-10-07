<p>Sorry, you've repeated this HIT more times than it allows.</p>
<p></p>
<p>We thank you for participating in the HIT thus far, but please don't reserve any more HITs of this task.</p>
<p></p>
<p>However, in order to comply with Mechanical Turk expectations, there is still a task below. It is long and underpaid, so we strongly suggest you reject this HIT. Thanks!</p>

<h2>Personality Test</h2>

<p>Please answer the {{questions.length}} questions below.</p>
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
          <td><label><input type="radio" value="Y" name="mbti-{{question.id}}" required> Yes</label></td>
          <td><label><input type="radio" value="N" name="mbti-{{question.id}}" required> No</label></td>
        </tr>
      </table>
    </fieldset>
  {{/}}

  <fieldset>
    <legend><b>Summary</b></legend>
    <p>Do you know your MBTI score? If so, please enter it here.</p>
    <p><input type="input" name="mbti-score" /></p>
  </fieldset>

  <button>Submit</button>
</form>
