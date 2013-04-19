<h1>HIT: {{HITId}}</h1>
<div class="review">
  <div id="assignments"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script>
'use strict'; /*jslint nomen: true, indent: 2, es5: true */
// var Assignment = Backbone.Model.extend({
//   url: 'assignments'
// });
var AssignmentCollection = TemplatedCollection.extend({
  url: '../Assignments'
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
  events: {
    'click button.responses': function(ev) {
      var workerId = this.model.get('WorkerId');
      var worker = new Worker({id: workerId});
      worker.fetch({
        success: function(model, user, options) {
          console.log('user', user);
          var keys = {};
          user.responses.slice(0, 10).forEach(function(response) {
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
    'click button.approve': function(ev) {
      // $.post( url [, data ] [, success(data, textStatus, jqXHR) ] [, dataType ] )
      var approve_url = this.model.url() + '/Approve';
      console.log('approve_url', approve_url);
      $.post(approve_url, function(data, textStatus, jqXHR) {
        console.log('data, textStatus, jqXHR');
        $(ev.target).flag({html: 'Approved', fade: 5000});
      })
    }
  }
});

var assignments = new AssignmentCollection({{{JSON.stringify(assignments)}}});
assignments.renderTo($('#assignments'), AssignmentView);
</script>
