/**
 * Generate DAX measures that exactly match dashboard visualizations
 */

export const generateVisualizationMatchedDAX = (dashboardSpec, csvData, columnTypes) => {
  const measures = [];
  const { visuals } = dashboardSpec;
  const { headers, data } = csvData;

  // Track which measures we've already created
  const createdMeasures = new Set();

  visuals.forEach((visual, idx) => {
    switch (visual.type) {
      case 'card':
        // KPI Cards
        if (visual.dataKey && !createdMeasures.has(`Total ${visual.dataKey}`)) {
          measures.push({
            name: `Total ${visual.dataKey}`,
            formula: `Total ${visual.dataKey} = SUM('Data'[${visual.dataKey}])`,
            description: `Total sum of ${visual.dataKey} - Used in KPI card "${visual.title}"`,
            visualType: 'Card',
            visualTitle: visual.title,
            usage: `Use this measure in a Card visual with title "${visual.title}"`
          });
          createdMeasures.add(`Total ${visual.dataKey}`);
        }
        break;

      case 'line':
      case 'area':
        // Line/Area charts - need time-based measures
        if (visual.dataKey && !createdMeasures.has(`Total ${visual.dataKey}`)) {
          measures.push({
            name: `Total ${visual.dataKey}`,
            formula: `Total ${visual.dataKey} = SUM('Data'[${visual.dataKey}])`,
            description: `Sum of ${visual.dataKey} over time - Used in line chart "${visual.title}"`,
            visualType: visual.type === 'line' ? 'Line Chart' : 'Area Chart',
            visualTitle: visual.title,
            usage: `Drag "${visual.xAxis}" to Axis, drag this measure to Values`
          });
          createdMeasures.add(`Total ${visual.dataKey}`);
        }
        break;

      case 'bar':
      case 'column':
      case 'clustered-bar':
        // Bar/Column charts - categorical aggregation
        if (visual.dataKey && !createdMeasures.has(`${visual.dataKey} by ${visual.xAxis}`)) {
          measures.push({
            name: `${visual.dataKey} by ${visual.xAxis}`,
            formula: `${visual.dataKey} by ${visual.xAxis} = CALCULATE(SUM('Data'[${visual.dataKey}]))`,
            description: `${visual.dataKey} aggregated by ${visual.xAxis} - Used in bar chart "${visual.title}"`,
            visualType: visual.type === 'bar' ? 'Bar Chart' : 'Column Chart',
            visualTitle: visual.title,
            usage: `Drag "${visual.xAxis}" to Axis, drag this measure to Values`
          });
          createdMeasures.add(`${visual.dataKey} by ${visual.xAxis}`);

          // Also add base total
          if (!createdMeasures.has(`Total ${visual.dataKey}`)) {
            measures.push({
              name: `Total ${visual.dataKey}`,
              formula: `Total ${visual.dataKey} = SUM('Data'[${visual.dataKey}])`,
              description: `Total ${visual.dataKey}`,
              visualType: 'Base Measure',
              visualTitle: 'Supporting measure',
              usage: 'Supporting measure for calculations'
            });
            createdMeasures.add(`Total ${visual.dataKey}`);
          }
        }
        break;

      case 'pie':
      case 'donut':
        // Pie/Donut charts - distribution
        if (visual.dataKey && visual.nameKey && !createdMeasures.has(`${visual.dataKey} Distribution`)) {
          measures.push({
            name: `${visual.dataKey} Distribution`,
            formula: `${visual.dataKey} Distribution = CALCULATE(SUM('Data'[${visual.dataKey}]))`,
            description: `${visual.dataKey} distribution by ${visual.nameKey} - Used in pie chart "${visual.title}"`,
            visualType: visual.type === 'pie' ? 'Pie Chart' : 'Donut Chart',
            visualTitle: visual.title,
            usage: `Drag "${visual.nameKey}" to Legend, drag this measure to Values`
          });
          createdMeasures.add(`${visual.dataKey} Distribution`);
        }
        break;

      case 'scatter':
        // Scatter plots
        if (visual.xAxis && visual.yAxis) {
          if (!createdMeasures.has(`Avg ${visual.xAxis}`)) {
            measures.push({
              name: `Avg ${visual.xAxis}`,
              formula: `Avg ${visual.xAxis} = AVERAGE('Data'[${visual.xAxis}])`,
              description: `Average ${visual.xAxis} for scatter plot`,
              visualType: 'Scatter Chart',
              visualTitle: visual.title,
              usage: `Drag to X-Axis`
            });
            createdMeasures.add(`Avg ${visual.xAxis}`);
          }

          if (!createdMeasures.has(`Avg ${visual.yAxis}`)) {
            measures.push({
              name: `Avg ${visual.yAxis}`,
              formula: `Avg ${visual.yAxis} = AVERAGE('Data'[${visual.yAxis}])`,
              description: `Average ${visual.yAxis} for scatter plot`,
              visualType: 'Scatter Chart',
              visualTitle: visual.title,
              usage: `Drag to Y-Axis`
            });
            createdMeasures.add(`Avg ${visual.yAxis}`);
          }
        }
        break;

      case 'gauge':
        // Gauge
        if (visual.dataKey && !createdMeasures.has(`Avg ${visual.dataKey}`)) {
          measures.push({
            name: `Avg ${visual.dataKey}`,
            formula: `Avg ${visual.dataKey} = AVERAGE('Data'[${visual.dataKey}])`,
            description: `Average ${visual.dataKey} - Used in gauge "${visual.title}"`,
            visualType: 'Gauge',
            visualTitle: visual.title,
            usage: `Drag this measure to Value field in gauge`
          });
          createdMeasures.add(`Avg ${visual.dataKey}`);
        }
        break;
    }
  });

  // Add useful calculated measures
  const numericColumns = headers.filter(h => columnTypes[h] === 'number');

  numericColumns.forEach(col => {
    // Count measure
    if (!createdMeasures.has(`Count of ${col}`)) {
      measures.push({
        name: `Count of ${col}`,
        formula: `Count of ${col} = COUNTROWS(FILTER('Data', NOT(ISBLANK('Data'[${col}]))))`,
        description: `Count of non-blank ${col} values`,
        visualType: 'Utility',
        visualTitle: 'Supporting measure',
        usage: 'Use for counting records'
      });
      createdMeasures.add(`Count of ${col}`);
    }
  });

  // Add total row count
  measures.push({
    name: 'Total Rows',
    formula: 'Total Rows = COUNTROWS(\'Data\')',
    description: 'Total number of rows in dataset',
    visualType: 'Utility',
    visualTitle: 'Supporting measure',
    usage: 'Shows total record count'
  });

  return measures;
};

