<h1>HIT: {{HITId}}</h1>
<div class="review">
  <div id="assignments"></div>
</div>

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

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script>
'use strict'; /*jslint nomen: true, indent: 2, es5: true */
var Assignment = Backbone.Model.extend({
  idAttribute: 'AssignmentId'
});
var AssignmentCollection = TemplatedCollection.extend({
  model: Assignment,
  url: '../Assignments',
});

var Worker = Backbone.Model.extend({
  urlRoot: '../Workers'
});
// var WorkerCollection = TemplatedCollection.extend({
//   url: '../Workers'
// });

function makeTable(cols, data) {
  var trs = data.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}

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
    'click button.load-responses': function(ev) {
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
