'use strict'; /*jslint node: true, indent: 2 */
/*global _: true, $: true */
// requires underscore & jquery/zepto
var original_width = 88;
var original_height = 119;
var segment_path_functions = {
  0: function(ctx) {
    ctx.moveTo(22.5, 2.6);
    ctx.lineTo(30.0, 12.2);
    ctx.lineTo(74.7, 12.7);
    ctx.lineTo(83.7, 4.4);
    ctx.bezierCurveTo(83.7, 4.4, 82.0, 1.3, 80.3, 0.6);
    ctx.bezierCurveTo(78.5, -0.2, 28.7, -0.1, 26.0, 0.6);
    ctx.bezierCurveTo(23.8, 1.1, 22.5, 2.6, 22.5, 2.6);
  },
  1: function(ctx) {
    ctx.moveTo(21.3, 3.4);
    ctx.lineTo(29.0, 13.6);
    ctx.lineTo(20.9, 53.4);
    ctx.lineTo(15.4, 58.6);
    ctx.bezierCurveTo(15.4, 58.6, 10.3, 53.7, 10.2, 52.6);
    ctx.bezierCurveTo(10.0, 50.9, 17.7, 7.9, 18.2, 7.1);
    ctx.bezierCurveTo(18.7, 6.2, 21.3, 3.4, 21.3, 3.4);
  },
  2: function(ctx) {
    ctx.moveTo(84.8, 6.1);
    ctx.lineTo(76.0, 14.4);
    ctx.lineTo(69.2, 53.1);
    ctx.lineTo(74.5, 58.4);
    ctx.bezierCurveTo(74.5, 58.4, 79.8, 55.6, 80.2, 54.4);
    ctx.bezierCurveTo(80.5, 53.2, 88.3, 11.4, 87.8, 10.2);
    ctx.bezierCurveTo(87.3, 9.1, 84.8, 6.1, 84.8, 6.1);
  },
  3: function(ctx) {
    ctx.moveTo(21.8, 54.4);
    ctx.lineTo(68.3, 54.4);
    ctx.lineTo(73.1, 59.6);
    ctx.lineTo(65.2, 66.2);
    ctx.lineTo(21.7, 66.6);
    ctx.lineTo(16.2, 60.1);
    ctx.lineTo(21.8, 54.4);
  },
  4: function(ctx) {
    ctx.moveTo(15.3, 61.4);
    ctx.lineTo(20.4, 67.6);
    ctx.lineTo(12.8, 107.1);
    ctx.lineTo(4.1, 115.0);
    ctx.bezierCurveTo(4.1, 115.0, 0.0, 110.6, 0.0, 109.6);
    ctx.bezierCurveTo(0.0, 108.6, 6.7, 68.2, 7.3, 67.2);
    ctx.bezierCurveTo(8.0, 66.2, 15.3, 61.4, 15.3, 61.4);
  },
  5: function(ctx) {
    ctx.moveTo(66.4, 67.3);
    ctx.lineTo(74.1, 61.0);
    ctx.bezierCurveTo(74.1, 61.0, 76.5, 64.2, 77.5, 65.7);
    ctx.bezierCurveTo(78.5, 67.2, 69.9, 110.9, 69.4, 112.5);
    ctx.bezierCurveTo(68.8, 114.4, 67.4, 114.9, 67.4, 114.9);
    ctx.lineTo(59.8, 107.1);
    ctx.lineTo(66.4, 67.3);
  },
  6: function(ctx) {
    ctx.moveTo(13.8, 108.2);
    ctx.lineTo(5.2, 116.2);
    ctx.bezierCurveTo(5.2, 116.2, 6.5, 117.6, 7.3, 118.4);
    ctx.bezierCurveTo(8.2, 119.2, 60.8, 118.9, 63.1, 118.4);
    ctx.bezierCurveTo(65.1, 117.9, 66.2, 116.3, 66.2, 116.3);
    ctx.lineTo(58.5, 108.2);
    ctx.lineTo(13.8, 108.2);
  }
};

// the presence of segments (booleans)
var digit_segments = [
  [1, 1, 1, 0, 1, 1, 1], // 0
  [0, 0, 1, 0, 0, 1, 0], // 1
  [1, 0, 1, 1, 1, 0, 1], // 2
  [1, 0, 1, 1, 0, 1, 1], // 3
  [0, 1, 1, 1, 0, 1, 0], // 4
  [1, 1, 0, 1, 0, 1, 1], // 5
  [1, 1, 0, 1, 1, 1, 1], // 6
  [1, 0, 1, 0, 0, 1, 0], // 7
  [1, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 1, 0, 1, 1]  // 9
];

