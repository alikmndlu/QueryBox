import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Copy, Check } from 'lucide-react';
import { extractParameters, substituteParameters } from '../../lib/paramExtractor';
import { useUIStore } from '../../store/useUIStore';

interface ParameterBarProps {
  sql: string;
  paramValues: Record<string, string>;
  onChangeParam: (name: string, value: string) => void;
  onClearParams: () => void;
}

export const ParameterBar: React.FC<ParameterBarProps> = ({
  sql,
  paramValues,
  onChangeParam,
  onClearParams,
}) => {
  const { showToast } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const params = extractParameters(sql);

  if (params.length === 0) {
    return null;
  }

  const handleCopySubstituted = () => {
    const finalSQL = substituteParameters(sql, paramValues);
    navigator.clipboard.writeText(finalSQL);
    setCopied(true);
    showToast('Substituted SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0e1320] border-b border-[#1b2333] px-3.5 py-1.5 transition-all select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Variables</span>
            <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono">
              {params.length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Values are auto-applied on Run or Copy
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySubstituted}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-[#161d2d] px-2 py-0.5 rounded transition-colors"
            title="Copy SQL with replaced parameter values"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Substituted'}</span>
          </button>

          <button
            onClick={onClearParams}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded transition-colors"
            title="Reset all variable inputs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 pt-2 border-t border-[#1b2333]/60">
          {params.map((p) => {
            const val = paramValues[p.name] || '';
            return (
              <div
                key={p.name}
                className="flex items-center bg-[#090d16] border border-[#1b2333] rounded-md px-2 py-1 text-xs focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all"
              >
                <span className="text-[11px] font-mono text-indigo-400 font-medium mr-1.5 shrink-0 select-none">
                  {p.placeholder}:
                </span>
                <input
                  type={p.type === 'number' ? 'number' : 'text'}
                  value={val}
                  onChange={(e) => onChangeParam(p.name, e.target.value)}
                  placeholder={`e.g. ${p.type === 'number' ? '42' : p.type === 'date' ? '2026-01-01' : 'active'}`}
                  className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none text-xs font-mono"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
