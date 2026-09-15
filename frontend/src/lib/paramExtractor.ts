// Parameter Extractor & Substitutor for QueryBox

export interface ExtractedParam {
  name: string;
  placeholder: string;
  type: 'string' | 'number' | 'date';
}

export function extractParameters(sql: string): ExtractedParam[] {
  if (!sql) return [];

  const paramsMap = new Map<string, ExtractedParam>();

  // Match :paramName (word characters, not preceded by colon to avoid ::type cast in Postgres)
  const colonRegex = /(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match: RegExpExecArray | null;

  while ((match = colonRegex.exec(sql)) !== null) {
    const name = match[1];
    if (!paramsMap.has(name)) {
      paramsMap.set(name, {
        name,
        placeholder: `:${name}`,
        type: name.includes('date') || name.includes('time') ? 'date' : name.includes('id') || name.includes('count') ? 'number' : 'string',
      });
    }
  }

  // Match {{paramName}}
  const mustacheRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  while ((match = mustacheRegex.exec(sql)) !== null) {
    const name = match[1];
    if (!paramsMap.has(name)) {
      paramsMap.set(name, {
        name,
        placeholder: match[0],
        type: name.includes('date') || name.includes('time') ? 'date' : name.includes('id') || name.includes('count') ? 'number' : 'string',
      });
    }
  }

  return Array.from(paramsMap.values());
}

export function substituteParameters(sql: string, paramValues: Record<string, string>): string {
  if (!sql) return sql;

  let substituted = sql;

  for (const [name, val] of Object.entries(paramValues)) {
    if (val === undefined || val === '') continue;

    // Quote string if it looks like a text string and is not already quoted or numeric
    const isNum = !isNaN(Number(val)) && val.trim() !== '';
    const formattedVal = isNum ? val : `'${val.replace(/'/g, "''")}'`;

    // Replace :name
    const colonRegex = new RegExp(`(?<!:):${name}\\b`, 'g');
    substituted = substituted.replace(colonRegex, formattedVal);

    // Replace {{name}}
    const mustacheRegex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
    substituted = substituted.replace(mustacheRegex, formattedVal);
  }

  return substituted;
}
