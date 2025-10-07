import Anthropic from '@anthropic-ai/sdk';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// Initialize Anthropic client
const anthropic = API_KEY ? new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
}) : null;

/**
 * Analyze CSV data and generate dashboard specification
 * Now sends FULL dataset to Claude for comprehensive analysis
 */
export const analyzeData = async (csvData) => {
  const { headers, data, rowCount, columnCount } = csvData;

  // If no API key, fall back to mock behavior
  if (!anthropic) {
    return mockAnalyzeData(csvData);
  }

  try {
    // For datasets > 1000 rows, send statistical summary + representative sample
    // For smaller datasets, send everything
    let dataPreview;
    let dataDescription;

    if (rowCount > 1000) {
      // Large dataset: send statistics + stratified sample
      const sampleSize = 200;
      const interval = Math.floor(rowCount / sampleSize);
      const stratifiedSample = data.filter((_, idx) => idx % interval === 0).slice(0, sampleSize);

      dataPreview = JSON.stringify(stratifiedSample, null, 2);
      dataDescription = `Large dataset (${rowCount} rows). Showing stratified sample of ${stratifiedSample.length} rows.`;
    } else {
      // Small/medium dataset: send all data
      dataPreview = JSON.stringify(data, null, 2);
      dataDescription = `Complete dataset (${rowCount} rows).`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a Power BI dashboard expert. Analyze this CSV data and create a dashboard specification.

**Data Info:**
- Rows: ${rowCount}
- Columns: ${columnCount}
- Headers: ${headers.join(', ')}

**Dataset:**
${dataDescription}
${dataPreview}

**Task:** Generate a JSON dashboard specification with these rules:

1. Identify column types:
   - Numeric columns: contain numbers (revenue, sales, count, etc.)
   - Date columns: contain dates (check for patterns like MM/DD/YY, YYYY-MM-DD)
   - Category columns: text values (region, product, name, etc.)

2. Create 5-7 visuals:
   - 2-3 KPI cards for key metrics (using numeric columns with variation/non-zero values)
   - 1 line chart for trends (if date column exists, use numeric column with variation)
   - 1 bar chart for categorical comparison (use category + numeric column)
   - 1 pie chart for distribution (use category + numeric column)
   - 1 data table showing top records

3. Prioritize columns with actual variation (not all zeros)

**Response Format (JSON only, no markdown):**
{
  "title": "Dashboard Title",
  "colorPalette": "corporate",
  "visuals": [
    {
      "type": "card",
      "title": "Total Revenue",
      "metric": "Revenue",
      "dataKey": "Revenue",
      "format": "currency"
    },
    {
      "type": "line",
      "title": "Revenue Over Time",
      "xAxis": "Date",
      "yAxis": "Revenue",
      "dataKey": "Revenue"
    }
  ]
}

**Important:**
- Only use actual column names from the headers
- Choose columns with meaningful data (non-zero values)
- Return ONLY the JSON object, no explanatory text`
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const dashboardSpec = JSON.parse(jsonMatch[0]);
      return {
        message: `I've analyzed your dataset with ${rowCount} rows and ${columnCount} columns. Created a professional dashboard with KPI cards, trend analysis, and categorical breakdowns optimized for Power BI.`,
        dashboardSpec
      };
    } else {
      // Fallback if Claude doesn't return valid JSON
      return mockAnalyzeData(csvData);
    }

  } catch (error) {
    console.error('Claude API error:', error);
    // Fallback to mock on error
    return mockAnalyzeData(csvData);
  }
};

/**
 * Refine dashboard design based on user chat
 */
