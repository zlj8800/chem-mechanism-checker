import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import MechanismFeedback from "@/components/MechanismFeedback";

jest.mock("react-markdown", () => {
  return {
    __esModule: true,
    default: function MockReactMarkdown({
      children,
      components,
    }: {
      children: string;
      components?: Record<string, React.FC<{ children?: React.ReactNode }>>;
    }) {
      const lines = children.split("\n").filter(Boolean);
      return (
        <div data-testid="markdown">
          {lines.map((line, i) => {
            const boldMatches = [...line.matchAll(/\*\*(.+?)\*\*/g)];
            if (boldMatches.length > 0 && components?.strong) {
              const Strong = components.strong;
              const parts: React.ReactNode[] = [];
              let lastIdx = 0;
              for (const match of boldMatches) {
                const idx = match.index!;
                if (idx > lastIdx) {
                  parts.push(line.slice(lastIdx, idx));
                }
                parts.push(
                  <Strong key={idx}>{match[1]}</Strong>
                );
                lastIdx = idx + match[0].length;
              }
              if (lastIdx < line.length) {
                parts.push(line.slice(lastIdx));
              }
              return <p key={i}>{parts}</p>;
            }
            if (line.startsWith("- ")) {
              return <li key={i}>{line.slice(2)}</li>;
            }
            if (/^\d+\.\s/.test(line)) {
              return <li key={i}>{line.replace(/^\d+\.\s/, "")}</li>;
            }
            return <p key={i}>{line}</p>;
          })}
        </div>
      );
    },
  };
});

describe("MechanismFeedback", () => {
  it("renders markdown content", () => {
    render(<MechanismFeedback content="This is a **bold** test" />);
    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("renders mechanism type in line", () => {
    render(
      <MechanismFeedback content="**Mechanism Type**: SN2 Reaction" />
    );
    expect(screen.getByText(/SN2 Reaction/)).toBeInTheDocument();
  });

  it("applies green color to Correct verdict", () => {
    render(<MechanismFeedback content="**Correct ✓**" />);
    const el = screen.getByText("Correct ✓");
    expect(el.className).toContain("text-green");
  });

  it("applies red color to Incorrect verdict", () => {
    render(<MechanismFeedback content="**Incorrect ✗**" />);
    const el = screen.getByText("Incorrect ✗");
    expect(el.className).toContain("text-red");
  });

  it("applies yellow color to Partially Correct verdict", () => {
    render(<MechanismFeedback content="**Partially Correct ⚠**" />);
    const el = screen.getByText("Partially Correct ⚠");
    expect(el.className).toContain("text-yellow");
  });

  it("renders unordered list items from markdown", () => {
    const content =
      "- Error 1: Wrong arrow direction\n- Error 2: Missing lone pair";
    render(<MechanismFeedback content={content} />);
    expect(screen.getByText(/Wrong arrow direction/)).toBeInTheDocument();
    expect(screen.getByText(/Missing lone pair/)).toBeInTheDocument();
  });

  it("renders numbered list items", () => {
    const content =
      "1. Step one: Nucleophile attacks\n2. Step two: Leaving group departs";
    render(<MechanismFeedback content={content} />);
    expect(screen.getByText(/Nucleophile attacks/)).toBeInTheDocument();
    expect(screen.getByText(/Leaving group departs/)).toBeInTheDocument();
  });
});
