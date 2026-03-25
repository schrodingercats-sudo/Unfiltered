'use client';

import { useState, useRef } from 'react';
import { X, Download, Twitter, MessageCircle, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const authorName = post.is_anonymous ? 'Anonymous' : post.profiles?.alias || 'Unknown';

  const generateImage = async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `unfiltered-post-${post.id}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleTwitterShare = () => {
    const text = `"${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"\n\n— ${authorName} on UNFILTERED`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = `"${post.content}"\n— ${authorName} on UNFILTERED\n\n${postUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="font-bold uppercase tracking-wider text-sm text-gray-400">Share Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* The Card to be captured */}
          <div 
            ref={cardRef}
            className="w-full bg-black border border-gray-800 p-6 rounded-xl mb-6 relative overflow-hidden"
            style={{ width: '300px' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-white"></div>
            <p className="text-lg text-white font-medium leading-relaxed mb-6 whitespace-pre-wrap">
              &quot;{post.content}&quot;
            </p>
            <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-end">
              <div>
                <p className="text-sm font-bold text-gray-300">— {authorName}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">UNFILTERED</p>
              </div>
              <div className="text-[10px] text-gray-600 font-mono">
                unfiltered.app
              </div>
            </div>
          </div>

          {/* Share Actions */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button 
              onClick={handleTwitterShare}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Twitter size={20} className="text-white" />
              <span className="text-xs font-medium">X / Twitter</span>
            </button>
            <button 
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <MessageCircle size={20} className="text-green-500" />
              <span className="text-xs font-medium">WhatsApp</span>
            </button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <Download size={20} className="text-white" />
              <span className="text-xs font-medium">{isGenerating ? 'Saving...' : 'Save Image'}</span>
            </button>
            <button 
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Copy size={20} className="text-white" />
              <span className="text-xs font-medium">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
