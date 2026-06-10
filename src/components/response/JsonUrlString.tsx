import JsonView from '@uiw/react-json-view';

const URL_PATTERN = /^https?:\/\/\S+$/i;

export function JsonUrlString() {
  return (
    <JsonView.String
      render={({ children, className, ...reset }: any, { type, value }: any) => {
        if (type !== 'value' || typeof value !== 'string' || !URL_PATTERN.test(value)) return undefined;

        return (
          <>
            <span className="w-rjv-quotes">"</span>
            <span
              {...reset}
              className={`${className || ''} response-json-link`}
              data-url={value}
              data-tooltip={`Follow link (${getShortcutLabel()} + click)`}
              title={`Follow link (${getShortcutLabel()} + click)`}
            >
              {children}
            </span>
            <span className="w-rjv-quotes">"</span>
          </>
        );
      }}
    />
  );
}

function getShortcutLabel() {
  if (typeof navigator === 'undefined') return 'cmd/ctrl';
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? 'cmd' : 'ctrl';
}
