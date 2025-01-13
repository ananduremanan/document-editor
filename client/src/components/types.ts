export interface DocxResponse {
  document: string;
  styles: string;
  relations: Record<string, string>;
}

export interface ParagraphContent {
  id: string;
  segments: TextSegment[];
  style?: string;
  alignment?: string;
  page?: any;
}

export interface TextSegment {
  id: string;
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  style?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export interface StyleDefinition {
  id: string;
  name: string;
  basedOn?: string | null | undefined;
  properties: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    alignment?: string;
    spacing?: {
      before?: number;
      after?: number;
      line?: number;
    };
  };
}

export interface FileContent {
  id: string;
  name: string;
  document: Document | null;
  editableContent: ParagraphContent[];
}
