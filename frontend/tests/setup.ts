import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Retire les composants montés entre deux tests (sans effet dans les tests Node).
afterEach(() => {
  cleanup();
});
