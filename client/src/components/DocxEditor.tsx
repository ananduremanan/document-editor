import React, { useState, useCallback } from "react";
import { useStyles } from "./hooks/useStyles";
import { TextSegmentEditor } from "./TextSegmentEditor";
import FileList from "./FileList";
import { DocxResponse, FileContent, TextSegment } from "./types";

const DocxEditor: React.FC = () => {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { parseStyles, getComputedStyle } = useStyles();

  const convertDocumentToEditableContent = useCallback((doc: Document) => {
    const body = doc.getElementsByTagName("w:body")[0];
    if (!body) return [];

    const paragraphs = body.getElementsByTagName("w:p");
    return Array.from(paragraphs).map((paragraph) => {
      const runs = paragraph.getElementsByTagName("w:r");
      const segments: TextSegment[] = Array.from(runs).map((run) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: run.getElementsByTagName("w:t")[0]?.textContent || "",
        bold: run.getElementsByTagName("w:b").length > 0,
        italic: run.getElementsByTagName("w:i").length > 0,
        underline: run.getElementsByTagName("w:u").length > 0,
        strike: run.getElementsByTagName("w:strike").length > 0,
      }));

      return {
        id: Math.random().toString(36).substr(2, 9),
        segments,
        style: paragraph.getAttribute("w:pStyle") || undefined,
      };
    });
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    setLoading(true);
    setError(null);

    try {
      const newFiles: FileContent[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();
        formData.append("docx", file);

        const response = await fetch("http://localhost:8080/process-docx", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to process ${file.name}: ${response.statusText}`
          );
        }

        const data: DocxResponse = await response.json();

        // Parse document
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.document, "text/xml");

        // Parse styles
        parseStyles(data.styles);

        const fileId = Math.random().toString(36).substr(2, 9);
        const editableContent = convertDocumentToEditableContent(xmlDoc);

        newFiles.push({
          id: fileId,
          name: file.name,
          document: xmlDoc,
          editableContent,
        });
      }

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      if (!activeFileId && newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentChange = useCallback(
    (
      fileId: string,
      paragraphId: string,
      segmentId: string,
      newText: string
    ) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                editableContent: file.editableContent.map((paragraph) =>
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
                ),
              }
            : file
        )
      );
    },
    []
  );

  const renderFileContent = useCallback(
    (file: FileContent) => {
      return file.editableContent.map((paragraph: any) => {
        const paragraphStyle = paragraph.style
          ? getComputedStyle(paragraph.style)
          : {};

        return (
          <div
            key={paragraph.id}
            className="min-h-6 p-1 rounded transition-colors hover:bg-gray-50"
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
            {paragraph.segments.map((segment: any) => (
              <TextSegmentEditor
                key={segment.id}
                segment={segment}
                style={segment.style ? getComputedStyle(segment.style) : {}}
                onTextChange={(newText) =>
                  handleSegmentChange(
                    file.id,
                    paragraph.id,
                    segment.id,
                    newText
                  )
                }
              />
            ))}
          </div>
        );
      });
    },
    [getComputedStyle, handleSegmentChange]
  );

  const activeFile = files.find((file) => file.id === activeFileId);

  return (
    <div className="flex h-screen bg-gray-50">
      <FileList
        files={files}
        activeFileId={activeFileId}
        onFileSelect={setActiveFileId}
      />

      <div className="flex-1 p-6">
        <div className="mb-6">
          <input
            type="file"
            accept=".docx"
            multiple
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {loading && <div className="text-center p-4">Loading documents...</div>}

        {error && <div className="text-red-500 p-4">Error: {error}</div>}

        <div className="w-full bg-white rounded-lg shadow p-6">
          {activeFile ? (
            renderFileContent(activeFile)
          ) : (
            <div className="text-center text-gray-500">
              No file selected or upload a new document
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocxEditor;
