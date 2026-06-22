/**
 * A small, safe arithmetic + unit-conversion evaluator used by the search
 * bar / calculator. It never uses `eval`: it tokenises and runs a classic
 * shunting-yard parser, so arbitrary JS can't sneak in.
 */

type Token = { type: 'num'; value: number } | { type: 'op'; value: string } | { type: 'paren'; value: '(' | ')' };

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.replace(/\s+/g, '');
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < s.length && /[0-9.eE]/.test(s[i])) num += s[i++];
      const value = Number(num);
      if (Number.isNaN(value)) return null;
      tokens.push({ type: 'num', value });
      continue;
    }
    if ('+-*/%^'.includes(c)) {
      // Unary minus → 0 - x
      if (c === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'op' || (tokens[tokens.length - 1] as Token).value === '(')) {
        tokens.push({ type: 'num', value: 0 });
      }
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({ type: 'paren', value: c });
      i++;
      continue;
    }
    return null; // unknown character
  }
  return tokens;
}

/** Evaluate a pure arithmetic expression. Returns null if it isn't one. */
export function evaluateExpression(input: string): number | null {
  if (!/[0-9]/.test(input) || !/[-+*/%^]/.test(input)) return null;
  const tokens = tokenize(input);
  if (!tokens) return null;

  const output: Token[] = [];
  const ops: Token[] = [];
  for (const t of tokens) {
    if (t.type === 'num') output.push(t);
    else if (t.type === 'op') {
      while (
        ops.length &&
        ops[ops.length - 1].type === 'op' &&
        PRECEDENCE[(ops[ops.length - 1] as { value: string }).value] >= PRECEDENCE[t.value] &&
        t.value !== '^'
      ) {
        output.push(ops.pop() as Token);
      }
      ops.push(t);
    } else if (t.value === '(') ops.push(t);
    else {
      while (ops.length && (ops[ops.length - 1] as { value: string }).value !== '(') output.push(ops.pop() as Token);
      if (!ops.length) return null;
      ops.pop();
    }
  }
  while (ops.length) {
    const op = ops.pop() as Token;
    if (op.type === 'paren') return null;
    output.push(op);
  }

  const stack: number[] = [];
  for (const t of output) {
    if (t.type === 'num') stack.push(t.value);
    else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return null;
      switch (t.value) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(a / b); break;
        case '%': stack.push(a % b); break;
        case '^': stack.push(a ** b); break;
        default: return null;
      }
    }
  }
  const result = stack.length === 1 ? stack[0] : null;
  return result === null || Number.isNaN(result) || !Number.isFinite(result) ? null : result;
}

/* ---- Unit conversion -------------------------------------------------- */

// Conversion factors expressed relative to a base unit per dimension.
const UNITS: Record<string, { base: string; factor: number; aliases: string[] }> = {
  // length (base: metre)
  m: { base: 'length', factor: 1, aliases: ['meter', 'meters', 'metre', 'metres'] },
  km: { base: 'length', factor: 1000, aliases: ['kilometer', 'kilometers'] },
  cm: { base: 'length', factor: 0.01, aliases: ['centimeter', 'centimeters'] },
  mm: { base: 'length', factor: 0.001, aliases: ['millimeter', 'millimeters'] },
  mi: { base: 'length', factor: 1609.344, aliases: ['mile', 'miles'] },
  ft: { base: 'length', factor: 0.3048, aliases: ['foot', 'feet'] },
  in: { base: 'length', factor: 0.0254, aliases: ['inch', 'inches'] },
  yd: { base: 'length', factor: 0.9144, aliases: ['yard', 'yards'] },
  // mass (base: gram)
  g: { base: 'mass', factor: 1, aliases: ['gram', 'grams'] },
  kg: { base: 'mass', factor: 1000, aliases: ['kilogram', 'kilograms'] },
  lb: { base: 'mass', factor: 453.592, aliases: ['lbs', 'pound', 'pounds'] },
  oz: { base: 'mass', factor: 28.3495, aliases: ['ounce', 'ounces'] }
};

function resolveUnit(name: string): string | null {
  const n = name.toLowerCase();
  if (UNITS[n]) return n;
  for (const [key, def] of Object.entries(UNITS)) {
    if (def.aliases.includes(n)) return key;
  }
  return null;
}

export interface ConversionResult {
  value: number;
  from: string;
  to: string;
}

/** Parse phrases like "10 km to mi" or "5ft in cm". */
export function convertUnits(input: string): ConversionResult | null {
  const m = input
    .trim()
    .toLowerCase()
    .match(/^([\d.]+)\s*([a-z]+)\s*(?:to|in|as|=>)\s*([a-z]+)$/);
  if (!m) return null;

  // Temperature is special (offsets, not just factors).
  const value = Number(m[1]);
  const fromRaw = m[2];
  const toRaw = m[3];
  const temp = convertTemperature(value, fromRaw, toRaw);
  if (temp !== null) return { value: temp, from: fromRaw, to: toRaw };

  const from = resolveUnit(fromRaw);
  const to = resolveUnit(toRaw);
  if (!from || !to) return null;
  if (UNITS[from].base !== UNITS[to].base) return null;
  const result = (value * UNITS[from].factor) / UNITS[to].factor;
  return { value: result, from, to };
}

function convertTemperature(value: number, from: string, to: string): number | null {
  const f = ['c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin'];
  const norm = (u: string) => (u.startsWith('c') ? 'c' : u.startsWith('f') ? 'f' : u.startsWith('k') ? 'k' : null);
  if (!f.includes(from) || !f.includes(to)) return null;
  const a = norm(from);
  const b = norm(to);
  if (!a || !b) return null;
  // to celsius
  const c = a === 'c' ? value : a === 'f' ? ((value - 32) * 5) / 9 : value - 273.15;
  // from celsius
  return b === 'c' ? c : b === 'f' ? (c * 9) / 5 + 32 : c + 273.15;
}

/** Round to a sensible number of significant digits for display. */
export function prettyNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return Number(n.toFixed(4)).toLocaleString();
}
