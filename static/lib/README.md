# misc-js

Custom client-side javascript libraries for use with jQuery, Backbone, and Handlebars.

* Too small to make into their own repositories.
* Too big to keep copy and pasting.

## Standards

JSLint:

    "use strict"; /*jslint indent: 2 */

E.g., with jQuery, underscore.js:

    "use strict"; /*jslint indent: 2 */ /*globals $, _ */

## jquery.autocomplete.js

Copyright 2011-2012 Christopher Brown, MIT License

jQuery UI's autocomplete is too bulky and hard to configure. The hoops you have to jump through, just to use use a little `<b>` markup in your results, it's crazy.

But this plugin, I want you to copy & paste into your own project, and to tear apart, and build out of. Because autocomplete has to be blazing fast, and that means it has to be bloody simple. This is just a little starting block for an autocomplete. Your mileage *will* vary.

In your html:

    <input type="text" data-autocomplete="/users.json" />

Where /users.json?q=jo will respond in json like the following:

    [
      {"label": "Professor", "value": "prof"},
      {"label": "Student", "value": "student"}
    ]

Either `label` or `value` must be present, and if both are, `label` is used.

Then call:

    $('input[data-autocomplete]').ac();
    // the actual Autocomplete object will be available at each element's .data('autocomplete') key

## jquery.flags.js

Copyright 2012 Christopher Brown, MIT License

Like those "Sign here" post-its, this plug-in is intended to provide element level flash messages/feedback.
It's absolutely positioned, so you needn't put dummy "submit-debug" spans in your html just to provide a little feedback.

    $('#submit').flag({
      update: true, // change the text if there's already a flag on #submit
      anchor: 'r', // put on the right side of the #submit element
      align: 'm', // vertical-align: middle
      html: 'This element needs <em>attention</em>', // uses html()
      // text: 'So does this one.', // for text(), if you play safe like that
      fade: 5000 // auto fadeOut() after five seconds.
    });

All the arguments above are optional, and have the defaults shown above (except `html`, which has the default "!!!").

- `update` determines whether or not to add the flag, or replace an existing flag that is already attached to that element
- `anchor` is one of `trbl` -- at the moment, only `l` and `r` are supported. Determines what side of the element the flag appears on.
- `align` is one of `lcrtmb` -- at the moment, only `t`, `m`, and `b` are supported.
- `html` is used the content of the flag.

If you use only a string, it will use that as the `html` argument.

    $('#submit').flag('Failed');

The latest flag object is attached as $el.data('flag').

    $('#submit').data('flag').$flag.fadeOut('slow');

Here's the basic LESS css required for this plugin (recent update removes styling from the javascript):

    .flag {
      position: absolute;
      background-color: black;
      border-radius: 4px;
      padding: 2px;
      color: white;
      font-size: 90%;
      // like a diamond -- half-diameter measure
      .triangle {
        display: inline-block;
        position: absolute;
        border: 6px solid transparent;
        width: 0;
        height: 0;
      }
      .subflag {
        display: inline-block;
        span, a {
          display: inline-block;
          padding: 0 4px;
        }
        a {
          background-color: white;
          border-radius: 2px;
        }
      }
    }


## cookies.js

Adds a `cookies` variable to your global scope.

### get cookie

```javascript
var user_id = cookies.get('user_id');
// user_id will be undefined or a string
```

### add or set cookie (with options)

```javascript
var now = new Date().getTime();
var one_month = new Date(now + 31*86400000);
cookies.set('user_id', '10089', {expires: one_month, path: '/'});
```

Options when setting:

* Date expires
* String path
* String domain
* Boolean secure
* Boolean raw
    - Not part of the cookie data, but controls how the cookie is stringified.
    - Prevents `encodeURIComponent` being called on the given name and value.

### delete cookie

```javascript
cookie.del('user_id');
```

### set defaults

Merge any `cookies.set` command with some default set of options.
Can be either a static object or a function that returns an object.

```javascript
cookies.setDefault(function() {
  var now = new Date().getTime();
  var thirty_seconds = new Date(now + 30000);
  return {expires: thirty_seconds};
});
```

Or, more sanely and simply:

```javascript
cookies.setDefault({path: '/'});
```


## templating.js

Templating helper for Backbone joined with Handlebars.

### Creates a class, `TemplateManager`.

* TemplateManager.cache = the dictionary to look up and store templates by name
* TemplateManager.url = where to request templates if they're not in the cache
* TemplateManager.extension = the dictionary to look up and store templates by name.
* TemplateManager.querystring = set to '?t=123' to keep from pulling static templates from cache.
* TemplateManager.compile = function (template_string) -> function (context) -> html

### Creates a global variable, `HandlebarsTemplates`:

For convenience, `Templates` is set to the same reference.

Unless you have set `window.DEBUG = true` somewhere, `HandlebarsTemplates` will load `Handlebars.templates` as its cache.

### Creates helper classes for Backbone:

* TemplatedView (extends Backbone.View)
* TemplatedCollection (extends Backbone.Collection)
