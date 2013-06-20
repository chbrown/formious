'use strict'; /*jslint node: true, es5: true, indent: 2 */
var fs = require('fs');
var yaml = require('js-yaml');

function Table() {
  // Table takes a list of dictionaries, collects the union of keys, and writes out a flat table
  this.keys = {}; // dictionary-set
  this.data = []; // list of hashes
}
Table.prototype.add = function(hash) {
  for (var key in hash)
    this.keys[key] = 1;
  this.data.push(hash);
};
Table.prototype.extend = function(hashes) {
  for (var hash, h = 0; (hash = hashes[h]); h++) {
    this.add(hash);
  }
};
Table.prototype.toString = function(field_separator, record_separator, escape) {
  if (field_separator === undefined) field_separator = ',';
  if (record_separator === undefined) record_separator = '\n';
  if (escape === undefined) escape = true;
  // maybe there should be just a toJSON, that returns a list of lists of strings?,
  // and then this would double collapse it with \n and \t separators?
  var columns = Object.keys(this.keys).sort(); // TODO: make sort optional
  var lines = [columns.join(field_separator)];
  this.data.forEach(function(row) {
    var cells = columns.map(function(key) {
      var value = row[key];
      if (value === undefined) value = ''; // TODO: allow setting default value
      else value = value.toString();
      if (escape && field_separator == ',' && value.indexOf(',') > -1) {
        // this is how you escape quotes for Excel:
        return '"' + value.replace(/"/g, '""') + '"';
      }
      else {
        return value;
      }
    });
    lines.push(cells.join(field_separator));
  });
  return lines.join(record_separator);
};


function getStimuli(callback) {
  // mostly a copy&paste from turkserv.js:71-97
  fs.readFile('/Users/chbrown/github/turkserv/stimuli.yaml', 'utf8', function (err, stimuli_yaml) {
    yaml.loadAll(stimuli_yaml, function(stimuli) {
      var data = [];
      stimuli.sort(function(a, b) { return a.id > b.id; });
      stimuli.forEach(function(stimulus) {
        ['do', 'po'].forEach(function(type) {
          stimulus.continuations.forEach(function(continuation) {
            // DO = John gave Mary an elephant.
            // PO = John gave an elephant to Mary.
            var text = stimulus.base + ' ';
            if (type === 'do')
              text += stimulus.recipient + ' ' + stimulus.object;
            else
              text += stimulus.object + ' to ' + stimulus.recipient;
            text += continuation.text;
            var id = [stimulus.id, type, continuation.id].join('-');

            data.push({
              id: id,
              natsort: id.replace(/^(\d-)/g, '0$1').replace(/(\d+)-(\w+)-(\d+)/g, '$1-$3-$2'),
              text: text,
              type: type,
              verb: stimulus.verb,
              category: stimulus.category,
              subcategory: stimulus.subcategory,
              "falsifies-motion": continuation["falsifies-motion"] || false,
              "falsifies-possession": continuation["falsifies-possession"] || false,
            });
          });
        });
      });
      // everything above and out is sync
      callback(err, data);
    });
  });
}

function loadCsv(csv, callback) {
  // assume , \n
  var field_separator = /,/, record_separator = /\n/;
  var lines = csv.split(record_separator);
  var header = lines[0].split(field_separator);
  var header_length = header.length;
  var rows = [];
  for (var i = 1, line; (line = lines[i]); i++) {
    if (line.length > 0) {
      var obj = {}, cells = line.split(field_separator);
      for (var c = 0; c < header_length; c++) {
        obj[header[c]] = cells[c];
      }
      rows.push(obj);
    }
  }
  callback(rows);
}


var results_path = '/Users/chbrown/Dropbox/ut/word-meaning-and-syntax/project-results/mturk-1to13.csv';
function getResults(callback) {
  fs.readFile(results_path, 'utf8', function(err, results_csv) {
    var records = [];
    csv().from(results_csv).from.options({columns: true})
      .on('record', function(record, index) {
        records.push(record);
      })
      .on('end', function(count) {
        callback(err, records);
      });
  });
}

function sum(arr) { var total = 0; for (var i = 0, l = arr.length; i < l; i++) total += arr[i]; return total; }
function mean(arr) { return sum(arr) / arr.length; }
function sd(arr) {
  var arr_mean = mean(arr), arr_length = arr.length, squared_error = 0;
  for (var i = 0; i < arr_length; i++) {
    squared_error += (arr[i] - arr_mean) * (arr[i] - arr_mean);
  }
  return squared_error / (arr_length - 1);
}
// sd([ 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0 ])


getStimuli(function(err, stimuli) {
  stimuli.sort(function(a, b) { return a.natsort.localeCompare(b.natsort); });
  // stimuli.sort(function(a, b) { return a.id.replace(/^(\d-)/g, '0$1').localeCompare(b.id.replace(/^(\d-)/g, '0$1')); });
  getResults(function(err, results) {
    var table = new Table();
    stimuli.forEach(function(stimulus) {
      // var ratings = [];
      // var familiarities = [];
      results.forEach(function(result) {
        // i.e. for each stimulus, for each result:
        if (result[stimulus.id] !== null) {
          table.add({
            // stimulus
            id: stimulus.id,
            natsort: stimulus.natsort,
            type: stimulus.type,
            verb: stimulus.verb,
            category: stimulus.category,
            subcategory: stimulus.subcategory,
            "falsifies-motion": stimulus["falsifies-motion"],
            "falsifies-possession": stimulus["falsifies-possession"],
            // result
            english: parseInt(result.english_familiarity, 10),
            submitted: result.submitted,
            turkerId: result.turkerId,
            // the join:
            rating: parseInt(result[stimulus.id], 10),
          });
        }
      });
      // stimulus.ratings = ratings.join('');
      // stimulus.ratings_count = ratings.length;
      // stimulus.ratings_sum = sum(ratings);
      // stimulus.ratings_mean = mean(ratings);
      // stimulus.ratings_sd = sd(ratings);
      // stimulus.familiarity_mean = mean(familiarities);

    });
    // table.keys = {id: 1, text: 1};
  });
});

// cat all50.csv | csv2tsv | awk 'BEGIN{FS="\t"}{print $68}' | tail -n+2 | wc -l
