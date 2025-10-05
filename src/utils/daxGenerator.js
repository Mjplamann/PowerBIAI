export const generateBasicMeasures = (columns, dataTypes) => {
  const measures = [];
  
  Object.keys(dataTypes).forEach(column => {
    const type = dataTypes[column];
    const cleanName = column.replace(/[^a-zA-Z0-9]/g, '');
    
    if (type === 'number') {
      measures.push({
        name: `Total ${cleanName}`,
        formula: `Total ${cleanName} = SUM('Data'[${column}])`,
        description: `Sum of all ${column} values`
      });
      
      measures.push({
        name: `Average ${cleanName}`,
        formula: `Average ${cleanName} = AVERAGE('Data'[${column}])`,
        description: `Average of ${column}`
      });
    }
    
    measures.push({
      name: `Count of ${cleanName}`,
      formula: `Count of ${cleanName} = COUNTROWS('Data')`,
      description: `Total number of records`
    });
  });
  
  return measures;
};

export const generateTimeIntelligence = (dateColumn) => {
  const cleanName = dateColumn.replace(/[^a-zA-Z0-9]/g, '');
  
  return [
    {
      name: 'YTD Sales',
      formula: `YTD Sales = TOTALYTD(SUM('Data'[Amount]), 'Data'[${dateColumn}])`,
      description: 'Year-to-date total sales'
    },
    {
      name: 'Previous Year Sales',
      formula: `PY Sales = CALCULATE(SUM('Data'[Amount]), SAMEPERIODLASTYEAR('Data'[${dateColumn}]))`,
      description: 'Sales from the same period last year'
    },
    {
      name: 'YoY Growth %',
      formula: `YoY Growth % = 
DIVIDE(
    SUM('Data'[Amount]) - [PY Sales],
    [PY Sales],
    0
)`,
      description: 'Year-over-year growth percentage'
    },
    {
      name: 'MTD Sales',
      formula: `MTD Sales = TOTALMTD(SUM('Data'[Amount]), 'Data'[${dateColumn}])`,
      description: 'Month-to-date total sales'
    }
  ];
};

export const validateDAX = (daxFormula) => {
  const errors = [];
  
  if (!daxFormula.includes('=')) {
    errors.push('Missing assignment operator (=)');
  }
  
  const openParens = (daxFormula.match(/\(/g) || []).length;
  const closeParens = (daxFormula.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unmatched parentheses');
  }
  
  const openBrackets = (daxFormula.match(/\[/g) || []).length;
  const closeBrackets = (daxFormula.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unmatched brackets');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatDAX = (daxFormula) => {
  let formatted = daxFormula;
  
  // Add line breaks after commas in function calls
  formatted = formatted.replace(/,\s*/g, ',\n    ');
  
  // Indent nested functions
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indented = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.includes(')')) indentLevel = Math.max(0, indentLevel - 1);
    const result = '    '.repeat(indentLevel) + trimmed;
    if (trimmed.includes('(') && !trimmed.includes(')')) indentLevel++;
    return result;
  });
  
  return indented.join('\n');
};

export const generatePowerQueryM = (fileName, headers) => {
  const headerTypes = headers.map(h => `        {"${h}", type text}`).join(',\n');
  return `let
    Source = Csv.Document(File.Contents("${fileName}"), [Delimiter=",", Columns=${headers.length}, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    PromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    ChangedType = Table.TransformColumnTypes(PromotedHeaders,{
${headerTypes}
    })
in
    ChangedType`;
};
