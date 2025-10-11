/**
 * Type declarations for smiles-drawer library
 * Since the library doesn't provide TypeScript definitions,
 * we create our own to avoid compilation errors
 */

declare module 'smiles-drawer' {
  export interface DrawerOptions {
    width?: number;
    height?: number;
    bondThickness?: number;
    bondLength?: number;
    shortBondLength?: number;
    bondSpacing?: number;
    atomVisualization?: string;
    isomeric?: boolean;
    debug?: boolean;
    terminalCarbons?: boolean;
    explicitHydrogens?: boolean;
    overlapSensitivity?: number;
    overlapResolutionIterations?: number;
    compactDrawing?: boolean;
    fontFamily?: string;
    fontSize?: number;
    fontSizeLarge?: number;
    padding?: number;
  }

  export class Drawer {
    constructor(options: DrawerOptions);
    draw(tree: any, canvas: HTMLCanvasElement, theme: string, infoOnly: boolean): void;
  }

  export function parse(
    smiles: string,
    callback: (tree: any) => void,
    errorCallback?: (error: any) => void
  ): void;

  const SmilesDrawer: {
    Drawer: typeof Drawer;
    parse: typeof parse;
  };

  export default SmilesDrawer;
}