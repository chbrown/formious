<div class="image"><!-- fill in with canvas rendering --></div>

<div class="allies">
  <h3>Colleagues:</h3>
  <table>
    {{#allies}}
    <tr class="{{judgment}}">
      <td>{{title}}&nbsp;{{name}}:</td>
      <td><span>{{judgment}}</span></td>
    </tr>
    {{/allies}}
  </table>
</div>

<div class="user-judgment">
  <h3>Your<br/> judgment:</h3>
  <input type="text" maxlength="1" min="0" max="10" required />
</div>
