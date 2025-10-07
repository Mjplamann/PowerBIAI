/**
 * Data Cleaning Service
 * Produces Power BI-ready CSV with proper formatting
 */

export const cleanDataForPowerBI = (csvData) => {
  const { headers, data } = csvData;

  // Detect column types
  const columnTypes = detectColumnTypes(data, headers);

  // Clean and format data
  const cleanedData = data.map(row => {
    const cleanedRow = {};

    headers.forEach(header => {
      const value = row[header];
      const type = columnTypes[header];

      // Clean based on type
      cleanedRow[header] = cleanValue(value, type);
    });

    return cleanedRow;
  });

  return {
    headers,
    data: cleanedData,
    columnTypes,
    rowCount: cleanedData.length,
    columnCount: headers.length
  };
};

const detectColumnTypes = (data, headers) => {
  const types = {};

  headers.forEach(header => {
    const sample = data.slice(0, 100).map(row => row[header]).filter(v => v !== '' && v !== null && v !== undefined);

    // Date detection
    const dateCount = sample.filter(v => {
      const parsed = new Date(v);
      return !isNaN(parsed.getTime()) && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(v);
    }).length;

    // Number detection
    const numberCount = sample.filter(v => !isNaN(parseFloat(v)) && v !== '').length;

    // Boolean detection
    const boolCount = sample.filter(v =>
      v.toString().toLowerCase() === 'true' ||
      v.toString().toLowerCase() === 'false'
    ).length;

    if (dateCount > sample.length * 0.7) {
      types[header] = 'date';
    } else if (numberCount > sample.length * 0.7) {
      types[header] = 'number';
    } else if (boolCount > sample.length * 0.7) {
      types[header] = 'boolean';
    } else {
      types[header] = 'text';
    }
  });

  return types;
};

const cleanValue = (value, type) => {
  // Handle null/undefined/empty
  if (value === null || value === undefined || value === '') {
    return type === 'number' ? 0 : '';
  }

  switch (type) {
    case 'date':
      // Standardize to YYYY-MM-DD format
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return value; // Return original if can't parse

    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;

    case 'boolean':
      return value.toString().toLowerCase() === 'true' ? 'TRUE' : 'FALSE';

    case 'text':
    default:
      // Remove extra whitespace, trim
      return String(value).trim();
  }
};

export const generatePowerQueryMCode = (fileName, headers, columnTypes) => {
  const tableName = fileName.replace('.csv', '').replace(/[^a-zA-Z0-9]/g, '_');

  // Generate column type transformations
  const typeTransformations = headers.map(header => {
    const type = columnTypes[header];
    let powerBIType;

    switch (type) {
      case 'date':
        powerBIType = 'type date';
        break;
      case 'number':
        powerBIType = 'type number';
        break;
      case 'boolean':
        powerBIType = 'type logical';
        break;
      case 'text':
      default:
        powerBIType = 'type text';
    }

    return `{"${header}", ${powerBIType}}`;
  }).join(',\n        ');

  return `let
    // Step 1: Import CSV file
    Source = Csv.Document(
        File.Contents("C:\\\\Path\\\\To\\\\Your\\\\${fileName}_cleaned.csv"),
        [Delimiter=",", Columns=${headers.length}, Encoding=65001, QuoteStyle=QuoteStyle.Csv]
    ),

    // Step 2: Promote first row to headers
    PromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),

    // Step 3: Set correct data types for each column
    ChangedType = Table.TransformColumnTypes(
        PromotedHeaders,
        {
        ${typeTransformations}
        }
    ),

    // Step 4: Remove any duplicate rows (optional)
    RemovedDuplicates = Table.Distinct(ChangedType),

    // Step 5: Final table
    FinalTable = RemovedDuplicates
in
    FinalTable`;
};

export const generateCleanedCSV = (cleanedData) => {
  const { headers, data } = cleanedData;

  // Create CSV content
  const headerRow = headers.join(',');
  const dataRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];

      // Handle values that need quoting
      if (value === null || value === undefined) {
        return '';
      }

      value = String(value);

      // Quote if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }

      return value;
    }).join(',');
  }).join('\n');

  return headerRow + '\n' + dataRows;
};
