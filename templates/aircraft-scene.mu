<h3>Batch {{batch_id}} / Scene {{id}}</h3>
<table>
  <tr>
    <td><img src="/static/aircraft/pixelated/{{src}}" /></td>
    <td style="padding-left: 20px">
      <table class="stats">
        <tr><td>Estimated number of friendly aircraft in the sky:</td><td>{{total_friendly}}</td></tr>
        <tr><td>Estimated number of enemy aircraft in the sky:</td><td>{{total_enemy}}</td></tr>
      </table>

      <h3>Allies:</h3>
      <table class="allies">
        {{#allies}}
        <tr>
          <td>{{title}}&nbsp;{{name}}:</td>
          <td><span class="judgment {{judgment}}">{{judgment}}</span></td>
        </tr>
        {{/allies}}
      </table>

      <h3>Your decision:</h3>
      <div>
        <button data-id="enemy">Enemy</button>
        <button data-id="friend">Pass</button>
      </div>
    </td>
  </tr>
</table>
<div style="display: none">
 {{#next}}
    <img src="/static/aircraft/pixelated/{{src}}" />
 {{/next}}
</div>
