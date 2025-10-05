import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import CodeBlock from './CodeBlock';
import { generateBasicMeasures, generateTimeIntelligence, generatePowerQueryM } from '../utils/daxGenerator';
import { inferDataTypes, detectRelationships } from '../utils/csvParser';

const SetupGuide = ({ dashboardSpec, csvData, fileName }) => {
  const [expandedStep, setExpandedStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  if (!dashboardSpec || !csvData) return null;

  const dataTypes = inferDataTypes(csvData.data, csvData.headers);
  const relationships = detectRelationships(csvData.data, csvData.headers);
  const basicMeasures = generateBasicMeasures(csvData.headers, dataTypes);
  const powerQueryM = generatePowerQueryM(fileName, csvData.headers);

  const steps = [
    {
      title: 'Step 1: Import Your Data',
      content: (
        <div>
          <p className="mb-4">Open Power BI Desktop and use this Power Query M code to import your data:</p>
          <CodeBlock code={powerQueryM} language="m" />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Get Data" → "Blank Query"</li>
              <li>Open Advanced Editor</li>
              <li>Paste the code above</li>
              <li>Update the file path to your CSV location</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: 'Step 2: Create DAX Measures',
      content: (
        <div>
          <p className="mb-4">Create these measures in Power BI:</p>
          {basicMeasures.slice(0, 5).map((measure, idx) => (
            <div key={idx} className="mb-6">
              <h4 className="font-semibold mb-2">{measure.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{measure.description}</p>
              <CodeBlock code={measure.formula} language="dax" />
            </div>
          ))}
          {relationships.dateColumns.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 mt-6">Time Intelligence Measures:</h4>
              {generateTimeIntelligence(relationships.dateColumns[0]).slice(0, 2).map((measure, idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="font-semibold mb-2">{measure.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{measure.description}</p>
                  <CodeBlock code={measure.formula} language="dax" />
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Step 3: Build Visuals',
      content: (
        <div>
          <p className="mb-4">Add these visuals to your report:</p>
          {dashboardSpec.visuals?.map((visual, idx) => (
            <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">{visual.title}</h4>
              <p className="text-sm mb-2"><strong>Visual Type:</strong> {visual.type.toUpperCase()}</p>
              {visual.xAxis && <p className="text-sm"><strong>X-Axis:</strong> {visual.xAxis}</p>}
              {visual.yAxis && <p className="text-sm"><strong>Y-Axis:</strong> {visual.yAxis}</p>}
              {visual.dataKey && <p className="text-sm"><strong>Values:</strong> {visual.dataKey}</p>}
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="card mt-6">
      <h2 className="text-2xl font-bold mb-6">Power BI Setup Guide</h2>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === idx ? -1 : idx)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                {completedSteps.includes(idx) && <CheckCircle className="w-5 h-5 text-green-600" />}
                <span className="font-semibold">{step.title}</span>
              </div>
              {expandedStep === idx ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {expandedStep === idx && (
              <div className="p-6 bg-white">
                {step.content}
                <button
                  onClick={() => setCompletedSteps([...completedSteps, idx])}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Complete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupGuide;