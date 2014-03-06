/*jslint node: true */
var JSZip = require('jszip');
var xpath = require('xpath');
var xmldom = require('xmldom');
var _ = require('underscore');

function useHeaders(rows) {
  var columns = rows[0];
  var data = rows.slice(1).map(function(cells) {
    var pairs = _.zip(columns, cells);
    return _.object(pairs);
  });
  return {
    columns: columns,
    rows: data,
  };
}

exports.parse = function(xlsx_contents) {
  // xlsx_contents can be a String or Node.js Buffer
  var zip = new JSZip(xlsx_contents);

  var sharedStrings_xml = zip.file('xl/sharedStrings.xml').asText();
  var sharedStrings_doc = new xmldom.DOMParser().parseFromString(sharedStrings_xml);
  var sharedStrings = xpath.select('//si/t/text()', sharedStrings_doc).map(String);

  var sheet1_xml = zip.file('xl/worksheets/sheet1.xml').asText();
  var sheet1_doc = new xmldom.DOMParser().parseFromString(sheet1_xml);

  var rows = xpath.select('//sheetData/row', sheet1_doc).map(function(row) {
    return xpath.select('c', row).map(function(c) {
      var value = xpath.select1('v/text()', c);
      // the t="s" attribute instructs us that the cell is a reference to shared strings
      if (c.getAttribute('t') == 's') {
        return sharedStrings[value];
      }
      else {
        return value.data;
      }
    });
  });

  return useHeaders(rows);
};
