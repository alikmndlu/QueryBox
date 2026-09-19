import React, { useRef, useEffect, useMemo, useState } from 'react';
import Editor, { OnMount, BeforeMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { formatSQL } from '../../lib/formatter';

// Pre-configure Monaco to load from bundled local npm package (100% offline, zero CDN calls)
loader.config({ monaco });

interface SQLEditorProps {
  value: string;
  onChange: (val: string) => void;
  onSave?: (currentVal?: string) => void;
  onFormat?: () => void;
  onExecute?: (selectedSQL?: string) => void;
  onSelectionChange?: (selectedSQL: string) => void;
}

let sqlCompletionDisposable: any = null;

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'UPDATE', 'DELETE FROM',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE', 'CREATE INDEX', 'DROP INDEX',
  'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL',
  'AS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'DEFAULT', 'CHECK', 'UNIQUE', 'CASCADE',
  'VALUES', 'SET', 'WITH', 'OVER', 'PARTITION BY', 'DESC', 'ASC',
];

const SQL_FUNCTIONS = [
  { label: 'COUNT', insertText: 'COUNT(${1:*})', detail: 'COUNT(expression)' },
  { label: 'SUM', insertText: 'SUM(${1:column})', detail: 'SUM(column)' },
  { label: 'AVG', insertText: 'AVG(${1:column})', detail: 'AVG(column)' },
  { label: 'MIN', insertText: 'MIN(${1:column})', detail: 'MIN(column)' },
  { label: 'MAX', insertText: 'MAX(${1:column})', detail: 'MAX(column)' },
  { label: 'COALESCE', insertText: 'COALESCE(${1:val1}, ${2:val2})', detail: 'COALESCE(val1, val2, ...)' },
  { label: 'CONCAT', insertText: 'CONCAT(${1:str1}, ${2:str2})', detail: 'CONCAT(str1, str2)' },
  { label: 'NOW', insertText: 'NOW()', detail: 'Current date and time' },
  { label: 'ROUND', insertText: 'ROUND(${1:val}, ${2:2})', detail: 'ROUND(val, decimals)' },
  { label: 'LOWER', insertText: 'LOWER(${1:column})', detail: 'LOWER(column)' },
  { label: 'UPPER', insertText: 'UPPER(${1:column})', detail: 'UPPER(column)' },
  { label: 'ROW_NUMBER', insertText: 'ROW_NUMBER() OVER (ORDER BY ${1:id})', detail: 'ROW_NUMBER() window function' },
];

