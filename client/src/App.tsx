// import DocxEditor from "./components/DocxEditor";
import "./App.css";
import DocxEditor from "./components/DocCopy";

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DOCX Editor</h1>
      <DocxEditor />
    </div>
  );
}

export default App;
