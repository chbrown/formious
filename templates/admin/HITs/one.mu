<div id="hit"></div>

<section class="fill">
  <h3>Download</h3>
  <ul>
    <li><a href="{{hit.HITId}}.csv">{{hit.HITId}}.csv</a> (comma-separated)</li>
    <li><a href="{{hit.HITId}}.tsv">{{hit.HITId}}.tsv</a> (tab-separated)</li>
  </ul>
</section>

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
var hit = new HIT({{{JSON.stringify(hit)}}});
var hit_view = new HITView({model: hit, el: $('#hit')});

var assignments = new AssignmentCollection({{{JSON.stringify(assignments)}}});
assignments.renderTo($('#assignments'), AssignmentView);
</script>
