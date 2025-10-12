import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, Clock, Users, CheckCircle } from 'lucide-react';

export default function HelpBox() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 shadow-lg hover:scale-110 transition-transform duration-200"
        >
          <HelpCircle className="w-8 h-8 text-white" />
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <header className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">How TimeBank Works</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </header>
            
            <main className="p-6 overflow-y-auto">
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> What are Time Credits?</h3>
                  <p>Time credits are the currency of our community. One hour of your time equals one hour of credit you can use to get help from others. The value is time, not money.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-green-500" /> How do I get started?</h3>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Offer Help:</strong> Create a task offering a skill you have. When you help someone, you earn time credits.</li>
                    <li><strong>Request Help:</strong> Need assistance? Create a task and use your earned credits to get help from a community member.</li>
                    <li><strong>Explore:</strong> Browse tasks posted by others in your community.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-500" /> Is it safe?</h3>
                  <p>TimeBank is built on trust. We encourage all members to complete their profiles and communicate clearly. After a task is completed, both parties confirm to ensure everything went well. Always prioritize your safety when meeting someone new.</p>
                </div>

                <div className="pt-4 border-t">
                    <h3 className="font-semibold text-lg mb-2">FAQ</h3>
                    <div className="space-y-2">
                        <p><strong>Q: What if I don't have any credits to start?</strong><br/>A: Every new member gets 60 minutes of starting credits to help you get your first task done!</p>
                        <p><strong>Q: Can I cancel a task?</strong><br/>A: Yes, you can cancel a task at any time before it's completed. Please communicate with the other person if you need to cancel.</p>
                    </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}