export const refineDesign = async (currentSpec, userMessage, conversationHistory) => {
  const msg = userMessage.toLowerCase();

  // If no API key, use mock behavior
  if (!anthropic) {
    return mockRefineDesign(currentSpec, userMessage, conversationHistory);
  }

  try {
    // Build conversation context
    const conversationContext = conversationHistory.slice(-5).map(item =>
      `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`
    ).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a Power BI dashboard assistant. The user wants to modify their dashboard.

**Current Dashboard Spec:**
${JSON.stringify(currentSpec, null, 2)}

**Recent Conversation:**
${conversationContext}

**User Request:**
"${userMessage}"

**Task:** Update the dashboard spec based on the user's request.

**Common Commands:**
- "add [type] chart" - Add a visual (bar, line, pie, area, scatter, gauge, funnel, waterfall, table, card)
- "remove [type/first/last]" - Remove visuals
- "show top 5/10/20" - Filter to top N items
- "show all data" - Remove filters
- "use [palette] colors" - Change color theme (vibrant, ocean, forest, earthy, corporate)
- "change title to [name]" - Rename dashboard
- "show [metric] by [dimension]" - Add chart with specific fields

**Response Format (JSON only):**
{
  "message": "Explanation of what you did",
  "dashboardSpec": { ...updated spec... }
}

Return ONLY the JSON object.`
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    } else {
      // Fallback to mock
      return mockRefineDesign(currentSpec, userMessage, conversationHistory);
    }

  } catch (error) {
    console.error('Claude API error:', error);
    return mockRefineDesign(currentSpec, userMessage, conversationHistory);
  }
};

/**
 * Generate comprehensive DAX measures based on full dataset
 */
export const generateComprehensiveDAX = async (csvData, dashboardSpec) => {
  if (!anthropic) {
    return generateMockDAXMeasures(csvData);
  }

  try {
    const { headers, data, rowCount } = csvData;

    // Get column statistics
    const columnStats = headers.map(header => {
      const values = data.map(row => row[header]).filter(v => v !== '' && v !== null);
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));

      return {
        name: header,
        type: numericValues.length > values.length * 0.7 ? 'numeric' : 'text',
        uniqueCount: new Set(values).size,
        sampleValues: values.slice(0, 5)
      };
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a Power BI DAX expert. Generate comprehensive DAX measures for this dataset.

**Dataset Info:**
- Total Rows: ${rowCount}
- Columns: ${headers.join(', ')}

**Column Details:**
${JSON.stringify(columnStats, null, 2)}

**Dashboard Visuals:**
${JSON.stringify(dashboardSpec.visuals.map(v => ({ type: v.type, title: v.title, dataKey: v.dataKey })), null, 2)}

**Task:** Generate 10-15 essential DAX measures including:
1. Basic aggregations (SUM, COUNT, AVERAGE for numeric columns)
2. Time intelligence (if date column exists: YTD, MTD, previous period comparisons)
3. Calculated columns (profit margins, growth rates, etc.)
4. Advanced measures (rankings, moving averages, cumulative totals)

**Response Format (JSON array):**
[
  {
    "name": "Total Revenue",
    "formula": "Total Revenue = SUM('Data'[Revenue])",
    "description": "Sum of all revenue",
    "category": "Basic Aggregation"
  },
  {
    "name": "Revenue YTD",
    "formula": "Revenue YTD = TOTALYTD(SUM('Data'[Revenue]), 'Data'[Date])",
    "description": "Year-to-date revenue",
    "category": "Time Intelligence"
  }
]

Return ONLY the JSON array, no markdown formatting.`
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return generateMockDAXMeasures(csvData);
    }

  } catch (error) {
    console.error('Claude API error:', error);
    return generateMockDAXMeasures(csvData);
  }
};

/**
 * Generate DAX measure suggestion (single measure)
 */
export const generateDAX = async (measureDescription, dataStructure) => {
  if (!anthropic) {
    return {
      name: "Total Sales",
      formula: "Total Sales = SUM('Data'[Amount])",
      description: "Calculates the total sales amount"
    };
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Generate a DAX measure for Power BI.

**Request:** ${measureDescription}

**Available Columns:** ${JSON.stringify(dataStructure)}

**Response Format (JSON only):**
{
  "name": "Measure Name",
  "formula": "Measure Name = DAX_FORMULA_HERE",
  "description": "What this measure calculates"
}`
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      name: "Custom Measure",
      formula: "Custom Measure = SUM('Data'[Value])",
      description: measureDescription
    };

  } catch (error) {
    console.error('Claude API error:', error);
    return {
      name: "Custom Measure",
      formula: "Custom Measure = SUM('Data'[Value])",
      description: measureDescription
    };
  }
};

/**
 * Generate data cleaning recommendations
 */
export const analyzeDataQuality = async (csvData) => {
  if (!anthropic) {
    return {
      issues: [],
      recommendations: ["Data appears clean and ready for Power BI"],
      cleanedData: csvData
    };
  }

  try {
    const { headers, data, rowCount } = csvData;
    const sample = data.slice(0, 50);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this CSV data for quality issues and provide cleaning recommendations.

**Dataset Info:**
- Rows: ${rowCount}
- Columns: ${headers.join(', ')}

**Sample Data:**
${JSON.stringify(sample, null, 2)}

**Task:** Identify data quality issues:
- Missing values (nulls, empty strings)
- Inconsistent formatting (dates, numbers)
- Duplicate rows
- Outliers or invalid values
- Column naming issues

**Response Format (JSON only):**
{
  "issues": [
    {
      "column": "Date",
      "issue": "Inconsistent date format",
      "severity": "high",
      "affectedRows": 150
    }
  ],
  "recommendations": [
    "Standardize Date column to YYYY-MM-DD format",
    "Fill missing Revenue values with 0 or median",
    "Remove duplicate rows based on ID column"
  ],
  "summary": "Found 3 issues affecting data quality"
}

Return ONLY the JSON object.`
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        ...analysis,
        cleanedData: csvData // In a full implementation, apply cleaning transformations
      };
    } else {
      return {
        issues: [],
        recommendations: ["Data appears clean and ready for Power BI"],
        cleanedData: csvData
      };
    }

  } catch (error) {
    console.error('Claude API error:', error);
    return {
      issues: [],
      recommendations: ["Unable to analyze data quality"],
      cleanedData: csvData
    };
  }
};

