// Mock Claude API for demo - in production, this would call Anthropic API
export const analyzeData = async (csvData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { headers, data, rowCount, columnCount } = csvData;
  
  // Generate intelligent dashboard spec based on data
  const numericColumns = headers.filter(header => {
    const sample = data.slice(0, 10).map(row => row[header]);
    return sample.some(val => !isNaN(parseFloat(val)));
  });
  
  const dateColumns = headers.filter(header => {
    const sample = data.slice(0, 10).map(row => row[header]);
    return sample.some(val => !isNaN(Date.parse(val)) && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(val));
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
    dashboardSpec.visuals.push({
      type: 'line',
      title: `${numericColumns[0]} Over Time`,
      xAxis: dateColumns[0],
      yAxis: numericColumns[0],
      dataKey: numericColumns[0]
    });
  }
  
  // Add bar chart for categories
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    dashboardSpec.visuals.push({
      type: 'bar',
      title: `${numericColumns[0]} by ${categoryColumns[0]}`,
      xAxis: categoryColumns[0],
      yAxis: numericColumns[0],
      dataKey: numericColumns[0]
    });
  }
  
  // Add pie chart for distribution
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    dashboardSpec.visuals.push({
      type: 'pie',
      title: `Distribution by ${categoryColumns[0]}`,
      dataKey: numericColumns[0],
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

  // Color palette changes
  if (msg.includes('vibrant') || msg.includes('colorful')) {
    updatedSpec.colorPalette = 'vibrant';
    responseMessage = "Changed to vibrant color palette with bright, energetic colors!";
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
    }
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
