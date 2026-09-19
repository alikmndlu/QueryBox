import React, { useRef, useEffect, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { formatSQL } from '../../lib/formatter';

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

  const settings = useSettingsStore((state) => state.settings);
  const draftDialect = useQueryStore((state) => state.draftDialect);
  const formatActiveQuery = useQueryStore((state) => state.formatActiveQuery);
  const schemaTables = useConnectionStore((state) => state.schemaTables);

  // Pre-calculate cached completion suggestions to prevent high Garbage Collection load & typing lag
  const cachedCompletions = useMemo(() => {
    const tableItems: any[] = [];
    const columnItems: any[] = [];
    const tableColumnMap: Record<string, any[]> = {};

    (schemaTables || []).forEach((tbl) => {
      tableItems.push({
        label: tbl.name,
        kind: 5, // CompletionItemKind.Class
        detail: tbl.schema ? `[Table] ${tbl.schema}.${tbl.name}` : `[Table] ${tbl.name}`,
        documentation: `Table (${tbl.columns?.length || 0} columns)`,
        insertText: tbl.name,
      });

      const colsForTable: any[] = [];
      tbl.columns?.forEach((col) => {
        const colItem = {
          label: col.name,
          kind: 3, // CompletionItemKind.Field
          detail: `[Column] ${tbl.name}.${col.name} : ${col.dataType}`,
          documentation: `${tbl.name}.${col.name} (${col.dataType}${col.isPrimaryKey ? ' - PK' : ''}${col.isNullable ? ' - Nullable' : ''})`,
          insertText: col.name,
        };
        colsForTable.push(colItem);
        columnItems.push(colItem);

        columnItems.push({
          label: `${tbl.name}.${col.name}`,
          kind: 9, // CompletionItemKind.Property
          detail: `[Qualified] ${col.dataType}`,
          insertText: `${tbl.name}.${col.name}`,
        });
      });

      tableColumnMap[tbl.name.toLowerCase()] = colsForTable;
    });

    return { tableItems, columnItems, tableColumnMap };
  }, [schemaTables]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Fix Cursor Misalignment: Force Monaco font re-measurement after WebFonts load
    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }
    setTimeout(() => monaco.editor.remeasureFonts(), 150);
    setTimeout(() => monaco.editor.remeasureFonts(), 600);

    // Define custom dark slate theme for QueryBox
    monaco.editor.defineTheme('querybox-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'string', foreground: 'fbbf24' },
        { token: 'string.sql', foreground: 'fbbf24' },
        { token: 'string.quote', foreground: 'fbbf24' },
        { token: 'string.invalid', foreground: 'fbbf24' },
        { token: 'invalid', foreground: 'fbbf24' },
        { token: 'delimiter.quote', foreground: 'fbbf24' },
        { token: 'delimiter.single', foreground: 'fbbf24' },
        { token: 'number', foreground: 'f472b6' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'operator', foreground: '38bdf8' },
        { token: 'identifier', foreground: 'f8fafc' },
        { token: 'identifier.quote', foreground: '38bdf8' },
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

    const activeTheme = settings.theme === 'light' ? 'vs' : 'querybox-dark';
    monaco.editor.setTheme(activeTheme);

    // Register high-performance SQL IntelliSense completion provider
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

          // Dot notation e.g. "users." -> suggest columns for table "users"
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

          // Check if context is after FROM / JOIN / INTO / UPDATE / TABLE (boost tables)
          const isTableContext = /\b(FROM|JOIN|INTO|UPDATE|TABLE|TRUNCATE)\s+[\w\.]*$/i.test(lineUntilPosition);

          // 1. Pre-cached Tables
          tableItems.forEach((item: any) => {
            suggestions.push({
              ...item,
              sortText: isTableContext ? `0_${item.label}` : `1_${item.label}`,
              range,
            });
          });

          // 2. Pre-cached Columns
          columnItems.forEach((item: any) => {
            suggestions.push({
              ...item,
              sortText: `2_${item.label}`,
              range,
            });
          });

          // 3. Keywords
          SQL_KEYWORDS.forEach((kw) => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              sortText: `3_${kw}`,
              range,
            });
          });

          // 4. Functions
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

    // Format on paste listener
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

    // Optimized selection listener using requestAnimationFrame to eliminate typing lag
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

    // Keyboard shortcuts inside Monaco Editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentVal = editor.getValue();
      onChange(currentVal);
      if (onSave) onSave(currentVal);
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
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
      if (onExecute) onExecute(selectedText || undefined);
    });
  };

  // Sync cached completion items ref for instant access inside provider
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any)._cachedCompletions = cachedCompletions;
    }
  }, [cachedCompletions]);

  // Handle Container Resizing (e.g. sidebar open/close) to keep editor canvas & cursor aligned
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

  // Update theme dynamically when settings change
  useEffect(() => {
    if (monacoRef.current) {
      const theme = settings.theme === 'light' ? 'vs' : 'querybox-dark';
      monacoRef.current.editor.setTheme(theme);
    }
  }, [settings.theme]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#080b11]">
      <Editor
        height="100%"
        defaultLanguage="sql"
        language="sql"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        theme={settings.theme === 'light' ? 'vs' : 'querybox-dark'}
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
