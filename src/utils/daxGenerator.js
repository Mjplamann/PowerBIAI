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

export const generateDAXForVisual = (visual, tableName = 'Data') => {
  const measures = [];
  const { type, title, dataKey, nameKey, xAxis, yAxis } = visual;

  // Generate appropriate DAX based on visual type
  switch (type) {
    case 'card':
      // KPI Card measures
      measures.push({
        name: `Total ${dataKey}`,
        formula: `Total ${dataKey} = SUM('${tableName}'[${dataKey}])`,
        description: `Total sum of ${dataKey} for KPI card`
      });

      measures.push({
        name: `${dataKey} YTD`,
        formula: `${dataKey} YTD =
CALCULATE(
    SUM('${tableName}'[${dataKey}]),
    DATESYTD('${tableName}'[Date])
)`,
        description: `Year-to-date total for ${dataKey}`
      });

      measures.push({
        name: `${dataKey} vs PY`,
        formula: `${dataKey} vs PY =
VAR CurrentValue = SUM('${tableName}'[${dataKey}])
VAR PreviousYear =
    CALCULATE(
        SUM('${tableName}'[${dataKey}]),
        SAMEPERIODLASTYEAR('${tableName}'[Date])
    )
RETURN
    DIVIDE(CurrentValue - PreviousYear, PreviousYear, 0)`,
        description: `Year-over-year growth percentage`
      });
      break;

    case 'line':
    case 'area':
      // Time series measures
      measures.push({
        name: `${dataKey} Over Time`,
        formula: `${dataKey} Over Time = SUM('${tableName}'[${dataKey}])`,
        description: `Sum of ${dataKey} for time series visualization`
      });

      measures.push({
        name: `${dataKey} Moving Avg`,
        formula: `${dataKey} Moving Avg =
AVERAGEX(
    DATESINPERIOD(
        '${tableName}'[${xAxis}],
        LASTDATE('${tableName}'[${xAxis}]),
        -7,
        DAY
    ),
    SUM('${tableName}'[${dataKey}])
)`,
        description: `7-day moving average for trend analysis`
      });
      break;

    case 'bar':
    case 'column':
      // Categorical comparison measures
      measures.push({
        name: `${dataKey} by ${xAxis}`,
        formula: `${dataKey} by ${xAxis} = SUM('${tableName}'[${dataKey}])`,
        description: `Sum of ${dataKey} grouped by ${xAxis}`
      });

      measures.push({
        name: `% of Total ${dataKey}`,
        formula: `% of Total ${dataKey} =
DIVIDE(
    SUM('${tableName}'[${dataKey}]),
    CALCULATE(
        SUM('${tableName}'[${dataKey}]),
        ALL('${tableName}'[${xAxis}])
    ),
    0
)`,
        description: `Percentage contribution to total`
      });

      measures.push({
        name: `Rank by ${dataKey}`,
        formula: `Rank by ${dataKey} =
RANKX(
    ALL('${tableName}'[${xAxis}]),
    SUM('${tableName}'[${dataKey}]),
    ,
    DESC,
    Dense
)`,
        description: `Ranking by ${dataKey} value`
      });
      break;

    case 'pie':
    case 'donut':
      // Distribution measures
      measures.push({
        name: `${dataKey} Distribution`,
        formula: `${dataKey} Distribution = SUM('${tableName}'[${dataKey}])`,
        description: `Sum for distribution chart`
      });

      measures.push({
        name: `% Share of ${dataKey}`,
        formula: `% Share of ${dataKey} =
DIVIDE(
    SUM('${tableName}'[${dataKey}]),
    CALCULATE(
        SUM('${tableName}'[${dataKey}]),
        ALL('${tableName}')
    ),
    0
)`,
        description: `Percentage share of total`
      });
      break;

    case 'gauge':
      // Gauge/KPI with target
      measures.push({
        name: `${dataKey} Actual`,
        formula: `${dataKey} Actual = SUM('${tableName}'[${dataKey}])`,
        description: `Actual value for gauge`
      });

      measures.push({
        name: `${dataKey} Target`,
        formula: `${dataKey} Target = [${dataKey} Actual] * 1.2`,
        description: `Target value (120% of actual)`
      });

      measures.push({
        name: `${dataKey} Achievement %`,
        formula: `${dataKey} Achievement % =
DIVIDE(
    [${dataKey} Actual],
    [${dataKey} Target],
    0
)`,
        description: `Achievement percentage vs target`
      });
      break;

    case 'scatter':
      // Scatter plot measures
      const numericCols = [dataKey, yAxis || dataKey];
      measures.push({
        name: `Avg ${numericCols[0]}`,
        formula: `Avg ${numericCols[0]} = AVERAGE('${tableName}'[${numericCols[0]}])`,
        description: `Average for X-axis`
      });

      measures.push({
        name: `Avg ${numericCols[1]}`,
        formula: `Avg ${numericCols[1]} = AVERAGE('${tableName}'[${numericCols[1]}])`,
        description: `Average for Y-axis`
      });
      break;

    case 'table':
    case 'matrix':
      // Table measures
      measures.push({
        name: `Row Count`,
        formula: `Row Count = COUNTROWS('${tableName}')`,
        description: `Total number of rows`
      });

      measures.push({
        name: `Total ${dataKey}`,
        formula: `Total ${dataKey} = SUM('${tableName}'[${dataKey}])`,
        description: `Sum for table totals`
      });
      break;

    case 'waterfall':
      // Waterfall measures
      measures.push({
        name: `${dataKey} Value`,
        formula: `${dataKey} Value = SUM('${tableName}'[${dataKey}])`,
        description: `Value for waterfall chart`
      });

      measures.push({
        name: `${dataKey} Change`,
        formula: `${dataKey} Change =
VAR CurrentValue = SUM('${tableName}'[${dataKey}])
VAR PreviousValue =
    CALCULATE(
        SUM('${tableName}'[${dataKey}]),
        PREVIOUSMONTH('${tableName}'[Date])
    )
RETURN
    CurrentValue - PreviousValue`,
        description: `Period-over-period change`
      });
      break;

    case 'funnel':
      // Funnel measures
      measures.push({
        name: `${dataKey} Funnel`,
        formula: `${dataKey} Funnel = SUM('${tableName}'[${dataKey}])`,
        description: `Value for funnel stage`
      });

      measures.push({
        name: `Conversion Rate`,
        formula: `Conversion Rate =
VAR CurrentStage = SUM('${tableName}'[${dataKey}])
VAR FirstStage =
    CALCULATE(
        SUM('${tableName}'[${dataKey}]),
        TOPN(1, ALL('${tableName}'[${xAxis}]), [${dataKey}], DESC)
    )
RETURN
    DIVIDE(CurrentStage, FirstStage, 0)`,
        description: `Conversion rate from first stage`
      });
      break;

    default:
      // Generic measure
      measures.push({
        name: `${dataKey} Measure`,
        formula: `${dataKey} Measure = SUM('${tableName}'[${dataKey}])`,
        description: `Sum of ${dataKey}`
      });
  }

  return measures;
};

export const generateAllDAXMeasures = (dashboardSpec, tableName = 'Data') => {
  const allMeasures = [];

  dashboardSpec.visuals.forEach(visual => {
    const measures = generateDAXForVisual(visual, tableName);
    measures.forEach(measure => {
      // Avoid duplicates
      if (!allMeasures.find(m => m.name === measure.name)) {
        allMeasures.push(measure);
      }
    });
  });

  return allMeasures;
};
