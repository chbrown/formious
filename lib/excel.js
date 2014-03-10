/*jslint node: true */
var JSZip = require('jszip');
var xpath = require('xpath');
var xmldom = require('xmldom');

function excelColumnIndex(column) {
  /** Excel column names are one or two characters long:
    A = 0
    B = 1
    ...
    J = 9
    ...
    Z = 25
    AA = 26
    AB = 27
    ...
    AZ = 51
    BA = 52
    BB = 53
    ...

  A is 1-like for everything but the ones place (where it is 0-like),
    so we adjust char codes by 64 and then subtract one at the end.
  */
  var index = 0;
  for (var place = 0; place < column.length; place++) {
    var unit = column.charCodeAt(column.length - place - 1) - 64;
    index += unit * Math.pow(26, place);
  }
  return index - 1;
}

exports.parse = function(xlsx_buffer) {
  // returns list of strings
  // xlsx_buffer can be a String or Node.js Buffer
  var zip = new JSZip(xlsx_buffer);

  var sharedStrings_xml = zip.file('xl/sharedStrings.xml').asText();
  var sharedStrings_doc = new xmldom.DOMParser().parseFromString(sharedStrings_xml);
  var sharedStrings = xpath.select('//si/t/text()', sharedStrings_doc).map(String);

  var sheet1_xml = zip.file('xl/worksheets/sheet1.xml').asText();
  var sheet1_doc = new xmldom.DOMParser().parseFromString(sheet1_xml);

  // Excel does not use empty <c></c> elements for empty cells, so we have to use the r attribute indexing
  var table = [];
  xpath.select('//sheetData/row/c', sheet1_doc).map(function(c) {
    var cell_data = xpath.select1('v/text()', c).data;
    // the t="s" attribute instructs us that the cell is a reference to shared strings
    var value = (c.getAttribute('t') == 's') ? sharedStrings[cell_data] : cell_data;

    var coordinates = c.getAttribute('r');
    var m = coordinates.match(/^([A-Z]+)([0-9]+)$/);
    var col = excelColumnIndex(m[1]);
    var row = parseInt(m[2], 10) - 1;

    if (table[row] === undefined) {
      table[row] = [];
    }
    table[row][col] = value;
  });
  return table;
};
