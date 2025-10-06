// Mock Claude API for demo - in production, this would call Anthropic API
export const analyzeData = async (csvData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
    message: `I've analyzed your dataset with ${rowCount} rows and ${columnCount} columns. Here's a recommended dashboard design featuring KPI cards, trend analysis, categorical breakdowns, and detailed tables. The dashboard uses a professional color palette and is optimized for Power BI.`,
    dashboardSpec
  };
};

export const refineDesign = async (currentSpec, userMessage, conversationHistory) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

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
  } else if (msg.includes('ocean') || msg.includes('blue')) {
    updatedSpec.colorPalette = 'ocean';
    responseMessage = "Applied ocean blue color scheme for a calm, professional appearance.";
  } else if (msg.includes('forest') || msg.includes('green')) {
    updatedSpec.colorPalette = 'forest';
    responseMessage = "Changed to forest green palette with natural tones.";
  } else if (msg.includes('corporate') || msg.includes('professional')) {
    updatedSpec.colorPalette = 'corporate';
    responseMessage = "Switched to corporate color scheme for a professional look.";
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
  }

  if (msg.includes('add') && msg.includes('gauge')) {
    updatedSpec.visuals.push({
      type: 'gauge',
      title: 'Performance Gauge',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a gauge visual to track performance metrics.";
  }

  if (msg.includes('add') && msg.includes('funnel')) {
    updatedSpec.visuals.push({
      type: 'funnel',
      title: 'Conversion Funnel',
      xAxis: currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Stage',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a funnel chart to visualize conversion stages.";
  }

  if (msg.includes('add') && msg.includes('waterfall')) {
    updatedSpec.visuals.push({
      type: 'waterfall',
      title: 'Waterfall Analysis',
      xAxis: currentSpec.visuals.find(v => v.xAxis)?.xAxis || 'Category',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a waterfall chart to show incremental changes.";
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
  }

  if (msg.includes('add') && (msg.includes('bar') || msg.includes('column'))) {
    updatedSpec.visuals.push({
      type: 'bar',
      title: 'Comparison Chart',
      xAxis: currentSpec.visuals.find(v => v.nameKey)?.nameKey || 'Category',
      yAxis: currentSpec.visuals[0]?.dataKey || 'Amount',
      dataKey: currentSpec.visuals[0]?.dataKey || 'Amount'
    });
    responseMessage = "Added a bar chart for categorical comparisons.";
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
  }

  if (msg.includes('add') && msg.includes('table')) {
    updatedSpec.visuals.push({
      type: 'table',
      title: 'Data Table',
      columns: currentSpec.visuals[0]?.columns || ['Column1', 'Column2', 'Column3']
    });
    responseMessage = "Added a data table for detailed record viewing.";
  }

  // Remove visuals
  if (msg.includes('remove') && msg.includes('all')) {
    updatedSpec.visuals = [];
    responseMessage = "Removed all visuals from the dashboard.";
  } else if (msg.includes('remove') && msg.includes('last')) {
    if (updatedSpec.visuals.length > 0) {
      updatedSpec.visuals = updatedSpec.visuals.slice(0, -1);
      responseMessage = "Removed the last visual from the dashboard.";
    }
  } else if (msg.includes('remove') && msg.includes('first')) {
    if (updatedSpec.visuals.length > 0) {
      updatedSpec.visuals = updatedSpec.visuals.slice(1);
      responseMessage = "Removed the first visual from the dashboard.";
    }
  } else if (msg.includes('remove') && msg.includes('pie')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'pie').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'pie');
    responseMessage = `Removed ${count} pie chart${count !== 1 ? 's' : ''} from the dashboard.`;
  } else if (msg.includes('remove') && msg.includes('bar')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'bar').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'bar');
    responseMessage = `Removed ${count} bar chart${count !== 1 ? 's' : ''} from the dashboard.`;
  } else if (msg.includes('remove') && msg.includes('card')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'card').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'card');
    responseMessage = `Removed ${count} KPI card${count !== 1 ? 's' : ''} from the dashboard.`;
  } else if (msg.includes('remove') && msg.includes('table')) {
    const count = updatedSpec.visuals.filter(v => v.type === 'table').length;
    updatedSpec.visuals = updatedSpec.visuals.filter(v => v.type !== 'table');
    responseMessage = `Removed ${count} table${count !== 1 ? 's' : ''} from the dashboard.`;
  }

  // Filtering options
  if (msg.includes('top 5')) {
    updatedSpec.visuals.forEach(v => {
      if (v.type === 'bar' || v.type === 'pie' || v.type === 'column') {
        v.topN = 5;
      }
    });
    responseMessage = "Updated charts to show only top 5 items.";
  } else if (msg.includes('top 10') || msg.includes('top ten')) {
    updatedSpec.visuals.forEach(v => {
      if (v.type === 'bar' || v.type === 'pie' || v.type === 'column') {
        v.topN = 10;
      }
    });
    responseMessage = "Updated charts to show only top 10 items.";
  } else if (msg.includes('top 20')) {
    updatedSpec.visuals.forEach(v => {
      if (v.type === 'bar' || v.type === 'pie' || v.type === 'column') {
        v.topN = 20;
      }
    });
    responseMessage = "Updated charts to show top 20 items.";
  } else if (msg.includes('show all')) {
    updatedSpec.visuals.forEach(v => {
      delete v.topN;
    });
    responseMessage = "Updated charts to show all available data.";
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

  // Track if any visual changes were made
  if (msg.includes('add') || msg.includes('remove')) {
    madeChanges = true;
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

export const generateDAX = async (measureDescription, dataStructure) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate basic DAX measure
  return {
    name: "Total Sales",
    formula: "Total Sales = SUM('Sales'[Amount])",
    description: "Calculates the total sales amount"
  };
};