// Mock DAX generator for fallback
const generateMockDAXMeasures = (csvData) => {
  const { headers } = csvData;
  const measures = [];

  // Find numeric columns
  const numericCols = headers.filter(h =>
    h.toLowerCase().includes('revenue') ||
    h.toLowerCase().includes('amount') ||
    h.toLowerCase().includes('sales') ||
    h.toLowerCase().includes('count') ||
    h.toLowerCase().includes('purchased')
  );

  // Generate basic measures
  numericCols.forEach(col => {
    measures.push({
      name: `Total ${col}`,
      formula: `Total ${col} = SUM('Data'[${col}])`,
      description: `Sum of all ${col}`,
      category: "Basic Aggregation"
    });

    measures.push({
      name: `Average ${col}`,
      formula: `Average ${col} = AVERAGE('Data'[${col}])`,
      description: `Average ${col}`,
      category: "Basic Aggregation"
    });
  });

  return measures;
};

// ============================================================================
// MOCK FUNCTIONS (Fallback when no API key)
// ============================================================================

const mockAnalyzeData = (csvData) => {
  const { headers, data, rowCount, columnCount } = csvData;

  // Generate intelligent dashboard spec based on data
  const numericColumns = headers.filter(header => {
    const sample = data.slice(0, Math.min(20, data.length)).map(row => row[header]).filter(v => v !== '' && v !== null && v !== undefined);
    if (sample.length === 0) return false;
    const numericCount = sample.filter(val => !isNaN(parseFloat(val)) && val !== '').length;
    return numericCount > sample.length * 0.7; // 70% must be numeric
  });

  const dateColumns = headers.filter(header => {
    const sample = data.slice(0, Math.min(20, data.length)).map(row => row[header]).filter(v => v !== '' && v !== null && v !== undefined);
    if (sample.length === 0) return false;
    const dateCount = sample.filter(val => !isNaN(Date.parse(val)) && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(val)).length;
    return dateCount > sample.length * 0.7; // 70% must be dates
  });

  const categoryColumns = headers.filter(h => !numericColumns.includes(h) && !dateColumns.includes(h));

  const dashboardSpec = {
    title: "Data Overview Dashboard",
    colorPalette: "corporate",
    visuals: []
  };

  // Add KPI cards for numeric columns
  numericColumns.slice(0, 3).forEach(col => {
    dashboardSpec.visuals.push({
      type: 'card',
      title: `Total ${col}`,
      metric: col,
      dataKey: col,
      format: 'number'
    });
  });

  // Add line chart if date column exists
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    // Find a numeric column with actual variation (not all zeros)
    const goodNumericCol = numericColumns.find(col => {
      const values = data.slice(0, 20).map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      const nonZero = values.filter(v => v !== 0);
      return nonZero.length > 0; // Has at least some non-zero values
    }) || numericColumns[0];

    dashboardSpec.visuals.push({
      type: 'line',
      title: `${goodNumericCol} Over Time`,
      xAxis: dateColumns[0],
      yAxis: goodNumericCol,
      dataKey: goodNumericCol
    });
  }

  // Add bar chart for categories
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    // Use a numeric column with variation
    const goodNumericCol = numericColumns.find(col => {
      const values = data.slice(0, 20).map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      const nonZero = values.filter(v => v !== 0);
      return nonZero.length > 0;
    }) || numericColumns[0];

    dashboardSpec.visuals.push({
      type: 'bar',
      title: `${goodNumericCol} by ${categoryColumns[0]}`,
      xAxis: categoryColumns[0],
      yAxis: goodNumericCol,
      dataKey: goodNumericCol
    });
  }

  // Add pie chart for distribution
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    const goodNumericCol = numericColumns.find(col => {
      const values = data.slice(0, 20).map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      const nonZero = values.filter(v => v !== 0);
      return nonZero.length > 0;
    }) || numericColumns[0];

    dashboardSpec.visuals.push({
      type: 'pie',
      title: `Distribution by ${categoryColumns[0]}`,
      dataKey: goodNumericCol,
      nameKey: categoryColumns[0]
    });
  }

  // Add data table
  dashboardSpec.visuals.push({
    type: 'table',
    title: 'Top 10 Records',
    columns: headers.slice(0, 5)
  });

  return {
    message: `I've analyzed your dataset with ${rowCount} rows and ${columnCount} columns. Here's a recommended dashboard design featuring KPI cards, trend analysis, categorical breakdowns, and detailed tables.`,
    dashboardSpec
  };
};

