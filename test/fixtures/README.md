# Test Fixtures

This directory contains test fixture files used by the test suite.

## package-managers.json

Contains the list of supported package managers for testing purposes. This file should be kept in sync with the `PACKAGE_MANAGERS` constant in `src/lib/pm.ts`.

**Note**: This file is used as a fallback when the compiled `dist/lib/pm.js` is not available. Update this file whenever the list of supported package managers changes in the source code.
