'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { BugReportModal } from './BugReportModal';

export const FeedbackButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative glass-button p-4 rounded-full text-orange-400 hover:text-orange-300 transition-all duration-300 hover:scale-105"
          aria-label="Submit Feedback"
        >
          {/* Main Icon */}
          <MessageSquare className="w-6 h-6" />
          
          {/* Simple Tooltip */}
          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 glass-card text-glass text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}>
            Submit Feedback
            {/* Tooltip Arrow */}
            <div className="absolute top-full right-4 border-4 border-transparent border-t-white border-t-opacity-20" />
          </div>
        </button>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};