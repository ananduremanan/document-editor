import { useState, useCallback } from "react";
import { StyleDefinition } from "../types";

export const useStyles = () => {
  const [styles, setStyles] = useState<Map<string, StyleDefinition>>(new Map());

  const parseStyles = useCallback((stylesXml: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(stylesXml, "text/xml");

    // Define the namespaces used in DOCX files
    const wordmlNamespace =
      "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    // Helper function to get elements with namespace
    const getElementByTagNameNS = (element: Element, tagName: string) => {
      return element.getElementsByTagNameNS(wordmlNamespace, tagName);
    };

    // Helper function to get attribute with namespace
    const getAttributeNS = (element: Element, attrName: string) => {
      return element.getAttributeNS(wordmlNamespace, attrName);
    };

    const styleElements = doc.getElementsByTagNameNS(wordmlNamespace, "style");
    const stylesMap = new Map<string, StyleDefinition>();

    Array.from(styleElements).forEach((style) => {
      const styleId =
        getAttributeNS(style, "styleId") || style.getAttribute("w:styleId");
      if (!styleId) return;

      const nameElement = getElementByTagNameNS(style, "name")[0];
      const basedOnElement = getElementByTagNameNS(style, "basedOn")[0];

      const styleDef: StyleDefinition = {
        id: styleId,
        name:
          nameElement?.getAttributeNS(wordmlNamespace, "val") ||
          nameElement?.getAttribute("w:val") ||
          styleId,
        basedOn:
          basedOnElement?.getAttributeNS(wordmlNamespace, "val") ||
          basedOnElement?.getAttribute("w:val"),
        properties: {},
      };

      // Parse style properties
      const rPr = getElementByTagNameNS(style, "rPr")[0];
      const pPr = getElementByTagNameNS(style, "pPr")[0];

      if (rPr) {
        // Character properties
        styleDef.properties.bold = getElementByTagNameNS(rPr, "b").length > 0;
        styleDef.properties.italic = getElementByTagNameNS(rPr, "i").length > 0;
        styleDef.properties.underline =
          getElementByTagNameNS(rPr, "u").length > 0;

        const szElement = getElementByTagNameNS(rPr, "sz")[0];
        if (szElement) {
          const sz =
            szElement.getAttributeNS(wordmlNamespace, "val") ||
            szElement.getAttribute("w:val");
          if (sz) {
            styleDef.properties.fontSize = parseInt(sz) / 2;
          }
        }

        const rFontsElement = getElementByTagNameNS(rPr, "rFonts")[0];
        if (rFontsElement) {
          const fontFamily =
            rFontsElement.getAttributeNS(wordmlNamespace, "ascii") ||
            rFontsElement.getAttribute("w:ascii");
          if (fontFamily) {
            styleDef.properties.fontFamily = fontFamily;
          }
        }

        const colorElement = getElementByTagNameNS(rPr, "color")[0];
        if (colorElement) {
          const color =
            colorElement.getAttributeNS(wordmlNamespace, "val") ||
            colorElement.getAttribute("w:val");
          if (color) {
            styleDef.properties.color = `#${color}`;
          }
        }
      }

      if (pPr) {
        const jcElement = getElementByTagNameNS(pPr, "jc")[0];
        if (jcElement) {
          const jc =
            jcElement.getAttributeNS(wordmlNamespace, "val") ||
            jcElement.getAttribute("w:val");
          if (jc) {
            styleDef.properties.alignment = jc;
          }
        }

        const spacingElement = getElementByTagNameNS(pPr, "spacing")[0];
        if (spacingElement) {
          styleDef.properties.spacing = {
            before: parseInt(
              spacingElement.getAttributeNS(wordmlNamespace, "before") ||
                spacingElement.getAttribute("w:before") ||
                "0"
            ),
            after: parseInt(
              spacingElement.getAttributeNS(wordmlNamespace, "after") ||
                spacingElement.getAttribute("w:after") ||
                "0"
            ),
            line: parseInt(
              spacingElement.getAttributeNS(wordmlNamespace, "line") ||
                spacingElement.getAttribute("w:line") ||
                "0"
            ),
          };
        }
      }

      stylesMap.set(styleId, styleDef);
    });

    setStyles(stylesMap);
    return stylesMap;
  }, []);

  const getComputedStyle = useCallback(
    (styleId: string): StyleDefinition["properties"] => {
      const computedStyle: StyleDefinition["properties"] = {};
      const style = styles.get(styleId);

      if (!style) return computedStyle;

      // Inherit from base style if exists
      if (style.basedOn) {
        Object.assign(computedStyle, getComputedStyle(style.basedOn));
      }

      // Override with current style properties
      Object.assign(computedStyle, style.properties);

      return computedStyle;
    },
    [styles]
  );

  return { styles, parseStyles, getComputedStyle };
};
