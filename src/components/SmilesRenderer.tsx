import { useEffect, useState } from 'react';
import { useTheme } from '../theme';

/**
 * Dedicated component for rendering SMILES molecular structures
 * Handles SMILES Drawer library integration and error handling
 */

interface SmilesRendererProps {
  smiles: string;
  width?: number;
  height?: number;
  className?: string;
}

const SmilesRenderer = ({
  smiles,
  width = 150,
  height = 100,
  className = ""
}: SmilesRendererProps) => {
  const { tokens } = useTheme();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const renderMolecule = async () => {
      if (!smiles) {
        setHasError(true);
        setErrorMessage('SMILES string is empty');
        setIsLoading(false);
        return;
      }

      if (!container) {
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');
        setSvgContent('');

        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Dynamic import of SMILES Drawer
        const SmilesDrawerModule = await import('smiles-drawer');
        const SmilesDrawer = (SmilesDrawerModule as { default?: any }).default ?? SmilesDrawerModule;

        if (!isMounted) {
          return;
        }

        try {
          // Create SVG element for rendering
          const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          svgElement.setAttribute('width', width.toString());
          svgElement.setAttribute('height', height.toString());
          svgElement.id = smiles + '-svg';
          svgElement.style.background = 'transparent';

          const themeName = 'plain';
          const monochromeColor = tokens.node.smilesBond;
          const palette = tokens.node.smilesPalette;
          // Create SmiDrawer instance
          const moleculeOptions = {
            width: width,
            height: height,
            bondThickness: 1.6,
            bondSpacing: 5,
            atomVisualization: 'default' as const,
            isomeric: true,
            debug: false,
            terminalCarbons: false,
            explicitHydrogens: false,
            themes: {
              [themeName]: {
                C: palette.C,
                O: palette.O,
                N: palette.N,
                S: palette.S,
                P: palette.P,
                F: palette.F,
                Cl: palette.Cl,
                Br: palette.Br,
                I: palette.I,
                H: palette.H,
                B: palette.B,
                BACKGROUND: tokens.node.smilesBackground,
                BOND_STROKE: monochromeColor
              }
            }
          };

          const reactionOptions = {
            fontSize: 12,
            fontFamily: 'Arial, Helvetica, sans-serif',
            spacing: 10
          };

          const smiDrawer = new SmilesDrawer.SmiDrawer(moleculeOptions, reactionOptions);

          // Success callback
          const successCallback = () => {
            if (!isMounted) {
              return;
            }

            // Store SVG content as HTML string to avoid DOM conflicts
            const svgHTML = svgElement.outerHTML;

            // Set via React state instead of direct DOM manipulation
            setSvgContent(svgHTML);
            setHasError(false);
            setIsLoading(false);
          };

          // Error callback
          const errorCallback = (error: any) => {
            setHasError(true);
            setErrorMessage(`SmiDrawer error: ${error.name || error.message || error}`);
            setIsLoading(false);
          };

          // Use the correct v2.x API: draw(source, svg, theme, successCallback, errorCallback)
          smiDrawer.draw(smiles, svgElement, themeName, successCallback, errorCallback);

        } catch (error) {
          setHasError(true);
          setErrorMessage(`Creation error: ${error}`);
          setIsLoading(false);
        }

      } catch (error) {
        setHasError(true);
        setErrorMessage(`Library error: ${error}`);
        setIsLoading(false);
      }
    };

    renderMolecule();

    return () => {
      isMounted = false;
    };
  }, [smiles, width, height, className, container, tokens]);

  // Callback ref to set container
  const containerCallbackRef = (node: HTMLDivElement | null) => {
    setContainer(node);
  };

  return (
    <div
      ref={containerCallbackRef}
      className={`${className} flex items-center justify-center`}
      style={{
        width,
        height,
        backgroundColor: tokens.node.smilesBackground,
        borderColor: tokens.node.smilesBorder,
        borderStyle: 'solid',
        borderWidth: 1,
      }}
    >
      {isLoading && !svgContent && (
        <div className="text-center">
          <div className="text-xl mb-1">⚗️</div>
          <div className="text-xs text-gray-500 dark:text-neutral-300">Loading...</div>
        </div>
      )}

      {hasError && !svgContent && (
        <div className="text-center p-2">
          <div className="text-xs font-mono break-all" style={{ color: tokens.node.text }}>
            {smiles}
          </div>
          {errorMessage && (
            <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
          )}
        </div>
      )}

      {svgContent && (
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          className="w-full h-full flex items-center justify-center"
        />
      )}
    </div>
  );
};

export default SmilesRenderer;
