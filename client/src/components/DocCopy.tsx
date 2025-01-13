import React, { useState, useEffect, useCallback } from "react";
import { useStyles } from "./hooks/useStyles";
import { TextSegmentEditor } from "./TextSegmentEditor";
import { DocxResponse, ParagraphContent, TextSegment } from "./types";

const DocxEditor: React.FC = () => {
  const [document, setDocument] = useState<Document | null>(null);
  const [editableContent, setEditableContent] = useState<ParagraphContent[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { parseStyles, getComputedStyle } = useStyles();

  const convertDocumentToEditableContent = useCallback((doc: Document) => {
    const body = doc.getElementsByTagName("w:body")[0];
    if (!body) return;

    const paragraphs = body.getElementsByTagName("w:p");
    const content: ParagraphContent[] = [];
    let currentPage = 1;

    Array.from(paragraphs).forEach((paragraph) => {
      const runs = paragraph.getElementsByTagName("w:r");
      const pageBreaks = paragraph.getElementsByTagName("w:br");

      // Check for manual page breaks
      const hasPageBreak = Array.from(pageBreaks).some(
        (br) => br.getAttribute("w:type") === "page"
      );
      if (hasPageBreak) currentPage++;

      const segments: TextSegment[] = Array.from(runs).map((run) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: run.getElementsByTagName("w:t")[0]?.textContent || "",
        bold: run.getElementsByTagName("w:b").length > 0,
        italic: run.getElementsByTagName("w:i").length > 0,
        underline: run.getElementsByTagName("w:u").length > 0,
        strike: run.getElementsByTagName("w:strike").length > 0,
      }));

      content.push({
        id: Math.random().toString(36).substr(2, 9),
        segments,
        style: paragraph.getAttribute("w:pStyle") || undefined,
        page: currentPage,
      });
    });

    setEditableContent(content);
  }, []);

  useEffect(() => {
    if (document) {
      convertDocumentToEditableContent(document);
    }
  }, [document, convertDocumentToEditableContent]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("docx", file);

      const response = await fetch("http://localhost:8080/process-docx", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process document: ${response.statusText}`);
      }

      const data: DocxResponse = await response.json();

      // Parse document
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.document, "text/xml");
      setDocument(xmlDoc);

      // Parse styles
      parseStyles(data.styles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentChange = useCallback(
    (paragraphId: string, segmentId: string, newText: string) => {
      setEditableContent((prevContent) =>
        prevContent.map((paragraph) =>
          paragraph.id === paragraphId
            ? {
                ...paragraph,
                segments: paragraph.segments.map((segment) =>
                  segment.id === segmentId
                    ? { ...segment, text: newText }
                    : segment
                ),
              }
            : paragraph
        )
      );
    },
    []
  );

  const renderEditableContent = useCallback(() => {
    return editableContent.map((paragraph) => {
      const paragraphStyle = paragraph.style
        ? getComputedStyle(paragraph.style)
        : {};

      return (
        <div
          key={paragraph.id}
          className="min-h-[1.5em] p-1 rounded transition-colors hover:bg-gray-50"
          style={{
            marginTop: paragraphStyle.spacing?.before
              ? `${paragraphStyle.spacing.before / 20}pt`
              : undefined,
            marginBottom: paragraphStyle.spacing?.after
              ? `${paragraphStyle.spacing.after / 20}pt`
              : undefined,
            lineHeight: paragraphStyle.spacing?.line
              ? `${paragraphStyle.spacing.line / 240}`
              : undefined,
            textAlign: paragraphStyle.alignment as any,
          }}
        >
          {paragraph.segments.map((segment) => (
            <TextSegmentEditor
              key={segment.id}
              segment={segment}
              style={segment.style ? getComputedStyle(segment.style) : {}}
              onTextChange={(newText) =>
                handleSegmentChange(paragraph.id, segment.id, newText)
              }
            />
          ))}
        </div>
      );
    });
  }, [editableContent, getComputedStyle, handleSegmentChange]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <input
          type="file"
          accept=".docx"
          onChange={handleFileUpload}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {loading && <div className="text-center p-4">Loading document...</div>}

      {error && <div className="text-red-500 p-4">Error: {error}</div>}

      <div className="w-full">{renderEditableContent()}</div>
    </div>
  );
};

export default DocxEditor;
