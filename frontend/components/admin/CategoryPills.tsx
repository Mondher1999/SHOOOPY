"use client";

/**
 * Admin category filter pills — Polaris style.
 * Active = primary color (green), Inactive = white with border.
 * Uses CSS variables so colors auto-switch in dark mode.
 */

interface CategoryPillsProps {
  categories: { id: string; name: string }[];
  activeId: string;
  allLabel: string;
  onChange: (id: string) => void;
}

const baseStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  fontSize: "13px",
  fontWeight: 500,
  borderRadius: "9999px",
  cursor: "pointer",
  userSelect: "none",
  transition: "background-color 0.15s, border-color 0.15s",
  lineHeight: "20px",
};

const activeStyle: React.CSSProperties = {
  ...baseStyle,
  background: "hsl(var(--primary))",
  backgroundColor: "hsl(var(--primary))",
  color: "hsl(var(--primary-foreground))",
  border: "1px solid hsl(var(--primary))",
};

const inactiveStyle: React.CSSProperties = {
  ...baseStyle,
  background: "hsl(var(--card))",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  border: "1px solid #C9CCCF",
};

export function CategoryPills({ categories, activeId, allLabel, onChange }: CategoryPillsProps) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "12px 16px" }}>
      <span
        role="button"
        tabIndex={0}
        style={activeId === "" ? activeStyle : inactiveStyle}
        onClick={() => onChange("")}
        onKeyDown={(e) => e.key === "Enter" && onChange("")}
      >
        {allLabel}
      </span>
      {categories.map((cat) => (
        <span
          key={cat.id}
          role="button"
          tabIndex={0}
          style={activeId === cat.id ? activeStyle : inactiveStyle}
          onClick={() => onChange(cat.id)}
          onKeyDown={(e) => e.key === "Enter" && onChange(cat.id)}
        >
          {cat.name}
        </span>
      ))}
    </div>
  );
}
