"use client";

interface StatusLogProps {
  entries: string[];
}

function getEntryStyle(entry: string, isLatest: boolean) {
  if (entry.includes("!! ")) {
    return "text-red-500 dark:text-red-400";
  }
  if (entry.includes("?  ")) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  if (entry.includes("+  ")) {
    return "text-green-600 dark:text-green-400";
  }
  return isLatest ? "text-foreground/70" : "text-muted-foreground/50";
}

export default function StatusLog({ entries }: StatusLogProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-0.5 font-mono">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`text-xs ${getEntryStyle(entry, i === entries.length - 1)}`}
        >
          {entry}
        </div>
      ))}
    </div>
  );
}