const registerMonacoThemes = (monaco: any) => {
  const commonStringRules = [
    { token: 'string', foreground: 'fbbf24' },
    { token: 'string.sql', foreground: 'fbbf24' },
    { token: 'string.quote', foreground: 'fbbf24' },
    { token: 'string.invalid', foreground: 'fbbf24' },
    { token: 'invalid', foreground: 'fbbf24' },
    { token: 'delimiter.quote', foreground: 'fbbf24' },
    { token: 'delimiter.single', foreground: 'fbbf24' },
  ];

  monaco.editor.defineTheme('querybox-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'f8fafc' },
      { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
      { token: 'number', foreground: 'f472b6' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'operator', foreground: '38bdf8' },
      { token: 'identifier', foreground: 'f8fafc' },
      { token: 'identifier.quote', foreground: '38bdf8' },
      { token: 'delimiter', foreground: '94a3b8' },
      ...commonStringRules,
    ],
    colors: {
      'editor.background': '#080b11',
      'editor.foreground': '#f8fafc',
      'editorCursor.foreground': '#6366f1',
      'editor.lineHighlightBackground': '#0f1422',
      'editorLineNumber.foreground': '#334155',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editor.selectionBackground': '#312e81',
      'editor.inactiveSelectionBackground': '#1e1b4b',
    },
  });

  monaco.editor.defineTheme('onedark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'abb2bf' },
      { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
      { token: 'string', foreground: '98c379' },
      { token: 'string.sql', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'operator', foreground: '56b6c2' },
      { token: 'identifier', foreground: 'abb2bf' },
    ],
    colors: {
      'editor.background': '#1e222a',
      'editor.foreground': '#abb2bf',
      'editorCursor.foreground': '#528bff',
      'editor.lineHighlightBackground': '#2c313a',
      'editorLineNumber.foreground': '#4b5263',
      'editorLineNumber.activeForeground': '#abb2bf',
      'editor.selectionBackground': '#3e4451',
    },
  });

  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'f8f8f2' },
      { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'string.sql', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'operator', foreground: '8be9fd' },
      { token: 'identifier', foreground: 'f8f8f2' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorCursor.foreground': '#f8f8f0',
      'editor.lineHighlightBackground': '#44475a',
      'editorLineNumber.foreground': '#6272a4',
      'editorLineNumber.activeForeground': '#f8f8f2',
      'editor.selectionBackground': '#44475a',
    },
  });

  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'adbac7' },
      { token: 'keyword', foreground: 'f47067', fontStyle: 'bold' },
      { token: 'string', foreground: '96d0ff' },
      { token: 'string.sql', foreground: '96d0ff' },
      { token: 'number', foreground: '6cb6ff' },
      { token: 'comment', foreground: '768390', fontStyle: 'italic' },
      { token: 'operator', foreground: 'f47067' },
      { token: 'identifier', foreground: 'adbac7' },
    ],
    colors: {
      'editor.background': '#22272e',
      'editor.foreground': '#adbac7',
      'editorCursor.foreground': '#6cb6ff',
      'editor.lineHighlightBackground': '#2d333b',
      'editorLineNumber.foreground': '#636e7b',
      'editorLineNumber.activeForeground': '#adbac7',
      'editor.selectionBackground': '#373e47',
    },
  });

  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'fcfcfa' },
      { token: 'keyword', foreground: 'ff6188', fontStyle: 'bold' },
      { token: 'string', foreground: 'ffd866' },
      { token: 'string.sql', foreground: 'ffd866' },
      { token: 'number', foreground: 'ab9df2' },
      { token: 'comment', foreground: '727072', fontStyle: 'italic' },
      { token: 'operator', foreground: '78dce8' },
      { token: 'identifier', foreground: 'fcfcfa' },
    ],
    colors: {
      'editor.background': '#2d2a2e',
      'editor.foreground': '#fcfcfa',
      'editorCursor.foreground': '#ffd866',
      'editor.lineHighlightBackground': '#403c40',
      'editorLineNumber.foreground': '#5b595c',
      'editorLineNumber.activeForeground': '#fcfcfa',
      'editor.selectionBackground': '#403c40',
    },
  });

  monaco.editor.defineTheme('cyberpunk', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: '00f0ff' },
      { token: 'keyword', foreground: 'ff0055', fontStyle: 'bold' },
      { token: 'string', foreground: 'ffe600' },
      { token: 'string.sql', foreground: 'ffe600' },
      { token: 'number', foreground: '00ff99' },
      { token: 'comment', foreground: '715b9b', fontStyle: 'italic' },
      { token: 'operator', foreground: '00f0ff' },
      { token: 'identifier', foreground: '00f0ff' },
    ],
    colors: {
      'editor.background': '#120e24',
      'editor.foreground': '#00f0ff',
      'editorCursor.foreground': '#ff0055',
      'editor.lineHighlightBackground': '#211842',
      'editorLineNumber.foreground': '#4e3b74',
      'editorLineNumber.activeForeground': '#00f0ff',
      'editor.selectionBackground': '#3a1f6c',
    },
  });

  monaco.editor.defineTheme('nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'd8dee9' },
      { token: 'keyword', foreground: '81a1c1', fontStyle: 'bold' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'string.sql', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
      { token: 'operator', foreground: '88c0d0' },
      { token: 'identifier', foreground: 'd8dee9' },
    ],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editorCursor.foreground': '#88c0d0',
      'editor.lineHighlightBackground': '#3b4252',
      'editorLineNumber.foreground': '#4c566a',
      'editorLineNumber.activeForeground': '#d8dee9',
      'editor.selectionBackground': '#434c5e',
    },
  });
};

