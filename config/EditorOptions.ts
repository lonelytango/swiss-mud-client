// config/EditorOptions.ts
// Options for the Monaco Editor.

import { editor } from 'monaco-editor';

const EditorOptions: editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'off',
  wordWrap: 'on',
  lineHeight: 20,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  inlayHints: { enabled: 'off' },
  lineDecorationsWidth: 0,
};

export default EditorOptions;
