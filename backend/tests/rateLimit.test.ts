import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { createLimiter } from '../src/middlewares/rateLimit.middleware.js';

describe('Limitation des tentatives', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    // Application minimale, avec une limite basse : le limiteur est testé seul.
    const app = express();
    const options = { limit: 2, skipSuccessfulRequests: true };

    app.post('/echec', createLimiter(options), (_req, res) => {
      res.status(401).json({});
    });
    app.post('/succes', createLimiter(options), (_req, res) => {
      res.status(200).json({});
    });
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  after(() => {
    server.close();
  });

  it('bloque après deux échecs (429)', async () => {
    const statuses: number[] = [];
    let code: string | undefined;

    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${baseUrl}/echec`, { method: 'POST' });
      statuses.push(res.status);
      if (res.status === 429) {
        code = ((await res.json()) as { error: { code: string } }).error.code;
      }
    }

    assert.deepEqual(statuses, [401, 401, 429]);
    assert.equal(code, 'TOO_MANY_REQUESTS');
  });

  it('ne compte pas les requêtes réussies', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/succes`, { method: 'POST' });
      assert.equal(res.status, 200);
    }
  });
});
