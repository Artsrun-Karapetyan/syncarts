interface Item {
  id?: string;
  key?: string;
  value?: string;
  enabled?: boolean;
}

interface TableDiffViewProps {
  oldItems?: Item[];
  newItems?: Item[];
}

export function TableDiffView({
  oldItems = [],
  newItems = [],
}: TableDiffViewProps) {
  // We match items by ID if possible, otherwise by key
  const allKeys = new Set<string>();
  const oldMap = new Map<string, Item>();
  const newMap = new Map<string, Item>();

  oldItems.forEach((item) => {
    const k = item.id || item.key;
    if (k) {
      allKeys.add(k);
      oldMap.set(k, item);
    }
  });

  newItems.forEach((item) => {
    const k = item.id || item.key;
    if (k) {
      allKeys.add(k);
      newMap.set(k, item);
    }
  });

  const rows = Array.from(allKeys)
    .map((k) => {
      const oldItem = oldMap.get(k);
      const newItem = newMap.get(k);

      let status: "added" | "removed" | "modified" | "unchanged" = "unchanged";
      if (!oldItem && newItem) status = "added";
      else if (oldItem && !newItem) status = "removed";
      else if (
        oldItem?.key !== newItem?.key ||
        oldItem?.value !== newItem?.value ||
        oldItem?.enabled !== newItem?.enabled
      ) {
        status = "modified";
      }

      return { oldItem, newItem, status, rowKey: k };
    })
    .filter((row) => row.status !== "unchanged");

  if (rows.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: 12 }}>
        No changes in this table.
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--border-color)",
        background: "var(--bg-primary)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          textAlign: "left",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
            }}
          >
            <th style={{ padding: "8px 12px", fontWeight: 600, width: 30 }} />
            <th style={{ padding: "8px 12px", fontWeight: 600, width: "20%" }}>
              Key
            </th>
            <th style={{ padding: "8px 12px", fontWeight: 600, width: "35%" }}>
              Old Value
            </th>
            <th style={{ padding: "8px 12px", fontWeight: 600, width: "35%" }}>
              New Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            let bgColor = "transparent";
            let symbol = " ";
            let color = "var(--text-primary)";

            if (row.status === "added") {
              bgColor = "rgba(0, 255, 170, 0.05)";
              color = "#00ffaa";
              symbol = "+";
            } else if (row.status === "removed") {
              bgColor = "rgba(255, 80, 80, 0.05)";
              color = "#ff5050";
              symbol = "-";
            } else if (row.status === "modified") {
              bgColor = "rgba(255, 170, 0, 0.05)";
              color = "#ffaa00";
              symbol = "~";
            }

            const itemToDisplay = row.newItem || row.oldItem!;

            return (
              <tr
                key={row.rowKey}
                style={{
                  background: bgColor,
                  borderBottom:
                    i < rows.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                }}
              >
                <td style={{ padding: "8px 12px", color, fontWeight: 800 }}>
                  {symbol}
                </td>
                <td
                  style={{ padding: "8px 12px", color: "var(--text-primary)" }}
                >
                  {itemToDisplay.key || (
                    <span style={{ opacity: 0.3 }}>Empty</span>
                  )}
                  {itemToDisplay.enabled === false && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        background: "var(--bg-secondary)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        color: "var(--text-tertiary)",
                      }}
                    >
                      DISABLED
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    color:
                      row.status === "added"
                        ? "var(--text-tertiary)"
                        : "var(--text-secondary)",
                  }}
                >
                  {row.oldItem
                    ? row.oldItem.value || (
                        <span style={{ opacity: 0.3 }}>Empty</span>
                      )
                    : "-"}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    color:
                      row.status === "removed"
                        ? "var(--text-tertiary)"
                        : "var(--text-primary)",
                  }}
                >
                  {row.newItem
                    ? row.newItem.value || (
                        <span style={{ opacity: 0.3 }}>Empty</span>
                      )
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
