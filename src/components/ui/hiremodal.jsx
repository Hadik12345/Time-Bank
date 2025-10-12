import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send } from 'lucide-react';

export default function HireModal({ taskCreatorName, onSend, onClose, isSending }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95">
        <header className="p-6 border-b flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-800">Request to Hire</h2>
            <p className="text-sm text-gray-500">Send a message to {taskCreatorName} about what you need.</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </header>
        
        <main className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="hire-message" className="text-sm font-medium text-gray-700">Your Message</label>
              <Textarea
                id="hire-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${taskCreatorName}, I'd like to hire you for your help with...`}
                className="mt-1 h-32"
              />
            </div>
          </div>
        </main>

        <footer className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
                onClick={handleSend} 
                disabled={isSending || !message.trim()}
                className="bg-gradient-to-r from-blue-500 to-green-500"
            >
                {isSending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Request</>}
            </Button>
        </footer>
      </div>
    </div>
  );
}

