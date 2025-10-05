import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const FileUpload = ({ onFileUpload, fileName, rowCount, columnCount }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    try {
      const text = await file.text();
      onFileUpload(text, file.name);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  if (fileName) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">File Uploaded</h3>
            <p className="text-gray-600">{fileName}</p>
            <p className="text-sm text-gray-500">{rowCount.toLocaleString()} rows × {columnCount} columns</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Power BI AI Dashboard Builder</h1>
        <p className="text-lg text-gray-600">Upload CSV and let AI design your dashboard</p>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        className="card cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition"
      >
        <div className="py-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <Upload className="w-12 h-12 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-2">Upload CSV File</h3>
          <p className="text-gray-600">Drag and drop or click to browse</p>
        </div>
        <input id="file-input" type="file" accept=".csv" onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} className="hidden" />
      </div>
      {error && <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded"><p className="text-red-800">{error}</p></div>}
    </div>
  );
};

export default FileUpload;