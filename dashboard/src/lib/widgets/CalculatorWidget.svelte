<script lang="ts">
  /**
   * CalculatorWidget — a glass calculator with a stepwise state machine.
   *
   * State machine: we hold the `accumulator` (the running result), the
   * `pending` operator, and the `display` string the user is typing. Pressing
   * an operator folds the current display into the accumulator. `evaluateExpression`
   * from $utils/calc is available for one-shot evaluation, but the explicit
   * machine gives correct chaining (e.g. 2 + 3 × 4) and live feedback.
   */
  import type { WidgetInstance } from '$lib/types';
  import Icon from '$components/Icon.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let { instance }: { instance: WidgetInstance } = $props();

  type Op = '+' | '-' | '*' | '/';

  let display = $state('0'); // what the user currently sees / is typing
  let accumulator = $state<number | null>(null); // running result
  let pending = $state<Op | null>(null); // operator awaiting its right operand
  let freshOperand = $state(true); // next digit starts a new number

  // Which operator is "armed" (highlighted) — only while awaiting input.
  const activeOp = $derived(freshOperand ? pending : null);

  function compute(a: number, b: number, op: Op): number {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
    }
  }

  /** Trim a computed number to a clean, display-friendly string. */
  function formatResult(n: number): string {
    if (!Number.isFinite(n)) return 'Error';
    // Limit precision then strip trailing zeros.
    const rounded = Math.round(n * 1e10) / 1e10;
    return String(rounded);
  }

  function inputDigit(d: string) {
    if (display === 'Error') clearAll();
    if (freshOperand) {
      display = d;
      freshOperand = false;
    } else {
      display = display === '0' ? d : display + d;
    }
  }

  function inputDot() {
    if (display === 'Error') clearAll();
    if (freshOperand) {
      display = '0.';
      freshOperand = false;
    } else if (!display.includes('.')) {
      display += '.';
    }
  }

  function setOperator(op: Op) {
    if (display === 'Error') return;
    const current = parseFloat(display);
    if (accumulator === null) {
      accumulator = current;
    } else if (!freshOperand && pending) {
      // Chain: fold the just-typed operand into the accumulator.
      accumulator = compute(accumulator, current, pending);
      display = formatResult(accumulator);
    }
    pending = op;
    freshOperand = true;
  }

  function equals() {
    if (pending === null || accumulator === null) return;
    const current = parseFloat(display);
    const result = compute(accumulator, current, pending);
    display = formatResult(result);
    accumulator = null;
    pending = null;
    freshOperand = true;
  }

  function clearAll() {
    display = '0';
    accumulator = null;
    pending = null;
    freshOperand = true;
  }

  function negate() {
    if (display === '0' || display === 'Error') return;
    display = display.startsWith('-') ? display.slice(1) : '-' + display;
  }

  function percent() {
    if (display === 'Error') return;
    display = formatResult(parseFloat(display) / 100);
    freshOperand = true;
  }

  function backspace() {
    if (display === 'Error' || freshOperand) return;
    display = display.length <= 1 || (display.length === 2 && display.startsWith('-')) ? '0' : display.slice(0, -1);
    if (display === '0') freshOperand = true;
  }

  // Physical keyboard support. Global listener; cleaned up on teardown.
  $effect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= '0' && k <= '9') inputDigit(k);
      else if (k === '.') inputDot();
      else if (k === '+' || k === '-' || k === '*' || k === '/') setOperator(k as Op);
      else if (k === 'Enter' || k === '=') {
        e.preventDefault();
        equals();
      } else if (k === 'Backspace') backspace();
      else if (k === 'Escape') clearAll();
      else if (k === '%') percent();
      else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Shrink the display font as the number gets longer so it never overflows.
  const displayScale = $derived(
    display.length > 11 ? 0.55 : display.length > 8 ? 0.72 : display.length > 6 ? 0.86 : 1
  );

  // Button grid definition. `kind` drives styling; `value` keys the handler.
  type Btn = { label: string; kind?: 'op' | 'fn' | 'eq' | 'wide'; value: string };
  const ROWS: Btn[][] = [
    [
      { label: 'AC', kind: 'fn', value: 'ac' },
      { label: '+/−', kind: 'fn', value: 'neg' },
      { label: '%', kind: 'fn', value: 'pct' },
      { label: '÷', kind: 'op', value: '/' }
    ],
    [
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '×', kind: 'op', value: '*' }
    ],
    [
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '−', kind: 'op', value: '-' }
    ],
    [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '+', kind: 'op', value: '+' }
    ],
    [
      { label: '0', kind: 'wide', value: '0' },
      { label: '.', value: '.' },
      { label: '=', kind: 'eq', value: '=' }
    ]
  ];

  function press(b: Btn) {
    switch (b.value) {
      case 'ac':
        clearAll();
        break;
      case 'neg':
        negate();
        break;
      case 'pct':
        percent();
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        setOperator(b.value);
        break;
      case '=':
        equals();
        break;
      case '.':
        inputDot();
        break;
      default:
        inputDigit(b.value);
    }
  }
</script>

<div class="calc">
  <div class="display selectable tabular" style:--scale={displayScale}>
    {display}
  </div>

  <div class="keys">
    {#each ROWS as row, r (r)}
      {#each row as b (b.value)}
        <button
          class="key"
          class:op={b.kind === 'op'}
          class:fn={b.kind === 'fn'}
          class:eq={b.kind === 'eq'}
          class:wide={b.kind === 'wide'}
          class:armed={b.kind === 'op' && b.value === activeOp}
          aria-label={b.label}
          onclick={() => press(b)}
        >
          {b.label}
        </button>
      {/each}
    {/each}
  </div>
</div>

<style>
  .calc {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(var(--space-1), 2cqh, var(--space-3));
    container-type: size;
  }
  .display {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    text-align: right;
    font-weight: 500;
    font-size: calc(clamp(1.6rem, 16cqh, 3rem) * var(--scale, 1));
    line-height: 1.1;
    padding: 0 0.15rem;
    overflow: hidden;
    white-space: nowrap;
    transition: font-size var(--dur-fast) var(--ease-smooth);
  }
  .keys {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(4px, 1.5cqw, 8px);
    min-height: 0;
  }
  .key {
    display: grid;
    place-items: center;
    border-radius: var(--radius-md);
    background: var(--control-fill);
    font-weight: 500;
    font-size: clamp(0.9rem, 7cqh, 1.25rem);
    color: var(--text-primary);
    transition:
      transform var(--dur-fast) var(--ease-spring),
      background-color var(--dur-fast) var(--ease-smooth);
  }
  .key:hover {
    background: var(--control-fill-active);
  }
  .key:active {
    transform: scale(0.93);
  }
  .key.wide {
    grid-column: span 2;
  }
  /* Function keys (AC, +/−, %) read as secondary. */
  .key.fn {
    color: var(--text-secondary);
    font-weight: 600;
  }
  /* Operator keys tint with the accent. */
  .key.op {
    color: var(--accent);
    background: var(--accent-soft);
    font-weight: 600;
  }
  .key.op:hover {
    background: color-mix(in srgb, var(--accent) 30%, transparent);
  }
  /* Armed (selected) operator inverts to a filled accent chip. */
  .key.op.armed {
    background: var(--accent);
    color: #fff;
  }
  /* Equals is accent-filled. */
  .key.eq {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }
  .key.eq:hover {
    background: color-mix(in srgb, var(--accent) 88%, #000);
  }
</style>
