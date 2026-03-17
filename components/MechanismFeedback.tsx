"use client";

import ReactMarkdown from "react-markdown";

interface MechanismFeedbackProps {
  content: string;
}

export default function MechanismFeedback({ content }: MechanismFeedbackProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <ReactMarkdown
        components={{
          strong: ({ children }) => {
            const text = String(children);
            if (text.includes("Correct ✓")) {
              return (
                <strong className="text-green-600 dark:text-green-400">
                  {children}
                </strong>
              );
            }
            if (text.includes("Incorrect ✗")) {
              return (
                <strong className="text-red-600 dark:text-red-400">
                  {children}
                </strong>
              );
            }
            if (text.includes("Partially Correct ⚠")) {
              return (
                <strong className="text-yellow-600 dark:text-yellow-400">
                  {children}
                </strong>
              );
            }
            return <strong>{children}</strong>;
          },
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-4 mb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="my-1 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1 space-y-0.5">{children}</ol>
          ),
          p: ({ children }) => <p className="my-1.5">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
