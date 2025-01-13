
## Minimal Document Editor With GO and React

A React-based Docx Editor that allows you to upload, parse, and edit .docx files. The editor renders the document in an editable, paginated format and supports basic text formatting features like bold, italic, underline, and strikethrough.

### Features

- File Upload: Upload .docx files for processing.
- Content Parsing: Converts document content into editable - paragraphs and text segments.
- Basic Text Formatting: Supports editing text with styles like:
- Bold
- Italic
- Underline
- Strikethrough
- Paginated View: Displays content in a multi-page layout to mimic a document format.
- Real-Time Editing: Updates text dynamically as you edit.
- Responsive Design: Optimized for desktop usage with Tailwind CSS.

### Installation

```
git clone git@github.com:ananduremanan/document-editor.git
cd document-editor
```

Install Client Libraries and start

```
cd client && npm i && npm run dev
```

Start Server


```
cd server && go run main.go
```

### How to Use

- Upload a Document: Click the file input and select a .docx file to upload.
- Edit Content: Click on any paragraph or text segment to edit it directly.
- Style Text: Apply styles like bold, italic, etc., through inline controls.
- View Pages: Scroll through pages in a paginated view.

### API

#### Endpoint: POST /process-docx

Uploads and processes a .docx file on the backend.

Request:

File: Multipart form-data (docx).

Response:

document: Parsed XML content of the document.
styles: Extracted styles from the document.

### Contributing

Contributions are welcome! To contribute:

Fork the repository.

Create a feature branch:

```
git checkout -b feature/your-feature

```
Commit your changes:

```
git commit -m "Add your feature"
```

Push and open a pull request.



