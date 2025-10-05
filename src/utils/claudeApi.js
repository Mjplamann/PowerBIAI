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
    const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
    const total = values.reduce((a, b) => a + b, 0);
    dashboardSpec.visuals.push({
      type: 'card',
      title: `Total ${col}`,
      metric: col,
      value: total,
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
  
  // Simple refinement logic - in production, this would use Claude
  const updatedSpec = { ...currentSpec };
  
  if (userMessage.toLowerCase().includes('color')) {
    updatedSpec.colorPalette = 'vibrant';
  }
  
  if (userMessage.toLowerCase().includes('remove')) {
    updatedSpec.visuals = updatedSpec.visuals.slice(0, -1);
  }
  
  return {
    message: "I've updated the dashboard based on your feedback. Check out the preview on the right!",
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
