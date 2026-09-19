import React, { useState, useMemo, useEffect } from 'react';
import {
  Copy,
  Check,
  X,
  Sliders,
  Database,
  Quote,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export interface CopyColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  rows: any[][];
  defaultColumnIndex?: number;
}

export type PresetType = 'sql_in' | 'comma' | 'newline' | 'json' | 'custom';
export type QuoteStyle = 'single' | 'double' | 'backtick' | 'none';
export type DelimiterType = 'comma_space' | 'comma' | 'newline' | 'tab' | 'custom';
export type WrapperType = 'sql_in' | 'parens' | 'brackets' | 'none';

export const CopyColumnModal: React.FC<CopyColumnModalProps> = ({
  isOpen,
  onClose,
  columns,
  rows,
  defaultColumnIndex = 0,
}) => {
  const { showToast } = useUIStore();

  const [selectedColIdx, setSelectedColIdx] = useState<number>(defaultColumnIndex);
  const [preset, setPreset] = useState<PresetType>('sql_in');
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>('single');
  const [delimiter, setDelimiter] = useState<DelimiterType>('comma_space');
  const [customDelimiter, setCustomDelimiter] = useState<string>(', ');
  const [wrapper, setWrapper] = useState<WrapperType>('none');
  const [deduplicate, setDeduplicate] = useState<boolean>(false);
  const [excludeNulls, setExcludeNulls] = useState<boolean>(true);
  const [trimValues, setTrimValues] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync default column index when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultColumnIndex >= 0 && defaultColumnIndex < columns.length) {
        setSelectedColIdx(defaultColumnIndex);
      } else {
        setSelectedColIdx(0);
      }
      setCopied(false);
    }
  }, [isOpen, defaultColumnIndex, columns.length]);

  // Handle Preset Selection
  const applyPreset = (p: PresetType) => {
    setPreset(p);
    if (p === 'sql_in') {
      setQuoteStyle('single');
      setDelimiter('comma_space');
      setWrapper('none');
      setExcludeNulls(true);
    } else if (p === 'comma') {
      setQuoteStyle('none');
      setDelimiter('comma_space');
      setWrapper('none');
      setExcludeNulls(false);
    } else if (p === 'newline') {
      setQuoteStyle('none');
      setDelimiter('newline');
      setWrapper('none');
      setExcludeNulls(false);
    } else if (p === 'json') {
      setQuoteStyle('double');
      setDelimiter('comma');
      setWrapper('brackets');
      setExcludeNulls(true);
    }
  };

  // Generate output text based on formatting options
  const formattedData = useMemo(() => {
    if (!rows || rows.length === 0 || selectedColIdx < 0 || selectedColIdx >= columns.length) {
      return { text: '', total: 0, count: 0, nulls: 0 };
    }

    const rawValues: any[] = rows.map((r) => (r ? r[selectedColIdx] : null));
    const total = rawValues.length;
    let nulls = 0;

    let values: string[] = [];

    for (let val of rawValues) {
      if (val === null || val === undefined) {
        nulls++;
        if (excludeNulls) continue;
        values.push(quoteStyle === 'none' ? 'NULL' : quoteStyle === 'single' ? "'NULL'" : '"NULL"');
        continue;
      }

      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (trimValues) str = str.trim();

      if (quoteStyle === 'single') {
        const escaped = str.replace(/'/g, "''");
        values.push(`'${escaped}'`);
      } else if (quoteStyle === 'double') {
        const escaped = str.replace(/"/g, '""');
        values.push(`"${escaped}"`);
      } else if (quoteStyle === 'backtick') {
        const escaped = str.replace(/`/g, '``');
        values.push(`\`${escaped}\``);
      } else {
        values.push(str);
      }
    }

    if (deduplicate) {
      values = Array.from(new Set(values));
    }

    let sep = ', ';
    if (delimiter === 'comma') sep = ',';
    else if (delimiter === 'comma_space') sep = ', ';
    else if (delimiter === 'newline') sep = '\n';
    else if (delimiter === 'tab') sep = '\t';
    else if (delimiter === 'custom') sep = customDelimiter;

    let body = values.join(sep);

    if (wrapper === 'sql_in') {
      body = `IN (${body})`;
    } else if (wrapper === 'parens') {
      body = `(${body})`;
    } else if (wrapper === 'brackets') {
      body = `[${body}]`;
    }

    return {
      text: body,
      total,
      count: values.length,
      nulls,
    };
  }, [
    rows,
    columns,
    selectedColIdx,
    quoteStyle,
    delimiter,
    customDelimiter,
    wrapper,
    deduplicate,
    excludeNulls,
    trimValues,
  ]);

  const handleCopy = () => {
    if (!formattedData.text) return;
    navigator.clipboard.writeText(formattedData.text);
    setCopied(true);
    const colName = columns[selectedColIdx] || 'Column';
    showToast(`Copied ${formattedData.count} values from "${colName}" to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const columnName = columns[selectedColIdx] || 'Column';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
      <div className="w-full max-w-2xl bg-[#0d111a] border border-[#1e2738] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#101623] border-b border-[#1b2333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Copy Column Values
                <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {columnName}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Format and copy values for SQL <code className="text-amber-300 font-mono">IN (...)</code> queries or spreadsheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#1b2438] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Column Selector & Preset Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-500" />
                Select Target Column
              </label>
              <select
                value={selectedColIdx}
                onChange={(e) => setSelectedColIdx(Number(e.target.value))}
                className="w-full bg-[#131927] border border-[#1b2438] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {columns.map((col, idx) => (
                  <option key={col} value={idx}>
                    {idx + 1}. {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Format Preset
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#131927] p-1 border border-[#1b2438] rounded-lg">
                <button
                  type="button"
                  onClick={() => applyPreset('sql_in')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    preset === 'sql_in'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#182133]'
                  }`}
                >
                  'val1', 'val2' (SQL)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('comma')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    preset === 'comma'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#182133]'
                  }`}
                >
                  val1, val2 (Plain)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('newline')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    preset === 'newline'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#182133]'
                  }`}
                >
                  Line by Line
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('json')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    preset === 'json'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#182133]'
                  }`}
                >
                  JSON ["a", "b"]
                </button>
              </div>
            </div>
          </div>

          {/* Formatting Customization Settings */}
          <div className="bg-[#111623] border border-[#1b2438] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 pb-2 border-b border-[#1b2438]">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Formatting Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quote Style */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Quote Style</label>
                <select
                  value={quoteStyle}
                  onChange={(e) => {
                    setQuoteStyle(e.target.value as QuoteStyle);
                    setPreset('custom');
                  }}
                  className="w-full bg-[#161d2d] border border-[#222b3e] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="single">Single Quotes ('val')</option>
                  <option value="double">Double Quotes ("val")</option>
                  <option value="backtick">Backticks (`val`)</option>
                  <option value="none">None (val)</option>
                </select>
              </div>

              {/* Delimiter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Delimiter</label>
                <select
                  value={delimiter}
                  onChange={(e) => {
                    setDelimiter(e.target.value as DelimiterType);
                    setPreset('custom');
                  }}
                  className="w-full bg-[#161d2d] border border-[#222b3e] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="comma_space">Comma & Space (, )</option>
                  <option value="comma">Comma only (,)</option>
                  <option value="newline">New Line (\n)</option>
                  <option value="tab">Tab (\t)</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>

              {/* Enclosing Wrapper */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Enclosing Wrapper</label>
                <select
                  value={wrapper}
                  onChange={(e) => {
                    setWrapper(e.target.value as WrapperType);
                    setPreset('custom');
                  }}
                  className="w-full bg-[#161d2d] border border-[#222b3e] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="none">None</option>
                  <option value="sql_in">IN (...)</option>
                  <option value="parens">(...)</option>
                  <option value="brackets">[...]</option>
                </select>
              </div>
            </div>

            {delimiter === 'custom' && (
              <div className="pt-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Custom Delimiter String</label>
                <input
                  type="text"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="e.g. | or ;"
                  className="w-full bg-[#161d2d] border border-[#222b3e] rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Checkboxes / Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded border-[#2a354c] bg-[#0c101a] text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Unique / Distinct Values Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={excludeNulls}
                  onChange={(e) => setExcludeNulls(e.target.checked)}
                  className="rounded border-[#2a354c] bg-[#0c101a] text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Exclude NULLs / Empty Values</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={trimValues}
                  onChange={(e) => setTrimValues(e.target.checked)}
                  className="rounded border-[#2a354c] bg-[#0c101a] text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Trim Whitespace</span>
              </label>
            </div>
          </div>

          {/* Live Preview & Statistics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Live Output Preview
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>Values: <strong className="text-indigo-400">{formattedData.count}</strong> / {formattedData.total}</span>
                {formattedData.nulls > 0 && <span>NULLs: <strong className="text-amber-400">{formattedData.nulls}</strong></span>}
                <span>Chars: <strong className="text-emerald-400">{formattedData.text.length}</strong></span>
              </div>
            </div>

            <textarea
              readOnly
              value={formattedData.text}
              placeholder="No data to preview..."
              rows={5}
              className="w-full bg-[#080b11] border border-[#1b2438] rounded-lg p-3 font-mono text-xs text-indigo-200 focus:outline-none resize-none select-all"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0a0e17] border-t border-[#1b2333] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Ready to paste in SQL WHERE {columnName} IN (...)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#161d2d] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              disabled={!formattedData.text}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Values'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
