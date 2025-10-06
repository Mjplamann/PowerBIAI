const QuickActions = ({ onAction }) => {
  const actions = [
    { label: 'Add KPI Card', action: 'Add a KPI card' },
    { label: 'Add Line Chart', action: 'Add a line chart' },
    { label: 'Add Bar Chart', action: 'Add a bar chart' },
    { label: 'Add Pie Chart', action: 'Add a pie chart' },
    { label: 'Add Gauge', action: 'Add a gauge' },
    { label: 'Add Table', action: 'Add a table' },
    { label: 'Show Top 10', action: 'Show top 10 items' },
    { label: 'Vibrant Colors', action: 'Use vibrant colors' },
    { label: 'Remove Last', action: 'Remove the last visual' }
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {actions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onAction(item.action)}
            className="w-full text-left px-2 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded text-xs transition"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;