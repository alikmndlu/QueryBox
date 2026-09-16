import React, { useRef, useEffect } from 'react';
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
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const settings = useSettingsStore((state) => state.settings);
  const draftDialect = useQueryStore((state) => state.draftDialect);
  const formatActiveQuery = useQueryStore((state) => state.formatActiveQuery);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark slate theme for QueryBox
    monaco.editor.defineTheme('querybox-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f43f5e' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'operator', foreground: '38bdf8' },
        { token: 'identifier', foreground: 'f8fafc' },
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

    // Register custom SQL IntelliSense provider (keywords, functions, schema tables & columns)
    if (!sqlCompletionDisposable) {
      sqlCompletionDisposable = monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '.', '(', ','],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: any[] = [];

          // Keywords
          SQL_KEYWORDS.forEach((kw) => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              range,
            });
          });

          // Functions
          SQL_FUNCTIONS.forEach((fn) => {
            suggestions.push({
              label: fn.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: fn.detail,
              range,
            });
          });

          // Tables and columns from live introspected schema
          const schemaTables = useConnectionStore.getState().schemaTables;
          schemaTables.forEach((tbl) => {
            suggestions.push({
              label: tbl.name,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: tbl.schema ? `[Table] ${tbl.schema}.${tbl.name}` : `[Table] ${tbl.name}`,
              documentation: `Table in schema (${tbl.columns?.length || 0} columns)`,
              insertText: tbl.name,
              range,
            });

            tbl.columns?.forEach((col) => {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: `[Column] ${tbl.name}.${col.name} : ${col.dataType}`,
                documentation: `${tbl.name}.${col.name} (${col.dataType}${col.isPrimaryKey ? ' - Primary Key' : ''}${col.isNullable ? ' - Nullable' : ''})`,
                insertText: col.name,
                range,
              });

              suggestions.push({
                label: `${tbl.name}.${col.name}`,
                kind: monaco.languages.CompletionItemKind.Property,
                detail: `[Column] ${col.dataType}`,
                insertText: `${tbl.name}.${col.name}`,
                range,
              });
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

    // Track selection changes and notify parent component
    editor.onDidChangeCursorSelection((e: any) => {
      const model = editor.getModel();
      if (model && e.selection && !e.selection.isEmpty()) {
        const selText = model.getValueInRange(e.selection).trim();
        if (onSelectionChange) onSelectionChange(selText);
      } else {
        if (onSelectionChange) onSelectionChange('');
      }
    });

    // Add keyboard shortcuts inside Monaco Editor
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

  // Update theme dynamically when settings change
  useEffect(() => {
    if (monacoRef.current) {
      const theme = settings.theme === 'light' ? 'vs' : 'querybox-dark';
      monacoRef.current.editor.setTheme(theme);
    }
  }, [settings.theme]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#080b11]">
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
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};
