'use client';

import React, { useState } from 'react';
import { X, Upload, MessageSquare, Send } from 'lucide-react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const handleClose = () => {
    // Reset form when closing
    setFormData({
      type: 'bug',
      email: '',
      subject: '',
      description: '',
    });
    setAttachments([]);
    setSubmissionId('');
    setSubmitted(false);
    onClose();
  };
  const [formData, setFormData] = useState({
    type: 'bug' as 'bug' | 'improvement',
    email: '',
    subject: '',
    description: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
          return false;
        }
        return true;
      });
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const generateSubmissionId = (): string => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate unique submission ID
      const submissionId = generateSubmissionId();
      setSubmissionId(submissionId);

      // Convert attachments to base64 for sending
      const attachmentPromises = attachments.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result as string // base64 string
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const processedAttachments = await Promise.all(attachmentPromises);

      // Prepare data for API
      const feedbackData = {
        type: formData.type,
        email: formData.email,
        subject: formData.subject,
        description: formData.description,
        submissionId,
        attachments: processedAttachments
      };

      // Send to API endpoint
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Show error to user
      alert('Failed to send feedback. Please try again or contact salas@ionq.co directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="glass-card-dark max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-orange-400" />
            <div>
              <h2 className="text-xl font-bold text-glass">Submit Feedback</h2>
              <p className="text-sm text-glass-secondary">Report bugs or suggest improvements</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-glass" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-glass mb-2">Thank You!</h3>
            <div className="mb-4">
              <p className="text-glass-secondary mb-2">
                Your feedback has been submitted successfully.
              </p>
              <div className="glass-card p-4 inline-block">
                <p className="text-sm text-glass-secondary mb-1">Submission ID:</p>
                <p className="text-lg font-mono text-orange-400 font-semibold">#{submissionId}</p>
              </div>
            </div>
            <p className="text-sm text-glass-secondary">
              We&apos;ll review your {formData.type === 'bug' ? 'bug report' : 'feature request'} and get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            {/* Issue Type */}
            <div className="mb-8">
              <label className="block text-lg font-medium text-glass mb-4">
                What type of feedback is this?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="bug"
                    checked={formData.type === 'bug'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'bug' }))}
                    className="mr-3 w-4 h-4 text-orange-400 focus:ring-orange-400 focus:ring-2"
                  />
                  <span className="text-glass text-base">Bug Report</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="improvement"
                    checked={formData.type === 'improvement'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'improvement' }))}
                    className="mr-3 w-4 h-4 text-orange-400 focus:ring-orange-400 focus:ring-2"
                  />
                  <span className="text-glass text-base">Feature Request</span>
                </label>
              </div>
            </div>

            {/* Email */}
            <div className="mb-8">
              <label htmlFor="email" className="block text-base font-medium text-glass mb-3">
                Your Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="glass-input w-full p-4 text-base"
                placeholder="your.email@company.com"
              />
            </div>

            {/* Subject */}
            <div className="mb-8">
              <label htmlFor="subject" className="block text-base font-medium text-glass mb-3">
                Subject <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="glass-input w-full p-4 text-base"
                placeholder="Brief description of the issue or suggestion"
              />
            </div>

            {/* Description */}
            <div className="mb-8">
              <label htmlFor="description" className="block text-base font-medium text-glass mb-3">
                Description <span className="text-orange-400">*</span>
              </label>
              <textarea
                id="description"
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glass-input w-full p-4 text-base resize-none"
                placeholder="Please provide detailed information about the issue or your suggestion..."
              />
            </div>

            {/* File Attachments */}
            <div className="mb-8">
              <label className="block text-base font-medium text-glass mb-3">
                Screenshots or Files (optional)
              </label>
              <div className="border-2 border-dashed border-white border-opacity-30 rounded-xl p-8 text-center hover:border-orange-400 hover:border-opacity-50 transition-colors">
                <div className="flex flex-col items-center space-y-3">
                  <Upload className="w-12 h-12 text-orange-400" />
                  <p className="text-glass-secondary text-base">
                    Drag and drop files here, or{' '}
                    <label className="text-orange-400 hover:text-orange-300 cursor-pointer underline font-medium">
                      browse
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-sm text-glass-secondary">
                    Support for images, PDFs, and documents (max 10MB each)
                  </p>
                </div>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-base font-medium text-glass">Attached Files:</p>
                  {attachments.map((file, index) => (
                    <div key={index} className="bg-white bg-opacity-5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Upload className="w-5 h-5 text-orange-400" />
                          <span className="text-base text-glass">{file.name}</span>
                          <span className="text-sm text-glass-secondary">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-glass" />
                        </button>
                      </div>
                      {/* Image Preview */}
                      {file.type.startsWith('image/') && (
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="max-w-full max-h-48 rounded-lg object-contain bg-black bg-opacity-30"
                            onLoad={(e) => {
                              // Clean up object URL after image loads
                              setTimeout(() => URL.revokeObjectURL((e.target as HTMLImageElement).src), 1000);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="glass-button px-6 py-3 text-glass hover:text-white text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.subject || !formData.description}
                className="glass-button px-8 py-3 text-orange-400 hover:text-orange-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};