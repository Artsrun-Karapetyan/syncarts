import type { ResponseTab } from './responseTypes';

interface ResponseHeaderTabProps {
  id: ResponseTab;
  label: string;
  activeTab: ResponseTab;
  onChange: (tab: ResponseTab) => void;
  badge?: number | string;
}

export function ResponseHeaderTab(props: ResponseHeaderTabProps) {
  const { id, label, activeTab, onChange, badge } = props;
  return (
    <button
      type="button"
      className={`tab-button ${activeTab === id ? 'active' : ''}`}
      onClick={() => onChange(id)}
      style={{ padding: '6px 14px', fontSize: 12 }}
    >
      {label}
      {badge !== undefined && <span className="tab-badge">{badge}</span>}
    </button>
  );
}
