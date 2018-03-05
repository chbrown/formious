import * as JSZip from 'jszip'
import * as xlsx from 'xlsx'
import * as xpath from 'xpath'
import * as xmldom from 'xmldom'

/**
Convert an Excel column name into its index.

Excel column names are one or two characters long:
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
function excelColumnIndex(column: string): number {
  var index = 0
  for (var place = 0; place < column.length; place++) {
    var unit = column.charCodeAt(column.length - place - 1) - 64
    index += unit * Math.pow(26, place)
  }
  return index - 1
}

/**
Returns a list of lists of strings.
One list of strings for each row in the provided Excel file.
Headers are not treated specially.
*/
export function parseSheetXml(sharedStrings_xml: string, sheet_xml: string): string[][] {
  var sharedStrings_doc = new xmldom.DOMParser().parseFromString(sharedStrings_xml).documentElement
  var select = xpath.useNamespaces({main: sharedStrings_doc.namespaceURI})
  // sharedStrings is an Array of strings, which Excel references from another sheet,
  // instead of storing those strings in the main sheet. Weird, but that's how it works.
  var sharedStrings = select('//main:si/main:t/text()', sharedStrings_doc).map(String)
  // logger.info('sharedStrings: %j', sharedStrings)

  var sheet_doc = new xmldom.DOMParser().parseFromString(sheet_xml).documentElement

  // Excel does not use empty <c></c> elements for empty cells, so we have to use the r attribute indexing
  var table: string[][] = []
  select('//main:sheetData/main:row/main:c', sheet_doc).forEach(function(c) {
    var cell_data = select('main:v/text()[1]', c)[0].data
    // the t="s" attribute instructs us that the cell is a reference to shared strings
    var value = c.getAttribute('t') == 's' ? sharedStrings[cell_data] : cell_data

    var coordinates = c.getAttribute('r')
    var m = coordinates.match(/^([A-Z]+)([0-9]+)$/)
    var col = excelColumnIndex(m[1])
    var row = parseInt(m[2], 10) - 1

    // initialize the row if needed
    if (table[row] === undefined) {
      table[row] = []
    }
    table[row][col] = value
  })
  return table
}

/**
Read the first sheet from an XLSX (Microsoft Excel file) into a list of lists of strings.
*/
export function parseZip(xlsxBuffer: string | Buffer): string[][] {
  try {
    var zip = new JSZip(xlsxBuffer)

    var sharedStrings_xml = zip.file('xl/sharedStrings.xml').asText()
    var sheet1_xml = zip.file('xl/worksheets/sheet1.xml').asText()

    return parseSheetXml(sharedStrings_xml, sheet1_xml)
  }
  catch (exc) {
    return exc
  }
}

export function parseXlsx(xlsxBuffer: Buffer) {
  try {
    var workbook = xlsx.read(xlsxBuffer)

    var worksheet = workbook.Sheets[workbook.SheetNames[0]]
    var json = xlsx.utils.sheet_to_json(worksheet)

    return json
  }
  catch (exc) {
    return exc
  }
}
