<form method="POST" action="{{host}}/mturk/externalSubmit">
  <input type="hidden" name="assignmentId" value="{{assignmentId}}" />
  <input type="hidden" name="turkerId" value="{{workerId}}" />
  <input type="hidden" name="originalHitId" value="{{hitId}}" />
  <input type="hidden" name="duration" value="{{duration}}" />

  <h3>Comments</h3>
  <label>
    <div>Did you find one of the allies more useful than others?
      Please discuss any overall thoughts on the allies: {{all_allies_string}}.</div>
    <textarea rows="4" cols="80" name="allies_comments"></textarea>
  </label>

  <label>
    <div>What characterized enemy planes?</div>
    <textarea rows="2" cols="80" name="enemy_comments"></textarea>
  </label>

  <label>
    <div>What characterized friendly planes?</div>
    <textarea rows="2" cols="80" name="friendly_comments"></textarea>
  </label>

  <label>
    <div>Was this task unclear, mispriced, or frustrating? If we could make it better, let us know!</div>
    <textarea rows="4" cols="80" name="task_comments"></textarea>
  </label>

  <p class="clear">
    <input type="submit" value="Submit Responses and Finish Task" />
  </p>
</form>