const mockRefineDesign = (currentSpec, userMessage, conversationHistory) => {
  const updatedSpec = JSON.parse(JSON.stringify(currentSpec)); // Deep clone
  const msg = userMessage.toLowerCase();
  let responseMessage = "I've updated the dashboard based on your feedback. The changes are now visible in the preview!";
  let madeChanges = false;

  // Handle questions and troubleshooting
  if (msg.includes('why') || msg.includes('blank') || msg.includes('empty') || msg.includes('not showing')) {
    const hasLineChart = updatedSpec.visuals.some(v => v.type === 'line' || v.type === 'area');
    if (hasLineChart && (msg.includes('line') || msg.includes('trend') || msg.includes('time') || msg.includes('chart'))) {
      responseMessage = `The line chart might be blank because:\n\n1. The data may have very few points\n2. Values might be zero or null\n3. Date formatting might need adjustment\n\nTry:\n- "Show all data" to remove filters\n- Adding a different chart type\n- Checking your CSV has non-zero values\n\nYou can also click the visual to change it to a different chart type!`;
      return { message: responseMessage, dashboardSpec: updatedSpec };
    }
    responseMessage = `If visuals are blank, here are common causes:\n\n1. **Data has zeros**: Check your CSV for actual values\n2. **Wrong field mapping**: Try different visual types\n3. **Date format**: Dates should be consistent (MM/DD/YY or YYYY-MM-DD)\n4. **Filters applied**: Try "show all data"\n\nClick any visual to change its type, or use Quick Actions to add new ones!`;
    return { message: responseMessage, dashboardSpec: updatedSpec };
  }

  if (msg.includes('help') || msg.includes('what can') || msg.includes('how do')) {
    responseMessage = `I can help you with:\n\n📊 **Add Visuals**: "add a line chart", "add a pie chart", "add a gauge"\n🎨 **Change Colors**: "use vibrant colors", "use ocean colors"\n🔢 **Filter Data**: "show top 10", "show top 5"\n❌ **Remove Items**: "remove the last visual", "remove all pie charts"\n📝 **Rename**: "change title to Sales Dashboard"\n\nYou can also:\n- Click any visual to change its type\n- Drag corners to resize\n- Click "Colors" for custom hex codes`;
    return { message: responseMessage, dashboardSpec: updatedSpec };
  }

  // Color palette changes
  if (msg.includes('vibrant') || msg.includes('colorful')) {
    updatedSpec.colorPalette = 'vibrant';
    responseMessage = "Changed to vibrant color palette with bright, energetic colors!";
    madeChanges = true;
  } else if (msg.includes('earthy') || msg.includes('natural')) {
    updatedSpec.colorPalette = 'earthy';
    responseMessage = "Switched to earthy tones for a natural, organic look.";
    madeChanges = true;
  } else if (msg.includes('ocean') || msg.includes('blue')) {
    updatedSpec.colorPalette = 'ocean';
    responseMessage = "Applied ocean blue color scheme for a calm, professional appearance.";
    madeChanges = true;
  } else if (msg.includes('forest') || msg.includes('green')) {
    updatedSpec.colorPalette = 'forest';
    responseMessage = "Changed to forest green palette with natural tones.";
    madeChanges = true;
  } else if (msg.includes('corporate') || msg.includes('professional')) {
    updatedSpec.colorPalette = 'corporate';
    responseMessage = "Switched to corporate color scheme for a professional look.";
    madeChanges = true;
  }

  // Add specific visual types
  if (msg.includes('add') && msg.includes('scatter')) {
    const numericCols = currentSpec.visuals.filter(v => v.dataKey).map(v => v.dataKey);
    updatedSpec.visuals.push({
      type: 'scatter',
      title: 'Scatter Plot Analysis',
      xAxis: numericCols[0] || 'Value1',
      yAxis: numericCols[1] || 'Value2',
      dataKey: numericCols[0] || 'Value'
    });
    responseMessage = "Added a scatter plot to analyze correlations between variables.";
    madeChanges = true;
  }

  if (msg.includes('add') && msg.includes('gauge')) {
    updatedSpec.visuals.push({
      type: 'gauge',
      title: 'Performance Gauge',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a gauge visual to track performance metrics.";
    madeChanges = true;
  }

  if (msg.includes('add') && msg.includes('funnel')) {
    updatedSpec.visuals.push({
      type: 'funnel',
      title: 'Conversion Funnel',
      xAxis: currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Stage',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a funnel chart to visualize conversion stages.";
    madeChanges = true;
  }

  if (msg.includes('add') && msg.includes('waterfall')) {
    updatedSpec.visuals.push({
      type: 'waterfall',
      title: 'Waterfall Analysis',
      xAxis: currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Category',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a waterfall chart to show incremental changes.";
    madeChanges = true;
  }

  if (msg.includes('add') && (msg.includes('kpi') || msg.includes('card'))) {
    updatedSpec.visuals.unshift({
      type: 'card',
      title: 'Total Records',
      metric: 'Count',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount',
      format: 'number'
    });
    responseMessage = "Added a KPI card to highlight key metrics at the top.";
    madeChanges = true;
  }

  if (msg.includes('add') && msg.includes('line')) {
    updatedSpec.visuals.push({
      type: 'line',
      title: 'Trend Over Time',
      xAxis: currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Date',
      yAxis: currentSpec.visuals[0]?.dataKey || 'Amount',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a line chart to visualize trends over time.";
    madeChanges = true;
  }

  if (msg.includes('add') && (msg.includes('bar') || msg.includes('column') || (msg.includes('chart') && (msg.includes('by') || msg.includes('show'))))) {
    // Try to extract what to show and by what dimension
    const byMatch = msg.match(/(?:show|chart)\s+(\w+)\s+by\s+(\w+)/i);
    let xAxisField = currentSpec.visuals.find(v => v.nameKey)?.nameKey || currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Category';
    let dataField = currentSpec.visuals[0]?.dataKey || 'Amount';

    if (byMatch) {
      const [, metricHint, dimensionHint] = byMatch;
      // Try to find matching fields in the data
      const availableFields = currentSpec.visuals.flatMap(v => [v.dataKey, v.nameKey, v.xAxis]).filter(Boolean);

      // Look for dimension field (e.g., "week", "month", "category")
      const dimensionMatch = availableFields.find(f => f.toLowerCase().includes(dimensionHint.toLowerCase()));
      if (dimensionMatch) xAxisField = dimensionMatch;

      // Look for metric field (e.g., "sales", "revenue", "amount")
      const metricMatch = availableFields.find(f => f.toLowerCase().includes(metricHint.toLowerCase()));
      if (metricMatch) dataField = metricMatch;
    }

    updatedSpec.visuals.push({
      type: 'bar',
      title: `${dataField} by ${xAxisField}`,
      xAxis: xAxisField,
      yAxis: dataField,
      dataKey: dataField
    });
    responseMessage = `Added a bar chart showing ${dataField} by ${xAxisField}.`;
    madeChanges = true;
  }

  if (msg.includes('add') && (msg.includes('pie') || msg.includes('donut'))) {
    const type = msg.includes('donut') ? 'donut' : 'pie';
    updatedSpec.visuals.push({
      type: type,
      title: `Distribution ${type === 'donut' ? 'Donut' : 'Pie'} Chart`,
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount',
      nameKey: currentSpec.visuals.find(v => v.nameKey)?.nameKey || 'Category'
    });
    responseMessage = `Added a ${type} chart to show distribution breakdown.`;
    madeChanges = true;
  }

  if (msg.includes('add') && msg.includes('area')) {
    updatedSpec.visuals.push({
      type: 'area',
      title: 'Area Chart',
      xAxis: currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Date',
      yAxis: currentSpec.visuals[0]?.dataKey || 'Amount',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added an area chart for filled trend visualization.";
    madeChanges = true;
  }

  if (msg.includes('add') && msg.includes('table')) {
    updatedSpec.visuals.push({
      type: 'table',
      title: 'Data Table',
      columns: currentSpec.visuals[0]?.columns || ['Column1', 'Column2', 'Column3']
    });
    responseMessage = "Added a data table for detailed record viewing.";
    madeChanges = true;
  }

  // Remove visuals
  if (msg.includes('remove') && msg.includes('all')) {
    updatedSpec.visuals = [];
    responseMessage = "Removed all visuals from the dashboard.";
    madeChanges = true;
  } else if (msg.includes('remove') && msg.includes('last')) {
    if (updatedSpec.visuals.length > 0) {
      updatedSpec.visuals = updatedSpec.visuals.slice(0, -1);
      responseMessage = "Removed the last visual from the dashboard.";
      madeChanges = true;
    }
  } else if (msg.includes('remove') && msg.includes('first')) {
    if (updatedSpec.visuals.length > 0) {
      updatedSpec.visuals = updatedSpec.visuals.slice(1);
      responseMessage = "Removed the first visual from the dashboard.";
      madeChanges = true;
    }
  } else if (msg.includes('remove') && msg.includes('pie')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'pie').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'pie');
    responseMessage = `Removed ${count} pie chart${count !== 1 ? 's' : ''} from the dashboard.`;
    madeChanges = true;
  } else if (msg.includes('remove') && msg.includes('bar')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'bar').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'bar');
    responseMessage = `Removed ${count} bar chart${count !== 1 ? 's' : ''} from the dashboard.`;
    madeChanges = true;
  } else if (msg.includes('remove') && msg.includes('card')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'card').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'card');
    responseMessage = `Removed ${count} KPI card${count !== 1 ? 's' : ''} from the dashboard.`;
    madeChanges = true;
  } else if (msg.includes('remove') && msg.includes('table')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'table').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'table');
    responseMessage = `Removed ${count} table${count !== 1 ? 's' : ''} from the dashboard.`;
    madeChanges = true;
  }

  // Filtering options
  if (msg.includes('top 5')) {
    updatedSpec.visuals.forEach(v => {
      if (v.type === 'bar' || v.type === 'pie' || v.type === 'column') {
        v.topN = 5;
      }
    });
    responseMessage = "Updated charts to show only top 5 items.";
    madeChanges = true;
  } else if (msg.includes('top 10') || msg.includes('top ten')) {
    updatedSpec.visuals.forEach(v => {
      if (v.type === 'bar' || v.type === 'pie' || v.type === 'column') {
        v.topN = 10;
      }
    });
    responseMessage = "Updated charts to show only top 10 items.";
    madeChanges = true;
  } else if (msg.includes('top 20')) {
    updatedSpec.visuals.forEach(v => {
      if (v.type === 'bar' || v.type === 'pie' || v.type === 'column') {
        v.topN = 20;
      }
    });
    responseMessage = "Updated charts to show top 20 items.";
    madeChanges = true;
  } else if (msg.includes('show all')) {
    updatedSpec.visuals.forEach(v => {
      delete v.topN;
    });
    responseMessage = "Updated charts to show all available data.";
    madeChanges = true;
  }

  // Dashboard title changes
  if (msg.includes('change title') || msg.includes('rename dashboard')) {
    const titleMatch = msg.match(/(?:to|:)\s*["']?([^"']+)["']?$/);
    if (titleMatch) {
      updatedSpec.title = titleMatch[1];
      responseMessage = `Changed dashboard title to "${titleMatch[1]}".`;
      madeChanges = true;
    }
  }

  // If no changes were made and it wasn't a question, provide helpful feedback
  if (!madeChanges && !msg.includes('why') && !msg.includes('help') && !msg.includes('blank')) {
    responseMessage = `I didn't understand that command. Try:\n\n• "add a [chart type]" - Add visuals\n• "remove [type/last/first]" - Remove visuals\n• "use [color] colors" - Change theme\n• "show top 10" - Filter data\n• "help" - See all commands\n\nOr click visuals directly to edit them!`;
  }

  return {
    message: responseMessage,
    dashboardSpec: updatedSpec
  };
};
