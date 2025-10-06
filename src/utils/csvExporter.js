// Clean and export CSV data
export const cleanCSVData = (csvData) => {
  if (!csvData?.data || !csvData?.headers) return null;

  const cleaned = csvData.data.map(row => {
    const cleanedRow = {};
    csvData.headers.forEach(header => {
      let value = row[header];
      
      // Clean empty values
      if (value === '' || value === null || value === undefined) {
        value = null;
      }
      
      // Trim whitespace
      if (typeof value === 'string') {
        value = value.trim();
      }
      
      // Convert to proper types
      if (value && !isNaN(parseFloat(value)) && !isNaN(Date.parse(value))) {
        // If it's a number
        value = parseFloat(value);
      }
      
      cleanedRow[header] = value;
    });
    return cleanedRow;
  });

  return {
    headers: csvData.headers,
    data: cleaned
  };
};

export const downloadCSV = (csvData, fileName = 'cleaned_data.csv') => {
  const cleaned = cleanCSVData(csvData);
  if (!cleaned) return;

  // Convert to CSV format
  const headers = cleaned.headers.join(',');
  const rows = cleaned.data.map(row => {
    return cleaned.headers.map(header => {
      let value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
      }
      
      return value;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const generatePowerQueryM = (fileName, headers, csvData) => {
  // Infer data types for proper Power Query M code
  const dataTypes = {};
  
  headers.forEach(header => {
    const sample = csvData.data.slice(0, 100).map(row => row[header]).filter(v => v);
    
    let isNumber = sample.every(v => !isNaN(parseFloat(v)));
    let isDate = sample.some(v => !isNaN(Date.parse(v)) && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(v));
    
    if (isDate) {
      dataTypes[header] = 'type date';
    } else if (isNumber) {
      dataTypes[header] = 'type number';
    } else {
      dataTypes[header] = 'type text';
    }
  });

  const typeTransforms = headers.map(h => `        {"${h}", ${dataTypes[h]}}`).join(',\n');

  return `let
    Source = Csv.Document(
        File.Contents("${fileName}"),
        [Delimiter=",", Columns=${headers.length}, Encoding=65001, QuoteStyle=QuoteStyle.None]
    ),
    PromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    ChangedType = Table.TransformColumnTypes(
        PromotedHeaders,
        {
${typeTransforms}
        }
    ),
    RemovedDuplicates = Table.Distinct(ChangedType),
    RemovedErrors = Table.RemoveRowsWithErrors(RemovedDuplicates)
in
    RemovedErrors`;
};
