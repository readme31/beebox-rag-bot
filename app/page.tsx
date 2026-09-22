'use client';

import React from 'react';
import { useChat } from '@ai-sdk/react';

const sampleQuestions = [
  'What is the SKU for a customized PP cup 12oz?',
  'How much is a Customized PET Cup 16oz at 7,000 pcs?',
  'What does MBX mean in a family code?',
  'What is the printer code for S007?',
];

type Source = {
  text?: string | null;
  score?: number | null;
  source?: string | null;
  sku?: string | null;
  family?: string | null;
  legacy?: string | null;
  category?: string | null;
  type?: string | null;
};

function citationLabel(src: Source): string {
  if (src.source && src.sku) {
    return `Source: ${src.source} — SKU: ${src.sku}`;
  }
  if (src.source && src.family) {
    return `Source: ${src.source} — Family: ${src.family}`;
  }
  if (src.source) {
    return `Source: ${src.source}`;
  }
  return 'Catalog chunk';
}

export default function Page() {
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/chat',
  });
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Beebox Catalog Assistant</h1>
        <p className="text-sm text-slate-500">
          Ask about SKU codes, family codes, prices, supplier info, and tier pricing for Beebox, Trigem, Beelife, and Suki packaging products.
        </p>
      </header>

      {mounted && messages.length === 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white px-8 py-10 text-center">
          <p className="text-slate-700">Welcome to the Beebox Catalog.</p>
          <ul className="mx-auto mt-6 max-w-xl space-y-2 text-left">
            {sampleQuestions.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  onClick={() => setInput(question)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm text-slate-600 hover:border-cyan-500 hover:text-slate-900"
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(messages.length > 0 || status === 'streaming' || error) && (
        <ul className="space-y-4 mb-6 min-h-[200px]">
          {messages.map((m) => (
            <li
              key={m.id}
              className={
                m.role === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start flex-col items-start'
              }
            >
              <span
                className={
                  m.role === 'user'
                    ? 'inline-block rounded-2xl bg-cyan-600 text-white px-4 py-2 max-w-[85%]'
                    : 'inline-block rounded-2xl bg-white border border-slate-200 px-4 py-2 max-w-[85%]'
                }
              >
                {m.content}
              </span>

              {m.role === 'assistant' &&
                m.toolInvocations?.map(
                  (inv) =>
                    inv.state === 'result' &&
                    inv.toolName === 'getInformation' && (
                      <details
                        key={inv.toolCallId}
                        className="mt-2 text-sm text-slate-600 max-w-[85%]"
                      >
                        <summary className="cursor-pointer">
                          Sources ({(inv.result as Source[]).length})
                        </summary>
                        <ul className="mt-2 space-y-2">
                          {(inv.result as Source[]).map((src, i) => (
                            <li
                              key={i}
                              className="border-l-2 border-l-cyan-500 border-t border-t-slate-200 pl-3 pt-2 first:border-t-0 first:pt-0"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-xs text-slate-500">
                                  {citationLabel(src)}
                                </span>
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                                  {typeof src.score === 'number'
                                    ? src.score.toFixed(2)
                                    : '—'}
                                </span>
                              </div>
                              <p>{src.text}</p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ),
                )}
            </li>
          ))}
          {status === 'streaming' && (
            <li className="text-sm text-slate-400">…</li>
          )}
          {error && (
            <li className="text-sm text-rose-600">
              Error: {error.message}
            </li>
          )}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          placeholder="Ask about any SKU, product, supplier, or price…"
          disabled={status === 'streaming' || status === 'submitted'}
          suppressHydrationWarning={true}
        />
        <button
          type="submit"
          disabled={!input || status === 'streaming' || status === 'submitted'}
          className="rounded-lg bg-slate-900 text-white px-4 py-2 disabled:opacity-40"
          suppressHydrationWarning={true}
        >
          Send
        </button>
      </form>
    </main>
  );
}
