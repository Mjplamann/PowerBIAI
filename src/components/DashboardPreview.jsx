import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Users, Edit2, Maximize2, Settings } from 'lucide-react';
import { getColorPalette } from '../utils/colorPalettes';

const DashboardPreview = ({ dashboardSpec, csvData, onUpdateSpec, dimensions, onDimensionsChange }) => {
  const [selectedVisual, setSelectedVisual] = useState(null);
  const [chartSizes, setChartSizes] = useState({});
  const [showDimensionSettings, setShowDimensionSettings] = useState(false);

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

  const chartTypes = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'card', label: 'KPI Card' },
    { value: 'table', label: 'Table' }
  ];

  const renderVisual = (visual, idx) => {
    const { type, title, dataKey, nameKey, xAxis, yAxis } = visual;
    const isSelected = selectedVisual === idx;
    const height = chartSizes[idx] || 300;

    if (type === 'card') {
      const Icon = visual.metric?.toLowerCase().includes('revenue') || visual.metric?.toLowerCase().includes('amount') 
        ? DollarSign 
        : TrendingUp;
      
      // Calculate actual value from data
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
              : '$' + displayValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
            }
          </p>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <Edit2 className="w-4 h-4" />
          </div>
        </div>
      );
    }

    const chartData = csvData?.data?.slice(0, 20) || [];

    const ChartWrapper = ({ children }) => (
      <div 
        key={idx} 
        className="bg-white p-4 rounded-xl shadow relative group cursor-pointer hover:shadow-xl transition"
        onClick={() => setSelectedVisual(isSelected ? null : idx)}
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
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setChartSizes({...chartSizes, [idx]: parseInt(e.target.value)})}
              className="text-gray-800 text-sm px-2 py-1 rounded border"
              value={height}
            >
              <option value="200">Small (200px)</option>
              <option value="300">Medium (300px)</option>
              <option value="400">Large (400px)</option>
              <option value="500">X-Large (500px)</option>
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
      </div>
    );

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

    if (type === 'bar') {
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
    }

    if (type === 'pie') {
      // Aggregate data for pie chart
      const aggregated = {};
      chartData.forEach(row => {
        const key = row[nameKey];
        const value = parseFloat(row[dataKey]) || 0;
        aggregated[key] = (aggregated[key] || 0) + value;
      });
      const pieData = Object.entries(aggregated).map(([name, value]) => ({
        name,
        value
      })).slice(0, 8);

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
                outerRadius={Math.min(height * 0.35, 120)}
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

    if (type === 'table') {
      return (
        <div 
          key={idx} 
          className="bg-white p-4 rounded-xl shadow col-span-full relative group cursor-pointer hover:shadow-xl transition"
          onClick={() => setSelectedVisual(isSelected ? null : idx)}
        >
          {isSelected && (
            <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-10">
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
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {visual.columns?.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {visual.columns?.map((col, j) => (
                      <td key={j} className="px-3 py-2">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{dashboardSpec.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-500">
                {dimensions.width} × {dimensions.height}px
              </p>
              <button
                onClick={() => setShowDimensionSettings(!showDimensionSettings)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Change Size
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {colors.map((color, idx) => (
                <div key={idx} className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: color }} title={color}></div>
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
                  }`}
                >
                  {preset.name}
                  <div className="text-xs opacity-75">{preset.width}×{preset.height}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Width (px)</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => onDimensionsChange({ ...dimensions, width: parseInt(e.target.value) || 1280 })}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="320"
                  max="3840"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Height (px)</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => onDimensionsChange({ ...dimensions, height: parseInt(e.target.value) || 720 })}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="320"
                  max="3840"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Power BI standard is 1280×720px (16:9). Adjust to match your needs.
            </p>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardSpec.visuals?.map((visual, idx) => renderVisual(visual, idx))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;