const NativeEditorFallback: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onExecute?: (selectedSQL?: string) => void;
  onSave?: (currentVal?: string) => void;
}> = ({ value, onChange, onExecute, onSave }) => {
  const lineCount = (value || '').split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

  return (
    <div className="w-full h-full flex bg-[#080b11] text-slate-100 font-mono text-xs overflow-hidden select-text relative">
      {/* Line Numbers Bar */}
      <div className="w-12 py-3 bg-[#06080e] border-r border-[#1a2336] text-slate-600 text-right pr-3 select-none shrink-0 leading-relaxed font-mono">
        {lineNumbers.map((num) => (
          <div key={num}>{num}</div>
        ))}
      </div>
      {/* Native High-Performance Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
              target.selectionStart = target.selectionEnd = start + 2;
            }, 0);
          }
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (onExecute) onExecute(value);
          }
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (onSave) onSave(value);
          }
        }}
        placeholder="-- Type your SQL query statement here..."
        className="flex-1 w-full h-full p-3 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-mono text-xs leading-relaxed selection:bg-indigo-500/40"
      />
    </div>
  );
};

export const SQLEditor: React.FC<SQLEditorProps> = ({
  value,
  onChange,
  onSave,
  onFormat,
  onExecute,
  onSelectionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const selectionRafRef = useRef<number | null>(null);
  const isProgrammaticUpdateRef = useRef<boolean>(false);

  const [isMonacoMounted, setIsMonacoMounted] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const settings = useSettingsStore((state) => state.settings);
  const draftDialect = useQueryStore((state) => state.draftDialect);
  const formatActiveQuery = useQueryStore((state) => state.formatActiveQuery);
  const schemaTables = useConnectionStore((state) => state.schemaTables);

  // Safety fallback timer if Monaco takes > 1.5s to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!editorRef.current) {
        setUseFallback(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const cachedCompletions = useMemo(() => {
    const tableItems: any[] = [];
    const columnItems: any[] = [];
    const tableColumnMap: Record<string, any[]> = {};

    (schemaTables || []).forEach((tbl) => {
      tableItems.push({
        label: tbl.name,
        kind: 5,
        detail: tbl.schema ? `[Table] ${tbl.schema}.${tbl.name}` : `[Table] ${tbl.name}`,
        documentation: `Table (${tbl.columns?.length || 0} columns)`,
        insertText: tbl.name,
      });

      const colsForTable: any[] = [];
      tbl.columns?.forEach((col) => {
        const colItem = {
          label: col.name,
          kind: 3,
          detail: `[Column] ${tbl.name}.${col.name} : ${col.dataType}`,
          documentation: `${tbl.name}.${col.name} (${col.dataType}${col.isPrimaryKey ? ' - PK' : ''}${col.isNullable ? ' - Nullable' : ''})`,
          insertText: col.name,
        };
        colsForTable.push(colItem);
        columnItems.push(colItem);

        columnItems.push({
          label: `${tbl.name}.${col.name}`,
          kind: 9,
          detail: `[Qualified] ${col.dataType}`,
          insertText: `${tbl.name}.${col.name}`,
        });
      });

      tableColumnMap[tbl.name.toLowerCase()] = colsForTable;
    });

    return { tableItems, columnItems, tableColumnMap };
  }, [schemaTables]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerMonacoThemes(monaco);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsMonacoMounted(true);

    registerMonacoThemes(monaco);
    editor.layout();

    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }
    setTimeout(() => {
      monaco.editor.remeasureFonts();
      editor.layout();
    }, 100);
    setTimeout(() => {
      monaco.editor.remeasureFonts();
      editor.layout();
    }, 400);

    const getThemeName = (key?: string) => {
      if (!key || key === 'dark' || key === 'system') return 'querybox-dark';
      if (key === 'light') return 'vs';
      return key;
    };

    monaco.editor.setTheme(getThemeName(settings.theme));

    if (!sqlCompletionDisposable) {
      sqlCompletionDisposable = monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '.', '(', ','],
        provideCompletionItems: (model: any, position: any) => {
          const lineUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: any[] = [];
          const { tableItems, columnItems, tableColumnMap } = (editorRef.current as any)?._cachedCompletions || {
            tableItems: [],
            columnItems: [],
            tableColumnMap: {},
          };

          const dotMatch = lineUntilPosition.match(/([\w]+)\.$/);
          if (dotMatch) {
            const tableName = dotMatch[1].toLowerCase();
            const cols = tableColumnMap[tableName];
            if (cols) {
              cols.forEach((col: any, idx: number) => {
                suggestions.push({
                  ...col,
                  sortText: `0_${idx}`,
                  range,
                });
              });
              return { suggestions };
            }
          }

          const isTableContext = /\b(FROM|JOIN|INTO|UPDATE|TABLE|TRUNCATE)\s+[\w\.]*$/i.test(lineUntilPosition);

          tableItems.forEach((item: any) => {
            suggestions.push({
              ...item,
              sortText: isTableContext ? `0_${item.label}` : `1_${item.label}`,
              range,
            });
          });

          columnItems.forEach((item: any) => {
            suggestions.push({
              ...item,
              sortText: `2_${item.label}`,
              range,
            });
          });

          SQL_KEYWORDS.forEach((kw) => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              sortText: `3_${kw}`,
              range,
            });
          });

          SQL_FUNCTIONS.forEach((fn) => {
            suggestions.push({
              label: fn.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: fn.detail,
              sortText: `3_${fn.label}`,
              range,
            });
          });

          return { suggestions };
        },
      });
    }

    editor.onDidPaste(() => {
      const currentSettings = useSettingsStore.getState().settings;
      if (currentSettings.formatOnPaste) {
        setTimeout(() => {
          const val = editor.getValue();
          const formatted = formatSQL(val, draftDialect);
          if (!formatted.error && formatted.formatted !== val) {
            editor.setValue(formatted.formatted);
          }
        }, 50);
      }
    });

    editor.onDidChangeCursorSelection((e: any) => {
      if (selectionRafRef.current) cancelAnimationFrame(selectionRafRef.current);
      selectionRafRef.current = requestAnimationFrame(() => {
        const model = editor.getModel();
        if (model && e.selection && !e.selection.isEmpty()) {
          const selText = model.getValueInRange(e.selection).trim();
          if (onSelectionChange) onSelectionChange(selText);
        } else {
          if (onSelectionChange) onSelectionChange('');
        }
      });
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentVal = editor.getValue();
      onChange(currentVal);
      if (onSave) onSave(currentVal);
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        const currentVal = editor.getValue();
        onChange(currentVal);
        if (onFormat) {
          onFormat();
        } else {
          formatActiveQuery();
        }
      }
    );

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const model = editor.getModel();
      const selection = editor.getSelection();
      let selectedText = '';
      if (model && selection && !selection.isEmpty()) {
        selectedText = model.getValueInRange(selection).trim();
      }
      const currentVal = editor.getValue();
      onChange(currentVal);
      if (onExecute) onExecute(selectedText || currentVal);
    });
  };

  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any)._cachedCompletions = cachedCompletions;
    }
  }, [cachedCompletions]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const resolveMonacoTheme = (key?: string) => {
    if (!key || key === 'dark' || key === 'system') return 'querybox-dark';
    if (key === 'light') return 'vs';
    return key;
  };

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(resolveMonacoTheme(settings.theme));
    }
  }, [settings.theme]);

  // Sync editor buffer value smoothly when value prop changes
  useEffect(() => {
    if (editorRef.current) {
      const currentEditorValue = editorRef.current.getValue();
      if (value !== undefined && value !== currentEditorValue) {
        isProgrammaticUpdateRef.current = true;
        editorRef.current.setValue(value);
        setTimeout(() => {
          isProgrammaticUpdateRef.current = false;
        }, 60);
      }
    }
  }, [value]);

  if (useFallback) {
    return (
      <NativeEditorFallback
        value={value}
        onChange={onChange}
        onExecute={onExecute}
        onSave={onSave}
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#080b11]">
      <Editor
        height="100%"
        defaultLanguage="sql"
        language="sql"
        value={value}
        onChange={(val) => {
          if (isProgrammaticUpdateRef.current) return;
          onChange(val || '');
        }}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        theme={resolveMonacoTheme(settings.theme)}
        options={{
          fontSize: settings.fontSize || 13,
          lineHeight: 21,
          letterSpacing: 0,
          tabSize: settings.tabSize || 2,
          wordWrap: settings.wordWrap || 'on',
          minimap: { enabled: settings.showMinimap },
          lineNumbers: settings.lineNumbers === 'on' ? 'on' : 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: 'always',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
          fontLigatures: false,
          fixedOverflowWidgets: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};
