<form method="POST" action="{{host}}/mturk/externalSubmit">
  <input type="hidden" name="assignmentId" value="{{assignmentId}}" />
  <input type="hidden" name="turkerId" value="{{workerId}}" />
  <input type="hidden" name="originalHitId" value="{{hitId}}" />
  <input type="hidden" name="duration" value="{{duration}}" />

  <h3>Debriefing</h3>
  <p>Was this task unclear, mispriced, or frustrating? If we could make it better, let us know!</p>

  <h4>Comments</h4>
  <textarea rows="4" cols="80" name="comments"></textarea>

  <div class="clear" style="padding: 10px">
    <input type="submit" value="Submit Responses" />
  </div>
</form>
