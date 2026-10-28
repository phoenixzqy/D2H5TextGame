export interface UnitTestBoundaryAudit {
  testFiles: string[];
  files: string[];
  errors: string[];
}
/** Inspect source bytes without importing repository modules. */
export function auditUnitTestBoundary(root: string): UnitTestBoundaryAudit;
/** Throw before default Vitest discovery when the source boundary is unresolved. */
export function assertUnitTestBoundary(root: string): UnitTestBoundaryAudit;
