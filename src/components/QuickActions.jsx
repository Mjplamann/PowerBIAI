const QuickActions = ({ onAction }) => {
  const actions = [
    { label: 'Add Time Intelligence', action: 'Add YTD and YoY calculations' },
    { label: 'Show Top 10', action: 'Show only top 10 items in charts' },
    { label: 'Change Colors', action: 'Use vibrant color palette' },
    { label: 'Add Trend Lines', action: 'Add trend lines to charts' }
  ];

  return (
    <div className="card mt-4">
      <h3 className="font-semibold mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onAction(item.action)}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm transition"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;