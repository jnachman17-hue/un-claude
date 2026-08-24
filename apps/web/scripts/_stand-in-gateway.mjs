/**
 * A STAND-IN FOR THE AI GATEWAY, and the only thing in these tests that is not
 * the real code.
 *
 * Added 24 August 2026, route session. `WATERMARKS_REWRITE_API_KEY` is not in
 * this machine's environment, so a real rewrite cannot be run here. Everything
 * else in the cost-leak test IS real: the real Python engine, its real chunker,
 * its real `accumulate_usage`, the real Next route, the real credits code and
 * the real database. Only the model at the far end is this file.
 *
 * IT SPEAKS THE OPENAI-COMPATIBLE SHAPE the Vercel AI Gateway speaks, and it
 * answers with the usage block from a REAL PRODUCTION RUN, the one Lane A
 * captured and wrote up as E-12:
 *
 *   prompt_tokens 813, completion_tokens 49, total_tokens 862, cost 9.6e-05
 *
 * so the figures the test is checking for are the figures that actually leaked.
 *
 * The "rewrite" it returns is the customer's text unchanged. That is not a
 * rewrite and is not pretending to be one: this test is about where the cost
 * figures go, not about what the model writes.
 */
import { createServer } from 'node:http';

export const REAL_RUN_USAGE = {
  prompt_tokens: 813,
  completion_tokens: 49,
  total_tokens: 862,
  cost: 9.6e-5,
};

export function standInGateway(port = 8799) {
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let text = '';
      try {
        const sent = JSON.parse(body);
        const user = [...(sent.messages ?? [])].reverse().find((m) => m.role === 'user');
        text = user?.content ?? '';
      } catch {
        text = '';
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          id: 'stand-in',
          object: 'chat.completion',
          choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
          usage: REAL_RUN_USAGE,
        }),
      );
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8799);
  await standInGateway(port);
  console.log(`stand-in gateway listening on http://127.0.0.1:${port}`);
}
