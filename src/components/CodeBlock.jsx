import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CodeBlock = ({ code, language = 'dax' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="code-block overflow-x-auto"><code>{code}</code></pre>
    </div>
  );
};

export default CodeBlock;