export const formatDAXForExport = (measures) => {
  let daxContent = `// ============================================================\n`;
  daxContent += `// Power BI DAX Measures\n`;
  daxContent += `// Generated to match your dashboard visualizations exactly\n`;
  daxContent += `// ============================================================\n\n`;

  // Group by visual type
  const grouped = {};
  measures.forEach(measure => {
    const type = measure.visualType || 'Other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(measure);
  });

  Object.entries(grouped).forEach(([type, measureList]) => {
    daxContent += `\n// ===== ${type} Measures =====\n\n`;

    measureList.forEach(measure => {
      daxContent += `// ${measure.description}\n`;
      daxContent += `// Visual: "${measure.visualTitle}"\n`;
      daxContent += `// Usage: ${measure.usage}\n`;
      daxContent += `${measure.formula}\n\n`;
    });
  });

  daxContent += `\n// ============================================================\n`;
  daxContent += `// Copy and paste these measures into Power BI Desktop\n`;
  daxContent += `// Go to: Modeling > New Measure > Paste formula\n`;
  daxContent += `// ============================================================\n`;

  return daxContent;
};

export const generateVisualSetupInstructions = (dashboardSpec, columnTypes) => {
  const { visuals } = dashboardSpec;

  let instructions = `# Power BI Visual Setup Guide\n\n`;
  instructions += `## Exact Recreation Instructions\n\n`;
  instructions += `Follow these steps to recreate your dashboard EXACTLY as shown in the preview.\n\n`;

  visuals.forEach((visual, idx) => {
    const num = idx + 1;
    instructions += `\n### Visual ${num}: ${visual.title}\n\n`;
    instructions += `**Type:** ${getVisualTypeName(visual.type)}\n\n`;

    switch (visual.type) {
      case 'card':
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "Card" visual to your canvas\n`;
        instructions += `2. Drag the measure **"Total ${visual.dataKey}"** to the **Fields** well\n`;
        instructions += `3. Rename the card title to: "${visual.title}"\n`;
        instructions += `4. Format:\n`;
        instructions += `   - Display units: Auto\n`;
        instructions += `   - Decimal places: ${visual.format === 'currency' ? 2 : 0}\n\n`;
        break;

      case 'line':
      case 'area':
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "${getVisualTypeName(visual.type)}" visual\n`;
        instructions += `2. Drag **"${visual.xAxis}"** column to **X-Axis**\n`;
        instructions += `3. Drag measure **"Total ${visual.dataKey}"** to **Y-Axis**\n`;
        instructions += `4. Title: "${visual.title}"\n`;
        instructions += `5. Format X-Axis:\n`;
        instructions += `   - Type: ${columnTypes[visual.xAxis] === 'date' ? 'Continuous (Date)' : 'Categorical'}\n`;
        instructions += `   - Show title: Off\n\n`;
        break;

      case 'bar':
      case 'column':
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "${getVisualTypeName(visual.type)}" visual\n`;
        instructions += `2. Drag **"${visual.xAxis}"** column to **Axis**\n`;
        instructions += `3. Drag measure **"${visual.dataKey} by ${visual.xAxis}"** to **Values**\n`;
        instructions += `4. Title: "${visual.title}"\n`;
        instructions += `5. Sort: Descending by values\n`;
        instructions += `6. Data labels: On\n`;
        if (visual.topN) {
          instructions += `7. Filter: Top ${visual.topN} by sum of ${visual.dataKey}\n`;
        }
        instructions += `\n`;
        break;

      case 'pie':
      case 'donut':
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "${getVisualTypeName(visual.type)}" visual\n`;
        instructions += `2. Drag **"${visual.nameKey}"** column to **Legend**\n`;
        instructions += `3. Drag measure **"${visual.dataKey} Distribution"** to **Values**\n`;
        instructions += `4. Title: "${visual.title}"\n`;
        instructions += `5. Show data labels: Category and percentage\n`;
        if (visual.topN) {
          instructions += `6. Filter: Top ${visual.topN} by sum\n`;
        }
        instructions += `\n`;
        break;

      case 'table':
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "Table" visual\n`;
        instructions += `2. Drag these columns to **Values**:\n`;
        visual.columns?.forEach(col => {
          instructions += `   - ${col}\n`;
        });
        instructions += `3. Title: "${visual.title}"\n`;
        instructions += `4. Enable: Conditional formatting (optional)\n\n`;
        break;

      case 'gauge':
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "Gauge" visual\n`;
        instructions += `2. Drag measure **"Avg ${visual.dataKey}"** to **Value**\n`;
        instructions += `3. Set Maximum value manually or use a measure\n`;
        instructions += `4. Title: "${visual.title}"\n\n`;
        break;

      default:
        instructions += `**Setup Steps:**\n`;
        instructions += `1. Add a "${getVisualTypeName(visual.type)}" visual\n`;
        instructions += `2. Configure fields as needed\n`;
        instructions += `3. Title: "${visual.title}"\n\n`;
    }
  });

  instructions += `\n## Color Theme\n\n`;
  instructions += `Apply the included \`custom_theme.json\` file:\n`;
  instructions += `1. Go to View > Themes > Browse for themes\n`;
  instructions += `2. Select the \`custom_theme.json\` file\n`;
  instructions += `3. Your dashboard will match the preview colors!\n`;

  return instructions;
};

const getVisualTypeName = (type) => {
  const names = {
    'card': 'Card (KPI)',
    'line': 'Line Chart',
    'bar': 'Bar Chart',
    'column': 'Column Chart',
    'area': 'Area Chart',
    'pie': 'Pie Chart',
    'donut': 'Donut Chart',
    'scatter': 'Scatter Chart',
    'table': 'Table',
    'matrix': 'Matrix',
    'gauge': 'Gauge',
    'waterfall': 'Waterfall Chart',
    'funnel': 'Funnel Chart',
    'treemap': 'Treemap',
    'ribbon': 'Ribbon Chart',
    'combo': 'Combo Chart'
  };
  return names[type] || type;
};
