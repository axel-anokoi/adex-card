"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 20, 30];

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  if (total === 0) return null;

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => Math.abs(i - page) <= 2
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        padding: "12px 0",
        borderTop: "1px solid var(--border)",
        marginTop: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {from}–{to} sur {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(0);
          }}
          style={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text)",
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <PagBtn onClick={() => onPageChange(0)} disabled={page === 0}>
          «
        </PagBtn>
        <PagBtn onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          ‹
        </PagBtn>

        {visiblePages[0] > 0 && (
          <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "0 4px" }}>…</span>
        )}

        {visiblePages.map((i) => (
          <PagBtn key={i} onClick={() => onPageChange(i)} active={i === page}>
            {i + 1}
          </PagBtn>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
          <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "0 4px" }}>…</span>
        )}

        <PagBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>
          ›
        </PagBtn>
        <PagBtn onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1}>
          »
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32,
        height: 32,
        borderRadius: 8,
        border: `1px solid ${active ? "var(--cyan, #00ffe0)" : "var(--border)"}`,
        background: active ? "var(--cyan, #00ffe0)" : "transparent",
        color: active ? "#000" : disabled ? "var(--text-muted)" : "var(--text)",
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "all 0.15s",
        padding: "0 8px",
      }}
    >
      {children}
    </button>
  );
}
