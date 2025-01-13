import React from "react";
import { FileContent } from "./types";

interface FileListProps {
  files: FileContent[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  activeFileId,
  onFileSelect,
}) => {
  return (
    <div className="border-r border-gray-200 p-4 w-64">
      <h2 className="font-semibold mb-4">Files</h2>
      <div className="space-y-2">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            className={`w-full text-left px-3 py-2 rounded ${
              activeFileId === file.id
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileList;
