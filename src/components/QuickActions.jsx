const QuickActions = ({ onAction }) => {
  const actions = [
    { label: 'Add Time Intelligence', action: 'Add YTD and YoY calculations' },
    { label: 'Show Top 10 Only', action: 'Show only top 10 items in charts' },
    { label: 'Vibrant Colors', action: 'Use vibrant color palette' },
    { label: 'Add KPIs', action: 'Add more KPI cards for key metrics' }
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h3>
      <div className="space-y-1">
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