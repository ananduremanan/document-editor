import React, { useCallback } from "react";
import { StyleDefinition, TextSegment } from "./types";

interface TextSegmentEditorProps {
  segment: TextSegment;
  style: StyleDefinition["properties"];
  onTextChange: (newText: string) => void;
}

export const TextSegmentEditor: React.FC<TextSegmentEditorProps> = React.memo(
  ({ segment, style, onTextChange }) => {
    const handleInput = useCallback(
      (e: React.FormEvent<HTMLSpanElement>) => {
        onTextChange(e.currentTarget.textContent || "");
      },
      [onTextChange]
    );

    return (
      <span
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          fontFamily: style.fontFamily,
          fontSize: style.fontSize ? `${style.fontSize}pt` : undefined,
          fontWeight: segment.bold || style.bold ? "bold" : "normal",
          fontStyle: segment.italic || style.italic ? "italic" : "normal",
          textDecoration:
            [
              segment.underline || style.underline ? "underline" : "",
              segment.strike ? "line-through" : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined,
          color: style.color,
          outline: "none",
          padding: "0 2px",
          borderRadius: "2px",
          transition: "background-color 0.2s",
        }}
      >
        {segment.text}
      </span>
    );
  }
);
