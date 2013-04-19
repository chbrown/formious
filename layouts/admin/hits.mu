<h3>HITs</h3>
<div class="review">
  <div id="hits"></div>
</div>

<script src="/static/compiled.js"></script>
<script src="/static/templates.js"></script>
<script>
'use strict'; /*jslint nomen: true, indent: 2, es5: true */
var raw_hits = {{{JSON.stringify(hits)}}};

// var HIT = Backbone.Model.extend({});
var HITCollection = TemplatedCollection.extend({url: 'hits'});

var HITView = TemplateView.extend({
  template: 'hit.mu',
});

var hits = new HITCollection(raw_hits);
hits.renderTo($('#hits'), HITView);
</script>

