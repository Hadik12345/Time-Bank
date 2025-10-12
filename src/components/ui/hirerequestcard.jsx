import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/entities/User';

export default function HireRequestCard({ request, onAccept, isAccepting }) {

  const handleAccept = () => {
    onAccept(request);
  };

  return (
    <div className="p-4 bg-blue-50 border-t border-b border-blue-200 animate-in fade-in-0">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {request.requester_photo_url ? <img src={request.requester_photo_url} alt={request.requester_name} className="w-full h-full object-cover" /> : <span>{request.requester_name?.charAt(0) || 'U'}</span>}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{request.requester_name}</p>
                <p className="text-sm text-gray-600 mt-1 italic bg-white p-2 rounded-md">"{request.message}"</p>
            </div>
            <Button 
                size="sm" 
                onClick={handleAccept}
                disabled={isAccepting}
                className="bg-green-500 hover:bg-green-600"
            >
                {isAccepting ? 'Accepting...' : 'Accept'}
            </Button>
        </div>
    </div>
  );
}
