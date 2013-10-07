<div id="hit"></div>

<section class="fill">
  <h3>Download</h3>
  <ul>
    <li>
      <a href="{{hit.HITId}}.csv">HIT_{{hit.HITId}}.csv</a>
      &middot; <a href="{{hit.HITId}}.csv?view">View</a>
    </li>
    <li>
      <a href="{{hit.HITId}}.tsv">HIT_{{hit.HITId}}.tsv</a>
      &middot; <a href="{{hit.HITId}}.tsv?view">View</a>
    </li>
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

<h3 class="section">Assignments</h3>

<div id="assignments"></div>

<script>
var hit = new HIT({{{JSON.stringify(hit)}}});
var hit_view = new HITView({model: hit, el: $('#hit')});

var assignments = new AssignmentCollection({{{JSON.stringify(assignments)}}});
assignments.renderTo($('#assignments'), AssignmentView);
</script>
