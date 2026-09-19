import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Code2,
  Play,
  Copy,
  Settings2,
  Bot,
  User,
  Zap,
  Check,
  RotateCcw,
  Database,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { useAIStore, AIProvider } from '../../store/useAIStore';
import { AIService } from '../../lib/aiService';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useUIStore } from '../../store/useUIStore';

export const AICopilotDrawer: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    clearMessages,
    isGenerating,
    setGenerating,
    provider,
    setProvider,
    apiKey,
    setApiKey,
    ollamaEndpoint,
    setOllamaEndpoint,
    modelName,
    setModelName,
  } = useAIStore();

  const { executeQuery, activeDatabase } = useConnectionStore();
  const { updateDraft, activeQuery } = useQueryStore();
  const { showToast } = useUIStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendPrompt = async (promptText?: string) => {
    const textToSend = (promptText || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    setInputPrompt('');
    addMessage({ sender: 'user', text: textToSend });
    setGenerating(true);

    try {
      const response = await AIService.generateSQLFromPrompt(textToSend);
      addMessage({
        sender: 'assistant',
        text: response.text,
        sql: response.sql,
        explanation: response.explanation,
      });
    } catch (err: any) {
      addMessage({
        sender: 'assistant',
        text: `خطا در برقراری ارتباط با AI: ${err?.message || 'خطای ناشناخته'}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRunSQL = async (sql: string) => {
    if (activeQuery) {
      updateDraft({ sqlContent: sql });
    }
    showToast('کد SQL به ادیتور منتقل شد و در حال اجراست...', 'info');
    await executeQuery(sql);
  };

  const handleInsertSQL = (sql: string) => {
    if (activeQuery) {
      updateDraft({ sqlContent: sql });
      showToast('کد SQL در ادیتور جای‌گذاری شد');
    }
  };

  const handleCopySQL = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#0c1019]/95 backdrop-blur-xl border-l border-[#1c263c] shadow-2xl z-50 flex flex-col select-none transition-all duration-300">
      {/* Drawer Header */}
      <div className="h-14 px-4 bg-[#080b12] border-b border-[#1c263c] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>QueryBox AI Copilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {provider}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              دستیار هوشمند تولید SQL و بهینه‌سازی دیتابیس ({activeDatabase || 'No DB'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettings
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'text-slate-400 hover:text-white bg-[#151d2f] border-[#1c263c]'
            }`}
            title="تنظیمات مدل و API Key"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearMessages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#151d2f] border border-[#1c263c] transition-colors"
            title="بازنشانی گفت‌وگو"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#151d2f] border border-[#1c263c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Drawer Overlay */}
      {showSettings && (
        <div className="p-4 bg-[#101625] border-b border-[#1c263c] text-xs space-y-3 animate-in fade-in-50 duration-150">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>تنظیمات ارائه دهنده هوش مصنوعی</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(['offline', 'openai', 'gemini', 'ollama'] as AIProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`py-1.5 px-2 rounded-lg text-center font-mono text-[11px] capitalize border transition-all ${
                  provider === p
                    ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-900/40'
                    : 'bg-[#161f33] text-slate-400 border-[#232e48] hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {provider === 'offline' && (
            <div className="text-[11px] text-slate-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-emerald-300">
              💡 حالت آفلاین هوشمند فعال است. نیازی به API Key یا اینترنت ندارد.
            </div>
          )}

          {(provider === 'openai' || provider === 'gemini') && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                API Key ({provider.toUpperCase()})
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[#090d16] border border-[#232e48] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          )}

          {provider === 'ollama' && (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Ollama Endpoint</label>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-[#090d16] border border-[#232e48] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="llama3"
                  className="w-full bg-[#090d16] border border-[#232e48] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Prompt Presets */}
      <div className="px-4 py-2 bg-[#090d15] border-b border-[#1c263c] flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-300 shrink-0">
        <span className="text-slate-500 shrink-0 font-medium">پیش‌فرض‌ها:</span>
        <button
          onClick={() => handleSendPrompt('۱۰ ردیف برتر جدول اصلی را نشان بده')}
          className="px-2 py-0.5 rounded bg-[#161f33] hover:bg-indigo-600/30 hover:text-indigo-200 border border-[#232e48] whitespace-nowrap transition-colors"
        >
          ۱۰ ردیف برتر
        </button>
        <button
          onClick={() => handleSendPrompt('کوئری ترکیب JOIN جدول‌ها')}
          className="px-2 py-0.5 rounded bg-[#161f33] hover:bg-indigo-600/30 hover:text-indigo-200 border border-[#232e48] whitespace-nowrap transition-colors"
        >
          کوئری JOIN
        </button>
        <button
          onClick={() => handleSendPrompt('دسته‌بندی و تعداد ردیف‌ها GROUP BY')}
          className="px-2 py-0.5 rounded bg-[#161f33] hover:bg-indigo-600/30 hover:text-indigo-200 border border-[#232e48] whitespace-nowrap transition-colors"
        >
          گروه‌بندی GROUP BY
        </button>
        <button
          onClick={() => handleSendPrompt('توضیح اسکیما و جدول‌ها')}
          className="px-2 py-0.5 rounded bg-[#161f33] hover:bg-indigo-600/30 hover:text-indigo-200 border border-[#232e48] whitespace-nowrap transition-colors"
        >
          توضیح اسکیما
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-2.5 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-950/40'
                  : 'bg-[#121927] border border-[#1e2942] text-slate-200 rounded-tl-none shadow-xl'
              }`}
            >
              <div className="text-[11px] flex items-center justify-between gap-2 border-b border-white/10 pb-1 opacity-80">
                <span className="font-semibold">{msg.sender === 'user' ? 'شما' : 'QueryBox AI'}</span>
                <span className="font-mono text-[9px]">{msg.timestamp}</span>
              </div>

              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Generated SQL Card */}
              {msg.sql && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Generated SQL</span>
                    </span>
                    <button
                      onClick={() => handleCopySQL(msg.sql!, msg.id)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded-lg bg-[#080b11] border border-[#1b253b] text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                    {msg.sql}
                  </pre>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleInsertSQL(msg.sql!)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-[#182236] hover:bg-[#202d48] rounded border border-[#2b3a5c] transition-colors flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3 text-indigo-400" />
                      <span>انتقال به ادیتور</span>
                    </button>
                    <button
                      onClick={() => handleRunSQL(msg.sql!)}
                      className="px-3 py-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded shadow-md shadow-emerald-950/40 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>اجرا در دیتابیس</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>در حال تحلیل اسکیما و تولید کوئری...</span>
          </div>
        )}
      </div>

      {/* Drawer Input Footer */}
      <div className="p-3 bg-[#080b12] border-t border-[#1c263c] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="سوال دیتابیسی خود را بنویسید (مثلاً: ۱۰ مشتری برتر...)"
            className="flex-1 bg-[#101625] border border-[#1e2942] rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isGenerating}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
