interface RenameableNameProps {
  isRenaming: boolean;
  value: string;
  setValue: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  name: string;
}

export function RenameableName({ isRenaming, value, setValue, onSubmit, onCancel, name }: RenameableNameProps) {
  if (!isRenaming) return <span style={{ whiteSpace: 'nowrap', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>;

  return (
    <input
      autoFocus
      className="input"
      style={{ fontSize: 13, flex: 1, padding: '2px 6px', margin: '-2px -6px' }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit();
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={onSubmit}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
