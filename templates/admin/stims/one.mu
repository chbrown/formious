{{#stim}}
<h3 class="section">Stim Template: {{_id}}</h3>

<section class="box">
  <table>
    <tr><td>ID</td><td>{{_id}}</td></tr>
    <tr><td>Created</td><td>{{created}}</td></tr>
  </table>
</section>

<section class="fill">
  <h3>HTML</h3>
  <pre>{{html}}</pre>
</section>

<section>
  <a href="/admin/stims/{{_id}}/edit">Edit</a>
</section>
{{/stim}}
