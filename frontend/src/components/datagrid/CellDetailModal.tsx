import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  FileJson,
  FileText,
  WrapText,
  Braces,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface CellDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  rowIndex: number;
  value: any;
}

export const CellDetailModal: React.FC<CellDetailModalProps> = ({
  isOpen,
  onClose,
  columnName,
  rowIndex,
  value,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrettified, setIsPrettified] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  const isNull = value === null || value === undefined;

  // Determine value type and attempt JSON parsing
  const { isJson, formattedValue, rawValue, valueType } = useMemo(() => {
    if (isNull) {
      return { isJson: false, formattedValue: 'NULL', rawValue: 'NULL', valueType: 'NULL' };
    }

    if (typeof value === 'object') {
      try {
        const prettified = JSON.stringify(value, null, 2);
        const raw = JSON.stringify(value);
        return { isJson: true, formattedValue: prettified, rawValue: raw, valueType: 'JSON Object' };
      } catch {
        const str = String(value);
        return { isJson: false, formattedValue: str, rawValue: str, valueType: 'Object' };
      }
    }

    const strVal = String(value);

    // Try parsing string as JSON if it starts with { or [
    const trimmed = strVal.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        const prettified = JSON.stringify(parsed, null, 2);
        return { isJson: true, formattedValue: prettified, rawValue: strVal, valueType: 'JSON String' };
      } catch {
        // Not valid JSON
      }
    }

    // Numbers / Booleans / Standard text
    if (typeof value === 'number') {
      return { isJson: false, formattedValue: strVal, rawValue: strVal, valueType: 'Number' };
    }
    if (typeof value === 'boolean') {
      return { isJson: false, formattedValue: strVal, rawValue: strVal, valueType: 'Boolean' };
    }

    return { isJson: false, formattedValue: strVal, rawValue: strVal, valueType: 'Text / String' };
  }, [value, isNull]);

  const displayContent = isJson ? (isPrettified ? formattedValue : rawValue) : rawValue;
  const lineCount = displayContent ? displayContent.split('\n').length : 0;
  const charCount = displayContent ? displayContent.length : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-[#0f1420] border-[#1e293b] text-slate-100 shadow-2xl flex flex-col p-0 overflow-hidden rounded-xl">
        {/* Header */}
        <DialogHeader className="p-4 bg-[#0a0d16] border-b border-[#1c2538] flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {isJson ? <FileJson className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-bold text-white font-mono tracking-tight">
                  {columnName}
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 bg-[#141b2b] text-indigo-300 border-[#1f2b45]">
                  Row #{rowIndex + 1}
                </Badge>
                <Badge
                  variant={isJson ? 'secondary' : 'outline'}
                  className={`text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold ${
                    isJson ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {valueType}
                </Badge>
              </div>

              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                <span>{charCount.toLocaleString()} chars</span>
                <span>·</span>
                <span>{lineCount} lines</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isJson && (
              <Button
                onClick={() => setIsPrettified(!isPrettified)}
                variant="subtle"
                size="sm"
                className={`h-8 px-2.5 text-xs font-mono font-medium gap-1.5 transition-colors ${
                  isPrettified
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-[#141b2b] text-slate-400 border border-[#1f2b45]'
                }`}
                title="Format / Prettify JSON"
              >
                <Braces className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPrettified ? 'Format JSON: ON' : 'Format JSON: OFF'}</span>
              </Button>
            )}

            <Button
              onClick={() => setWordWrap(!wordWrap)}
              variant="subtle"
              size="sm"
              className={`h-8 px-2.5 text-xs font-mono font-medium gap-1.5 transition-colors ${
                wordWrap
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-[#141b2b] text-slate-400 border border-[#1f2b45]'
              }`}
              title="Toggle Word Wrap"
            >
              <WrapText className="w-3.5 h-3.5" />
              <span>Wrap</span>
            </Button>

            <Button
              onClick={handleCopy}
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Value'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content Viewer Body */}
        <div className="flex-1 p-4 overflow-auto bg-[#070912] font-mono text-xs select-text">
          {isNull ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-500 italic select-none">
              <span>(NULL)</span>
            </div>
          ) : (
            <pre
              className={`p-4 rounded-xl bg-[#0a0d16] border border-[#1b2333] leading-relaxed select-text ${
                isJson ? 'text-amber-300' : 'text-slate-200'
              } ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'}`}
            >
              {displayContent}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