function drawSegments(on_segments, ctx) {
  // var positions = _.range(7);
  on_segments.forEach(function(on, position) {
    if (on) {
      ctx.beginPath();
      segment_path_functions[position](ctx);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function degradeSegments(on_segments, n, replacement) {
  on_segments = _.clone(on_segments);
  if (replacement) {
    _.range(n).forEach(function() {
      var position = (Math.random() * 7) | 0;
      on_segments[position] = 1 - on_segments[position];
    });
  }
  else {
    // shuffle the list of possible things to move
    var positions = _.shuffle(_.range(7));
    _.range(n).forEach(function() {
      var position = positions.pop();
      // this will have a weird effect if n >= positions.length
      on_segments[position] = 1 - on_segments[position];
    });
  }
  return on_segments;
}

function single(canvas, digits) {
  canvas.width = 88 * digits.length;
  var ctx = canvas.getContext('2d');
  ctx.save();
  digits.forEach(function(number, i) {
    var segments = digit_segments[number];
    var degraded_segments = degradeSegments(segments, 1);
    drawSegments(degraded_segments, ctx);
    ctx.translate(88, 0);
  });
  ctx.restore();
}

$.fn.digit = function(segments, opts) {
  opts = _.extend({
    width: original_width, height: original_height, hmargin: 10, vmargin: 10,
    background: 'white', foreground: 'black', noise: 0}, opts);

  var attrs = {width: opts.width + opts.hmargin * 2, height: opts.height + opts.vmargin * 2};
  $(this).attr(attrs).each(function(i, el) {
    var $canvas = $('<canvas></canvas>').attr(attrs).appendTo(el);
    var canvas = $canvas[0];
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, attrs.width, attrs.height);

    ctx.save();
    ctx.translate(opts.hmargin, opts.vmargin);
    ctx.scale(opts.width / original_width, opts.height / original_height);
    ctx.fillStyle = opts.foreground;
    drawSegments(segments, ctx);
    ctx.restore();
    if (opts.noise) {
      // perlinNoise(canvas);
      addCanvasNoise(canvas, {diff: opts.noise});
    }
  });
};

// noise code from https://gist.github.com/donpark/1796361
/* Following canvas-based Perlin generation code originates from
 * iron_wallaby's code at: http://www.ozoneasylum.com/30982
 */
function addCanvasNoise(canvas, opts) {
  // destructive. returns the same canvas it's given.
  // alpha: 0 is transparent, 255 is fully visible.
  opts = _.extend({width: canvas.width, height: canvas.height, diff: 255}, opts);

  var ctx = canvas.getContext('2d');
  var image = ctx.getImageData(0, 0, opts.width, opts.height);
  addNoiseImage(image, opts.diff);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function createCanvas(width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function randomizeImage(image, opts) {
  opts = _.extend({min: 0, max: 255, alpha: 255}, opts);
  var range = opts.max - opts.min;
  for (var i = 0, n = image.data.length; i < n; i += 4) {
    var r = Math.random() * range + opts.min | 0;
    image.data[i  ] = image.data[i+1] = image.data[i+2] = r;
    image.data[i+3] = opts.alpha;
  }
  return image;
}
function addNoiseImage(image, diff) {
  var range = diff || 255;
  var min = range / 2;
  for (var i = 0, n = image.data.length; i < n; i += 4) {
    var r = Math.random() * range - min | 0;
    image.data[i  ] += r;
    image.data[i+1] += r;
    image.data[i+2] += r;
    // image.data[i+3] // just leave the alpha
  }
  return image;
}


function perlinNoise(canvas) {
  var ctx = canvas.getContext('2d');
  ctx.save();

  var noise_image = ctx.createImageData(canvas.width, canvas.height);
  randomizeImage(noise_image, {alpha: 64});

  var noise_canvas = createCanvas(canvas.width, canvas.height);
  noise_canvas.getContext('2d').putImageData(noise_image, 0, 0);

  /* Scale random iterations onto the canvas to generate Perlin noise. */
  for (var size = 4; size <= canvas.width; size *= 2) {
    var x = Math.random() * (canvas.width - size) | 0;
    var y = Math.random() * (canvas.height - size) | 0;
    ctx.globalAlpha = 4 / size;
    // .putImageData(imgData,x,y,dirtyX,dirtyY,dirtyWidth,dirtyHeight);
    // .drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
    // drawImage(source, clip this much of source, put to here on ctx);
    // putImageData doesn't allow clipping the source data.
    ctx.drawImage(noise_canvas, x, y, size, size, 0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
  return canvas;
}

