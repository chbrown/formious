<div class="admin review">
  <div id="hit"></div>

  <h3>Download</h3>
  <ul>
    <li><a href="{{hit.HITId}}.csv">{{hit.HITId}}.csv</a></li>
    <li><a href="{{hit.HITId}}.tsv">{{hit.HITId}}.tsv</a></li>
  </ul>

  <h2>Bonuses</h2>
  <div class="bonuses">
    <table>
      <thead><tr><th>WorkerId</th><th>BonusAmount</th><th>Reason</th><th>GrantTime</th></tr></thead>
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
  </div>

  <h2>Assignments</h2>
  <div id="assignments"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script>

var hit = new HIT({{{JSON.stringify(hit)}}});
var hit_view = new HITView({model: hit, el: $('#hit')});

var AssignmentView = TemplateView.extend({
  template: 'assignment.mu',
  preRender: function(ctx) {
    // AssignmentStatus is one of Submitted | Approved | Rejected
    ctx[ctx.AssignmentStatus] = true;
    ctx.reason = localStorage.reason;
  },
  events: {
    'change input[name="reason"]': function(ev) {
      localStorage.reason = ev.target.value;
    },
    'click button.responses': function(ev) {
      var workerId = this.model.get('WorkerId');
      var worker = new Worker({id: workerId});
      worker.fetch({
        success: function(model, user, options) {
          console.log('user', user);
          var keys = {};
          user.responses.slice(0, 50).forEach(function(response) {
            _.extend(keys, response);
          });

          var cols = _.keys(keys).sort();
          var data = user.responses.map(function(response) {
            return cols.map(function(col) {
              return response[col];
            });
          });

          $(ev.target).replaceWith(makeTable(cols, data));
        }
      });
    },
    'click button[data-action]': function(ev) {
      // $.post( url [, data ] [, success(data, textStatus, jqXHR) ] [, dataType ] )
      var action = $(ev.target).attr('data-action')
      var params = {};
      if (action == 'GrantBonus') {
        params.BonusAmount = this.$('.bonus input[name="amount"]').val();
        params.Reason = this.$('.bonus input[name="reason"]').val();
        params.WorkerId = this.model.get('WorkerId');
      }
      $.post(this.model.url() + '/' + action, params, function(data, textStatus, jqXHR) {
        $(ev.target).flag({html: data.message, fade: 5000});
      })
    }
  }
});

var assignments = new AssignmentCollection({{{JSON.stringify(assignments)}}});
assignments.renderTo($('#assignments'), AssignmentView);
</script>
