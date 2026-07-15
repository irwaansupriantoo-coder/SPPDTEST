import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = "Pilih...", label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
          {label}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[46px] bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm hover:ring-2 hover:ring-[#00475e]/30 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3"
      >
        <div className={`flex-1 break-words ${!value ? 'text-slate-500' : 'text-slate-800'}`}>
          {value || placeholder}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="px-4 py-3 text-sm cursor-pointer border-b border-slate-100 text-slate-400 hover:bg-slate-50 italic"
          >
            {placeholder}
          </div>
          {options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`px-4 py-3 text-sm cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors break-words
                ${value === opt ? 'bg-[#00475e]/10 font-bold text-[#00475e]' : 'text-slate-700'}
              `}
            >
              {opt}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500 italic">
              Tidak ada pilihan tersedia
            </div>
          )}
        </div>
      )}
    </div>
  );
}
