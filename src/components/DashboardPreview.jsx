import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import { getColorPalette } from '../utils/colorPalettes';

const DashboardPreview = ({ dashboardSpec, csvData }) => {
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

  const renderVisual = (visual, idx) => {
    const { type, title, dataKey, nameKey, xAxis, yAxis } = visual;

    if (type === 'card') {
      const Icon = visual.metric.toLowerCase().includes('revenue') ? DollarSign : TrendingUp;
      return (
        <div key={idx} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium opacity-90">{title}</h3>
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">{visual.value?.toLocaleString() || '0'}</p>
        </div>
      );
    }

    const chartData = csvData?.data?.slice(0, 10) || [];

    if (type === 'line') {
      return (
        <div key={idx} className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-3">{title}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'bar') {
      return (
        <div key={idx} className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-3">{title}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill={colors[1]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'pie') {
      return (
        <div key={idx} className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-3">{title}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData.slice(0, 5)} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={60}>
                {chartData.slice(0, 5).map((entry, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'table') {
      return (
        <div key={idx} className="bg-white p-4 rounded-xl shadow col-span-full">
          <h3 className="font-semibold mb-3">{title}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {visual.columns?.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
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

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">{dashboardSpec.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboardSpec.visuals?.map((visual, idx) => renderVisual(visual, idx))}
      </div>
    </div>
  );
};

export default DashboardPreview;