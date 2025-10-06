import { useState, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, Users, Edit2, Settings, Activity, BarChart3, PieChart as PieIcon, Palette } from 'lucide-react';
import { getColorPalette } from '../utils/colorPalettes';

const DashboardPreview = ({
  dashboardSpec,
  csvData,
  onUpdateSpec,
  dimensions,
  onDimensionsChange,
  customColors,
  onCustomColorsChange,
  chartSizes,
  onChartSizesChange
}) => {
  const [selectedVisual, setSelectedVisual] = useState(null);
  const [showDimensionSettings, setShowDimensionSettings] = useState(false);
  const [resizing, setResizing] = useState(null);
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!dashboardSpec) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Dashboard Preview</h2>
        <div className="text-center py-12 text-gray-500">
          <p>Upload a file to see your dashboard preview</p>
        </div>
      </div>
    );
  }

  const colors = getColorPalette(dashboardSpec.colorPalette || 'corporate').colors;

  const changeChartType = (visualIndex, newType) => {
    const updated = { ...dashboardSpec };
    updated.visuals[visualIndex].type = newType;
    onUpdateSpec(updated);
    setSelectedVisual(null);
  };

  const handleResizeStart = (e, idx) => {
    e.stopPropagation();
    const currentSize = chartSizes[idx] || { width: 300, height: 300 };
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentSize.width || 300,
      startHeight: currentSize.height || 300
    };
    setResizing(idx);
  };

  const handleResizeMove = (e) => {
    if (resizing === null) return;

    const deltaX = e.clientX - resizeRef.current.startX;
    const deltaY = e.clientY - resizeRef.current.startY;

    const newWidth = Math.max(200, Math.min(800, resizeRef.current.startWidth + deltaX));
    const newHeight = Math.max(150, Math.min(600, resizeRef.current.startHeight + deltaY));

    onChartSizesChange(prev => ({
      ...prev,
      [resizing]: { width: newWidth, height: newHeight }
    }));
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  // All Power BI visual types
  const chartTypes = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'column', label: 'Column Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'donut', label: 'Donut Chart' },
    { value: 'card', label: 'Card (KPI)' },
    { value: 'table', label: 'Table' },
    { value: 'matrix', label: 'Matrix' },
    { value: 'scatter', label: 'Scatter Chart' },
    { value: 'waterfall', label: 'Waterfall' },
    { value: 'funnel', label: 'Funnel' },
    { value: 'gauge', label: 'Gauge' },
    { value: 'treemap', label: 'Treemap' },
    { value: 'ribbon', label: 'Ribbon Chart' },
    { value: 'stacked-bar', label: 'Stacked Bar' },
    { value: 'stacked-column', label: 'Stacked Column' },
    { value: 'clustered-bar', label: 'Clustered Bar' },
    { value: 'combo', label: 'Combo Chart' }
  ];

  const renderVisual = (visual, idx) => {
    const { type, title, dataKey, nameKey, xAxis, yAxis, topN } = visual;
    const isSelected = selectedVisual === idx;
    const customSize = chartSizes[idx] || {};
    const width = customSize.width || null; // null means use default (100%)
    const height = customSize.height || 300;

    // Get data and apply topN filter if needed
    let chartData = csvData?.data?.slice(0, topN || 20) || [];

    if (type === 'card') {
      const Icon = visual.metric?.toLowerCase().includes('revenue') || visual.metric?.toLowerCase().includes('amount') 
        ? DollarSign 
        : visual.metric?.toLowerCase().includes('user') || visual.metric?.toLowerCase().includes('customer')
        ? Users
        : TrendingUp;
      
      let displayValue = 0;
      if (csvData?.data && dataKey) {
        const values = csvData.data.map(row => parseFloat(row[dataKey])).filter(v => !isNaN(v));
        displayValue = values.reduce((a, b) => a + b, 0);
      }
      
      return (
        <div
          key={idx}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-xl text-white relative group cursor-pointer hover:shadow-xl transition"
          onClick={() => setSelectedVisual(isSelected ? null : idx)}
          style={width ? { width: `${width}px`, height: `${height}px` } : {}}
        >
          {isSelected && (
            <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-10">
              <select
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => changeChartType(idx, e.target.value)}
                className="text-gray-800 text-sm px-2 py-1 rounded"
                value={type}
              >
                {chartTypes.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium opacity-90">{title}</h3>
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">
            {title.toLowerCase().includes('count')
              ? displayValue.toFixed(0)
              : "$" + displayValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
            }
          </p>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <Edit2 className="w-4 h-4" />
          </div>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition z-20"
            onMouseDown={(e) => handleResizeStart(e, idx)}
            title="Drag to resize"
          >
            <svg className="w-full h-full text-white opacity-50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z"/>
            </svg>
          </div>
        </div>
      );
    }

    const ChartWrapper = ({ children }) => (
      <div
        key={idx}
        className="p-4 rounded-xl shadow relative group cursor-pointer hover:shadow-xl transition"
        onClick={() => setSelectedVisual(isSelected ? null : idx)}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          backgroundColor: customColors.cardBackground,
          color: customColors.primaryText
        }}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-10 flex gap-2">
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => changeChartType(idx, e.target.value)}
              className="text-gray-800 text-sm px-2 py-1 rounded border"
              value={type}
            >
              {chartTypes.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <div className="opacity-0 group-hover:opacity-100 transition">
            <Edit2 className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        {children}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition z-20"
          onMouseDown={(e) => handleResizeStart(e, idx)}
          title="Drag to resize"
        >
          <svg className="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z"/>
          </svg>
        </div>
      </div>
    );

    // Line Chart
    if (type === 'line') {
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Area Chart
    if (type === 'area') {
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Bar Chart (Horizontal)
    if (type === 'bar') {
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey={xAxis} type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill={colors[1]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Column Chart (Vertical Bar)
    if (type === 'column' || type === 'clustered-bar') {
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill={colors[2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Stacked Column
    if (type === 'stacked-column' || type === 'stacked-bar') {
      const numericCols = csvData?.headers?.filter(h => {
        const sample = csvData.data.slice(0, 5).map(row => row[h]);
        return sample.some(val => !isNaN(parseFloat(val)));
      }) || [];
      
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {numericCols.slice(0, 3).map((col, i) => (
                <Bar key={col} dataKey={col} stackId="a" fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Pie & Donut Charts
    if (type === 'pie' || type === 'donut') {
      const aggregated = {};
      chartData.forEach(row => {
        const key = row[nameKey];
        const value = parseFloat(row[dataKey]) || 0;
        aggregated[key] = (aggregated[key] || 0) + value;
      });
      const pieData = Object.entries(aggregated)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, topN || 8);

      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie 
                data={pieData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={type === 'donut' ? height * 0.3 : height * 0.35}
                innerRadius={type === 'donut' ? height * 0.2 : 0}
                label
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Scatter Chart
    if (type === 'scatter') {
      const numericCols = csvData?.headers?.filter(h => {
        const sample = csvData.data.slice(0, 5).map(row => row[h]);
        return sample.some(val => !isNaN(parseFloat(val)));
      }) || [];
      
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={numericCols[0] || dataKey} name={numericCols[0]} />
              <YAxis dataKey={numericCols[1] || dataKey} name={numericCols[1]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Data Points" data={chartData} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Combo Chart (Line + Bar)
    if (type === 'combo') {
      const numericCols = csvData?.headers?.filter(h => {
        const sample = csvData.data.slice(0, 5).map(row => row[h]);
        return sample.some(val => !isNaN(parseFloat(val)));
      }) || [];
      
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={numericCols[0] || dataKey} fill={colors[1]} />
              <Line type="monotone" dataKey={numericCols[1] || dataKey} stroke={colors[0]} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Gauge/KPI Indicator
    if (type === 'gauge') {
      let displayValue = 0;
      let maxValue = 100;
      if (csvData?.data && dataKey) {
        const values = csvData.data.map(row => parseFloat(row[dataKey])).filter(v => !isNaN(v));
        displayValue = values.reduce((a, b) => a + b, 0) / values.length;
        maxValue = Math.max(...values);
      }
      const percentage = (displayValue / maxValue) * 100;

      return (
        <div
          key={idx}
          className="p-6 rounded-xl shadow relative group cursor-pointer hover:shadow-xl transition"
          onClick={() => setSelectedVisual(isSelected ? null : idx)}
          style={{
            ...(width ? { width: `${width}px`, height: `${height}px` } : {}),
            backgroundColor: customColors.cardBackground,
            color: customColors.primaryText
          }}
        >
          {isSelected && (
            <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-10">
              <select onClick={(e) => e.stopPropagation()} onChange={(e) => changeChartType(idx, e.target.value)}
                className="text-gray-800 text-sm px-2 py-1 rounded border" value={type}>
                {chartTypes.map(ct => (<option key={ct.value} value={ct.value}>{ct.label}</option>))}
              </select>
            </div>
          )}
          <h3 className="font-semibold mb-4 text-center">{title}</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke={colors[0]} strokeWidth="20"
                  strokeDasharray={`${percentage * 5.03} 503`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">{displayValue.toFixed(1)}</span>
                <span className="text-sm text-gray-500">{percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition z-20"
            onMouseDown={(e) => handleResizeStart(e, idx)}
            title="Drag to resize"
          >
            <svg className="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z"/>
            </svg>
          </div>
        </div>
      );
    }

    // Table
    if (type === 'table' || type === 'matrix') {
      const columns = visual.columns || csvData?.headers?.slice(0, 5) || [];
      return (
        <div
          key={idx}
          className="p-4 rounded-xl shadow col-span-full relative group cursor-pointer hover:shadow-xl transition"
          onClick={() => setSelectedVisual(isSelected ? null : idx)}
          style={{
            ...(width ? { width: `${width}px` } : {}),
            backgroundColor: customColors.cardBackground,
            color: customColors.primaryText
          }}
        >
          {isSelected && (
            <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-10">
              <select onClick={(e) => e.stopPropagation()} onChange={(e) => changeChartType(idx, e.target.value)}
                className="text-gray-800 text-sm px-2 py-1 rounded border" value={type}>
                {chartTypes.map(ct => (<option key={ct.value} value={ct.value}>{ct.label}</option>))}
              </select>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{title}</h3>
            <div className="opacity-0 group-hover:opacity-100 transition"><Edit2 className="w-4 h-4 text-gray-400" /></div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>{columns.map((col, i) => (<th key={i} className="px-3 py-2 text-left font-semibold">{col}</th>))}</tr>
              </thead>
              <tbody>
                {chartData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {columns.map((col, j) => (<td key={j} className="px-3 py-2">{row[col]}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition z-20"
            onMouseDown={(e) => handleResizeStart(e, idx)}
            title="Drag to resize"
          >
            <svg className="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z"/>
            </svg>
          </div>
        </div>
      );
    }

    // Waterfall Chart (approximation)
    if (type === 'waterfall') {
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill={colors[3]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Funnel Chart (approximation with bar)
    if (type === 'funnel') {
      const sortedData = [...chartData].sort((a, b) => parseFloat(b[dataKey]) - parseFloat(a[dataKey]));
      return (
        <ChartWrapper key={idx}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={sortedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey={xAxis} type="category" width={100} />
              <Tooltip />
              <Bar dataKey={dataKey} fill={colors[4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      );
    }

    // Default: show as column chart
    return (
      <ChartWrapper key={idx}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[1]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  const presetDimensions = [
    { name: 'Standard (16:9)', width: 1280, height: 720 },
    { name: 'Wide (16:9)', width: 1920, height: 1080 },
    { name: 'Portrait', width: 720, height: 1280 },
    { name: 'Square', width: 1080, height: 1080 },
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 }
  ];

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200"
      onMouseMove={handleResizeMove}
      onMouseUp={handleResizeEnd}
      onMouseLeave={handleResizeEnd}
    >
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{dashboardSpec.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-500">{dimensions.width} × {dimensions.height}px</p>
              <button onClick={() => setShowDimensionSettings(!showDimensionSettings)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Settings className="w-3 h-3" />Change Size
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 transition"
            >
              <Palette className="w-3 h-3" />
              Colors
            </button>
            <div className="flex gap-1">
              {colors.map((color, idx) => (
                <div key={idx} className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: color }} title={color}></div>
              ))}
            </div>
            <span className="text-xs text-gray-400">Click visuals to edit</span>
          </div>
        </div>

        {showDimensionSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Dashboard Dimensions</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {presetDimensions.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => onDimensionsChange({ width: preset.width, height: preset.height })}
                  className={`px-3 py-2 text-xs rounded border transition ${
                    dimensions.width === preset.width && dimensions.height === preset.height
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-gray-300 hover:border-blue-500'
                  }`}>
                  {preset.name}
                  <div className="text-xs opacity-75">{preset.width}×{preset.height}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Width (px)</label>
                <input type="number" value={dimensions.width}
                  onChange={(e) => onDimensionsChange({ ...dimensions, width: parseInt(e.target.value) || 1280 })}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="320" max="3840" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Height (px)</label>
                <input type="number" value={dimensions.height}
                  onChange={(e) => onDimensionsChange({ ...dimensions, height: parseInt(e.target.value) || 720 })}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="320" max="3840" />
              </div>
            </div>
          </div>
        )}

        {showColorPicker && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Custom Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2">Dashboard Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.background}
                    onChange={(e) => onCustomColorsChange({ ...customColors, background: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColors.background}
                    onChange={(e) => onCustomColorsChange({ ...customColors, background: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#f3f4f6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Card Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.cardBackground}
                    onChange={(e) => onCustomColorsChange({ ...customColors, cardBackground: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColors.cardBackground}
                    onChange={(e) => onCustomColorsChange({ ...customColors, cardBackground: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Primary Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.primaryText}
                    onChange={(e) => onCustomColorsChange({ ...customColors, primaryText: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColors.primaryText}
                    onChange={(e) => onCustomColorsChange({ ...customColors, primaryText: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Secondary Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.secondaryText}
                    onChange={(e) => onCustomColorsChange({ ...customColors, secondaryText: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColors.secondaryText}
                    onChange={(e) => onCustomColorsChange({ ...customColors, secondaryText: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#6b7280"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onCustomColorsChange({
                  background: '#f3f4f6',
                  cardBackground: '#ffffff',
                  primaryText: '#1f2937',
                  secondaryText: '#6b7280'
                })}
                className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded transition"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="p-6" style={{ backgroundColor: customColors.background }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardSpec.visuals?.map((visual, idx) => renderVisual(visual, idx))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;