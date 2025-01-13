package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

type DocContent struct {
	Document  string            `json:"document"`
	Styles    string            `json:"styles"`
	Relations map[string]string `json:"relations"`
}

func main() {
	http.HandleFunc("/process-docx", corsMiddleware(handleDocxUpload))
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// corsMiddleware adds CORS headers to the response.
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight request for OPTIONS method
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next(w, r)
	}
}

func handleDocxUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the multipart form data (max 10MB)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("docx")
	if err != nil {
		http.Error(w, "Failed to get file from form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read the file into memory
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	// Process the DOCX file
	content, err := processDocx(fileBytes)
	if err != nil {
		http.Error(w, "Failed to process DOCX: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(content)
}

func processDocx(fileBytes []byte) (*DocContent, error) {
	// Create a reader for the zip file
	reader, err := zip.NewReader(bytes.NewReader(fileBytes), int64(len(fileBytes)))
	if err != nil {
		return nil, err
	}

	content := &DocContent{
		Relations: make(map[string]string),
	}

	// Process each file in the zip
	for _, file := range reader.File {
		switch {
		case file.Name == "word/document.xml":
			content.Document, err = readZipFile(file)
		case file.Name == "word/styles.xml":
			content.Styles, err = readZipFile(file)
		case strings.HasPrefix(file.Name, "word/_rels/") && strings.HasSuffix(file.Name, ".rels"):
			// Handle relationship files
			relContent, err := readZipFile(file)
			if err != nil {
				continue
			}
			content.Relations[filepath.Base(file.Name)] = relContent
		}

		if err != nil {
			return nil, err
		}
	}

	return content, nil
}

func readZipFile(file *zip.File) (string, error) {
	rc, err := file.Open()
	if err != nil {
		return "", err
	}
	defer rc.Close()

	content, err := io.ReadAll(rc)
	if err != nil {
		return "", err
	}

	return string(content), nil
}
