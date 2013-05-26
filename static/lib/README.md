# jquery-plugins

Here are some jQuery plugins that I like, some of which I've created, and use often.

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

## jquery.cookie.js

https://github.com/carhartl/jquery-cookie

Copyright 2011, Klaus Hartl, Dual licensed under the MIT or GPL Version 2 licenses.

    // add cookie
    $.cookie('user_id', 'wXzGVpNvBkoK');

    // add cookie with options. "expires" is in days. ("path" is optional.)
    $.cookie('user_id', 'wXzGVpNvBkoK', {expires: 31, path: '/'});
    // other options: domain, secure, raw

    // get cookie
    var user_id = $.cookie('user_id');

    // delete cookie
    $.cookie('user_id', null);

## jquery.tablesorter.js

http://tablesorter.com/

Copyright 2007 Christian Bach, Dual licensed under MIT or GPL licenses.

    $('.tablesorter').tablesorter();
