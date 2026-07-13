import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers as Parameters<typeof expect.extend>[0]);

// Clean up DOM after each test (required when globals:false)
afterEach(cleanup);
