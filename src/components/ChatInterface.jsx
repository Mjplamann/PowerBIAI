import { useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

const ChatInterface = ({ messages, onSendMessage, isLoading, inputValue, setInputValue }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="card h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4">AI Assistant</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Ask me anything about your dashboard design!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <Bot className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />}
              <div className={msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}>
                {msg.content}
              </div>
              {msg.role === 'user' && <User className="w-6 h-6 text-white bg-blue-600 rounded-full p-1 flex-shrink-0 mt-1" />}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <div className="chat-message-assistant">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask to modify the dashboard..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;