import type { TestResult } from '../../contexts/WorkspaceContext';

interface ResponseTestResultsProps {
  testResults?: TestResult[];
  consoleLogs?: string[];
}

export function ResponseTestResults({ testResults, consoleLogs }: ResponseTestResultsProps) {
  return (
    <div style={{ padding: 16 }}>
      {(!testResults?.length && !consoleLogs?.length) && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
          No test results or console logs.
        </div>
      )}

      {!!testResults?.length && (
        <div style={{ marginBottom: 24 }}>
          <div className="response-section-title">Test Results</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {testResults.map((test, idx) => (
              <div key={idx} className="response-test-row">
                <div style={{ color: test.passed ? 'var(--status-success)' : 'var(--status-error)', marginTop: 2 }}>
                  {test.passed ? '✓' : '✗'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{test.name}</div>
                  {!test.passed && test.error && <div className="response-test-error">{test.error}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!consoleLogs?.length && (
        <div>
          <div className="response-section-title">Console Output</div>
          <div className="response-console-output">
            {consoleLogs.map((log, idx) => {
              const isError = log.includes('[ERROR]') || log.includes('[SCRIPT ERROR]');
              const isWarn = log.includes('[WARN]');
              return (
                <div
                  key={idx}
                  style={{
                    color: isError ? 'var(--status-error)' : isWarn ? 'var(--status-warning)' : 'inherit',
                    padding: '2px 0',
                    borderBottom: idx < consoleLogs.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  {log}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
