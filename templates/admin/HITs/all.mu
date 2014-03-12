<main ng-controller="adminTableCtrl">
  <h3>HITs</h3>

  <section ng-repeat="hit in table" class="box">
    <h3><a href="HITs/{{hit.HITId}}">{{hit.Title}}</a></h3>
    <table class="keyval">
      <tr ng-repeat="(key, val) in hit">
        <td>{{key}}</td>
        <td>{{val}}</td>
      </tr>
    </table>
  </section>
</main>

<script>
var table = <%& serialize(hits) %>;
</script>
