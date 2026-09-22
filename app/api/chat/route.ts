/**
 * Chat route: RAG via the getInformation tool.
 *
 * The model calls getInformation, which runs vector search and returns
 * chunk text, score, and catalog metadata. The client renders those as
 * collapsible sources under the assistant message.
 */
import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

const SUPPLIER_NAMES = [
  'regencia printing', 'regencia',
  'hahsy',
  'asher printing', 'asher',
  'jk packaging',
  'astrotea',
  'shenzhen longworld', 'shenzhen',
  'sir florante', 'florante',
  'dsam',
  'ucardprint',
  'colorful packaging',
];

const REFUSAL = 'I can only work with supplier codes, not names. Could you rephrase using S-codes? Example: S002, S007, S009.';

const index = new Index();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const userText = Array.isArray(lastUser?.content)
    ? lastUser.content.map((p: any) => p.text ?? '').join(' ').toLowerCase()
    : (typeof lastUser?.content === 'string' ? lastUser.content : '').toLowerCase();
  const foundName = SUPPLIER_NAMES.find((name) => userText.includes(name));

  if (foundName) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`0:${JSON.stringify(REFUSAL)}\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are the Beebox Catalog Assistant. You help users look up packaging products, SKU codes, prices, brand information, and tier pricing for Beebox, Trigem, Beelife, and Suki products.

Rules:
- Always use the search tool before answering ANY other question.
- Answer ONLY from retrieved sources. Never use general knowledge.
- Refuse questions about supplier IDENTITIES. If the user asks who a supplier is, or asks for a supplier's name, or asks which supplier makes a product, reply exactly: 'I can only share supplier codes, not supplier identities.'
- Answer questions about supplier CODES. The user CAN ask things like: 'What is the printer code for S007?', 'Which products come from S008?', or 'What does S006 supply?' Answer these directly from the catalog data.
- Cite the SKU when quoting products or prices. Do not add source file names to the prose — the sources panel handles attribution.
- If the tool returns nothing relevant, say: 'I don't have that in the catalog.' Do not guess.
- When quoting prices, always state the tier (quantity range).`,
    messages,
    tools: {
      getInformation: tool({
        description:
          'Search the Beebox packaging catalog. Use this tool to answer ANY ' +
          'question about Beebox, Trigem, Beelife, and Suki packaging products — ' +
          'SKU codes, family codes, printer codes, prices, pack quantities, tier ' +
          'pricing, specifications, and legacy codes. Do not answer questions ' +
          'about supplier identities. Always call this tool before answering. ' +
          "If results are empty, respond: 'I don't have that information in the " +
          "Beebox catalog.'",
        parameters: z.object({
          query: z
            .string()
            .describe('the topic, term, or sub-question to search for'),
        }),
        execute: async ({ query }) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: query,
          });
          const hits = await index.query({
            vector: embedding,
            topK: 8,
            includeMetadata: true,
          });
          return hits.map((h) => ({
            text: (h.metadata?.text as string) ?? null,
            score: h.score ?? null,
            source: (h.metadata?.source as string) ?? null,
            sku: (h.metadata?.sku as string) ?? null,
            family: (h.metadata?.family as string) ?? null,
            legacy: (h.metadata?.legacy as string) ?? null,
            category: (h.metadata?.category as string) ?? null,
            type: (h.metadata?.type as string) ?? null,
          }));
        },
      }),
    },
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
