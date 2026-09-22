# Beebox Catalog Assistant

A RAG chatbot over the Beebox packaging catalog. Ask about SKU codes, family codes, prices, supplier codes, tier pricing, and product specs for Beebox, Trigem, Beelife, and Suki products.

Live: https://beebox-rag-bot.vercel.app

## Corpus

569 chunks generated from 5 CSVs describing the Beebox SKU system:

- SKU system reference (family codes, supplier codes, printer codes)
- Generic items catalog
- Customized items catalog
- Family code summary
- Tier definitions (quantity ranges per family)

Each chunk is a self-contained product card. Tier quantity ranges are embedded inline so retrieval works without needing a second lookup.

## Stack

- Next.js 16 with Turbopack
- Vercel AI SDK (streaming, tool calls)
- Upstash Vector (dense index, 1536 dims, cosine)
- OpenAI text-embedding-3-small for embeddings
- OpenAI gpt-4o-mini for generation

## Setup

1. npm install
2. Create .env with:
   OPENAI_API_KEY=sk-...
   UPSTASH_VECTOR_REST_URL=https://...
   UPSTASH_VECTOR_REST_TOKEN=...
   SUPPLIER_BLOCKLIST=comma-separated supplier names to block from queries
3. Place your corpus at data/chunks.jsonl (one JSON object per line)
4. npm run seed
5. npm run dev

## Demo questions

Answers well:
- What is the SKU for a customized PP cup 12oz?
- How much is a Customized PET Cup 16oz at 7,000 pcs?
- What does MBX mean in a family code?
- What is the printer code for S007?
- Show me the cheapest pizza box.

Refuses by design (supplier identity protection):
- What is the MOQ for a pollen basket from supplier S009?
- Who is S007?

Known limitation:
- What is the SKU for BBGP-380? (retrieves correct chunk, LLM confuses BBGP-38 with BBGP-380)
