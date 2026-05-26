// Local verification for the server-side watermark. Runs the real
// applyWatermark() (same code the edge function uses) on a sample portrait and
// writes the result so it can be eyeballed.
//
//   deno run --allow-read --allow-write scripts/test-watermark.ts [input.jpg] [output.jpg]

import { applyWatermark } from '../supabase/functions/_shared/watermark.ts';

const input = Deno.args[0] ?? './marketing-samples/01-watercolor-sunrise.jpg';
const output = Deno.args[1] ?? './marketing-samples/_watermark-test-output.jpg';

const bytes = await Deno.readFile(input);
const start = Date.now();
const out = await applyWatermark(bytes);
await Deno.writeFile(output, out);

console.log(`input:  ${input} (${bytes.length} bytes)`);
console.log(`output: ${output} (${out.length} bytes)`);
console.log(`watermark applied in ${Date.now() - start}ms`);
