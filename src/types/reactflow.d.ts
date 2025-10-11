/**
 * Type declarations for ReactFlow CSS imports
 * This fixes TypeScript errors when importing CSS files from ReactFlow
 */

declare module 'reactflow/dist/style.css' {
  const content: any;
  export default content;
}