import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ value, label = 'Copy', className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for environments without clipboard permission
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : `${label} to clipboard`}
      title={copied ? 'Copied!' : label}
      className={`inline-flex items-center gap-1.5 font-body text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-900 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
        copied ? 'bg-[#8EBD6D] text-[#5A4D44]' : 'bg-white hover:bg-zinc-50 text-[#5A4D44]'
      } ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
};