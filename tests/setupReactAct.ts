// Silences "not configured to support act(...)" noise in the .tsx
// integration tests (tests/integration-*.test.tsx) that render real
// React components in jsdom. Harmless no-op for the plain .ts unit
// tests, which never touch React.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
