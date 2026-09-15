import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Code2, Copy, Check, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useQueryStore } from '../../store/useQueryStore';
import { generateCodeSnippet } from '../../lib/codeGenerators';
import { ExportCodeLanguage } from '../../types';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

export const CopyAsCodeModal: React.FC = () => {
  const { copyAsCodeModalOpen, setCopyAsCodeModalOpen, showToast } = useUIStore();
  const { draftSQL, draftDialect } = useQueryStore();

  const [selectedLang, setSelectedLang] = useState<ExportCodeLanguage>('go');
  const [copied, setCopied] = useState(false);

  if (!copyAsCodeModalOpen) return null;

  const snippet = generateCodeSnippet(draftSQL, selectedLang, draftDialect);

  const languages: { id: ExportCodeLanguage; label: string }[] = [
    { id: 'go', label: 'Go' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python' },
    { id: 'rust', label: 'Rust' },
    { id: 'php', label: 'PHP' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    showToast(`Copied ${snippet.displayName} snippet to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={copyAsCodeModalOpen} onOpenChange={setCopyAsCodeModalOpen}>
      <DialogContent className="max-w-3xl h-[650px] flex flex-col p-0 overflow-hidden bg-[#0a0d16] border-[#1b2333]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1b2333] flex items-center justify-between bg-[#0e1322] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-slate-100">
                Copy Query as Code Snippet
              </DialogTitle>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Generate production-ready database execution code in your programming language
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              variant="default"
              size="sm"
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </Button>
            <Button
              onClick={() => setCopyAsCodeModalOpen(false)}
              variant="ghost"
              size="iconSm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="px-5 py-2.5 bg-[#0a0d17] border-b border-[#1b2333] flex items-center gap-2 shrink-0">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedLang === lang.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#111726] text-slate-400 hover:text-slate-200 hover:bg-[#161f33]'
              }`}
            >
              {lang.label}
            </button>
          ))}
          <div className="ml-auto text-xs text-slate-500 font-mono">
            {snippet.displayName}
          </div>
        </div>

        {/* Code Preview */}
        <div className="flex-1 w-full h-full bg-[#080b11] overflow-hidden">
          <Editor
            value={snippet.code}
            language={snippet.monacoLang}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
