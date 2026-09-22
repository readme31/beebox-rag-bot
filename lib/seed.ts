/**
 * Seed Upstash Vector with pre-chunked product cards from data/chunks.jsonl.
 *
 * Run once before starting the chat:
 *   npm run seed
 *
 * Re-run any time you replace data/chunks.jsonl.
 * The index is reset first so stale chunk ids are removed.
 */
import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import { Index } from '@upstash/vector';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const JSONL_PATH = path.join(process.cwd(), 'data', 'chunks.jsonl');

type Chunk = {
  text: string;
  metadata: Record<string, unknown>;
};

/**
 * Each JSONL line is already one complete product card. Do not split it.
 */
async function loadChunks(filePath: string): Promise<Chunk[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const chunks: Chunk[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const parsed = JSON.parse(trimmed) as {
      text: string;
      metadata?: Record<string, unknown>;
    };
    chunks.push({
      text: parsed.text,
      metadata: parsed.metadata ?? {},
    });
  }
  return chunks;
}

async function main() {
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    console.error('Missing UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN. Set them in .env.');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env.');
    process.exit(1);
  }

  const index = new Index();
  console.log('Resetting Upstash Vector index…');
  await index.reset();

  console.log('Reading data/chunks.jsonl…');
  const chunks = await loadChunks(JSONL_PATH);
  console.log(`Read ${chunks.length} chunks`);

  console.log('Embedding…');
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks.map((c) => c.text),
  });

  const records = chunks.map((c, i) => ({
    id: `chunk_${i}`,
    vector: embeddings[i],
    metadata: { text: c.text, ...c.metadata },
  }));

  console.log(`Upserting ${records.length} chunks to Upstash Vector…`);
  // Upstash supports up to 1000 vectors per upsert; chunk if needed.
  const BATCH = 100;
  for (let i = 0; i < records.length; i += BATCH) {
    await index.upsert(records.slice(i, i + BATCH));
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
