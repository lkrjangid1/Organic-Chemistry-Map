import katex from 'katex';
import 'katex/contrib/mhchem';

/** Renders an mhchem expression (without the \ce{} wrapper) to HTML+MathML. */
export const renderCe = (ce: string, displayMode = false) =>
  katex.renderToString(`\\ce{${ce}}`, {
    displayMode,
    output: 'htmlAndMathml',
    throwOnError: false,
    strict: 'ignore',
  });
