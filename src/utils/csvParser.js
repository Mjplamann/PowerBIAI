export const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [], rowCount: 0, columnCount: 0 };
  
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = parseCSVLine(lines[0]);
  const data = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return {
    headers,
    data,
    rowCount: data.length,
    columnCount: headers.length
  };
};

export const inferDataTypes = (data, headers) => {
  const types = {};
  const sampleSize = Math.min(100, data.length);
  
  headers.forEach(header => {
    let numberCount = 0;
    let dateCount = 0;
    let boolCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][header];
      if (!value) continue;
      
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        numberCount++;
      }
      
      if (!isNaN(Date.parse(value)) && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(value)) {
        dateCount++;
      }
      
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        boolCount++;
      }
    }
    
    if (dateCount > sampleSize * 0.7) types[header] = 'date';
    else if (numberCount > sampleSize * 0.7) types[header] = 'number';
    else if (boolCount > sampleSize * 0.7) types[header] = 'boolean';
    else types[header] = 'string';
  });
  
  return types;
};

export const detectRelationships = (data, headers) => {
  const relationships = [];
  const dataTypes = inferDataTypes(data, headers);
  
  const dateColumns = headers.filter(h => dataTypes[h] === 'date');
  const numericColumns = headers.filter(h => dataTypes[h] === 'number');
  
  return {
    dateColumns,
    numericColumns,
    potentialKeys: headers.filter(h => {
      const uniqueValues = new Set(data.map(row => row[h]));
      return uniqueValues.size === data.length;
    })
  };
};

export const getColumnStats = (data, columnName) => {
  const values = data.map(row => row[columnName]).filter(v => v !== '' && v !== null && v !== undefined);
  const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
  
  const stats = {
    totalCount: data.length,
    nonNullCount: values.length,
    nullCount: data.length - values.length,
    uniqueCount: new Set(values).size
  };
  
  if (numericValues.length > 0) {
    stats.min = Math.min(...numericValues);
    stats.max = Math.max(...numericValues);
    stats.avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    stats.sum = numericValues.reduce((a, b) => a + b, 0);
  }
  
  return stats;
};
