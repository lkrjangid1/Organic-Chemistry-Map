# 🔧 Component Guide

This document provides a detailed overview of all components in the Organic Chemistry Map application.

## 📁 Component Architecture

```
src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── store/              # State management
├── types/              # TypeScript declarations
└── data/               # Static data files
```

## 🧩 Core Components

### 1. App.tsx
**Purpose**: Root application component
**Features**:
- Layout structure with fixed header
- Integration of all major components
- Global styling application

```tsx
function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pt-14">
        <MapPage />
        <SidePanel />
      </main>
    </div>
  );
}
```

---

### 2. components/Header.tsx
**Purpose**: Application header with branding and navigation
**Features**:
- App title and logo
- Navigation buttons (GitHub, About)
- Responsive design
- Fixed positioning

**Key Props**: None (stateless component)

**Styling**:
- Glass morphism effect with backdrop blur
- Fixed positioning at top
- Responsive layout

---

### 3. components/NodeChemical.tsx
**Purpose**: Custom React Flow node for chemical compounds
**Features**:
- SMILES structure rendering using SMILES Drawer
- Compound information display (name, formula, IUPAC)
- React Flow handles for connections
- Interactive hover and selection effects

**Props**:
```tsx
interface ChemicalNodeProps extends NodeProps {
  data: {
    label: string;
    smiles: string;
    info: {
      formula: string;
      iupac: string;
      notes?: string;
      properties?: string;
    };
  };
}
```

**Key Features**:
- Canvas-based molecular structure rendering
- Error handling for invalid SMILES
- Responsive sizing (180x120px canvas)
- Selection highlighting with blue border

---

### 4. components/SidePanel.tsx
**Purpose**: Information panel for compound/reaction details and controls
**Features**:
- Collapsible design
- Search functionality
- Reaction filtering
- Detailed compound/reaction information
- Usage instructions

**State Integration**:
- Uses Zustand store for all state management
- Real-time updates based on selections
- Search query management

**Key Sections**:
1. **Search Controls**: Compound search input
2. **Filter Controls**: Reaction type dropdown
3. **Compound Details**: SMILES, formula, properties
4. **Reaction Details**: Reagents, conditions, mechanisms
5. **Help Text**: Usage instructions

---

### 5. pages/MapPage.tsx
**Purpose**: Main React Flow visualization component
**Features**:
- Interactive graph rendering
- Pan, zoom, and selection handling
- Dynamic node and edge styling
- Background and controls integration

**React Flow Configuration**:
```tsx
const nodeTypes = {
  chemical: NodeChemical,
};

const edgeOptions = {
  animated: false,
  style: {
    stroke: '#6366f1',
    strokeWidth: 2,
  },
};
```

**Event Handlers**:
- `onNodeClick`: Select compounds
- `onEdgeClick`: Select reactions
- `onPaneClick`: Clear selections

**Styling Features**:
- Dynamic edge colors based on selection/highlighting
- Node opacity changes for search results
- Animation for highlighted paths

---

### 6. store/useMapStore.ts
**Purpose**: Zustand state management store
**Features**:
- Global application state
- Computed values (filtered edges, search results)
- Action methods for state updates

**State Shape**:
```tsx
interface MapState {
  // Data
  nodes: Node<ChemicalNodeData>[];
  edges: Edge<ReactionEdgeData>[];

  // Selection
  selectedNode: Node<ChemicalNodeData> | null;
  selectedEdge: Edge<ReactionEdgeData> | null;

  // Filtering
  reactionFilter: string | null;
  searchQuery: string;
  highlightedPath: string[];

  // UI
  isPanelOpen: boolean;
}
```

**Key Actions**:
- `setSelectedNode`: Handle compound selection
- `setSearchQuery`: Search with auto-highlighting
- `setReactionFilter`: Filter reactions by type
- `getFilteredEdges`: Computed filtered edges
- `getNodesMatchingSearch`: Computed search results

---

## 📊 Data Structure

### Chemical Compound Node
```json
{
  "id": "benzene",
  "label": "Benzene",
  "smiles": "C1=CC=CC=C1",
  "type": "compound",
  "info": {
    "iupac": "Benzene",
    "formula": "C6H6",
    "notes": "Base aromatic compound",
    "properties": "Colorless liquid, carcinogenic"
  },
  "position": { "x": 0, "y": 0 }
}
```

### Chemical Reaction Edge
```json
{
  "id": "benzene_to_nitrobenzene",
  "source": "benzene",
  "target": "nitrobenzene",
  "label": "Nitration",
  "type": "reaction",
  "reactionInfo": {
    "reagents": "HNO3 + H2SO4",
    "conditions": "50-60°C",
    "mechanism": "Electrophilic aromatic substitution",
    "equation": "C6H6 + HNO3 → C6H5NO2 + H2O"
  }
}
```

---

## 🎨 Styling System

### Tailwind CSS Classes
- **Glass Morphism**: `bg-white/90 backdrop-blur-sm`
- **Shadows**: `shadow-lg`, `shadow-xl`
- **Borders**: `border border-gray-200`
- **Hover Effects**: `hover:shadow-xl hover:scale-105`

### React Flow Customization
- **Node Selection**: Blue border with ring effect
- **Edge Highlighting**: Color and width changes
- **Background**: Dotted pattern with slate colors
- **Controls**: Glass effect styling

### Responsive Design
- **Mobile**: Hide minimap, adjust controls position
- **Tablet**: Optimized touch interactions
- **Desktop**: Full feature set

---

## 🔄 Component Interaction Flow

```
User Action → Store Update → Component Re-render → UI Update

Examples:
1. Click Node → setSelectedNode → SidePanel shows details
2. Search Input → setSearchQuery → Highlights matching nodes
3. Filter Select → setReactionFilter → Hide/show edges
4. Click Edge → setSelectedEdge → SidePanel shows reaction info
```

---

## 🚀 Performance Optimizations

### React Flow
- **fitView**: Automatic layout on initialization
- **Node Memoization**: `memo()` wrapper for NodeChemical
- **Edge Batching**: Efficient edge style updates

### SMILES Drawer
- **Canvas Reuse**: Clear and redraw on same canvas
- **Error Handling**: Graceful fallback for invalid SMILES
- **Optimized Settings**: Reduced complexity for performance

### State Management
- **Computed Values**: Memoized filtered results
- **Selective Updates**: Only update changed state slices
- **Efficient Searches**: Debounced search with highlighting

---

## 🧪 Testing Strategy

### Component Testing
- **Unit Tests**: Individual component behavior
- **Integration Tests**: Component interaction
- **Visual Tests**: SMILES rendering accuracy

### Data Validation
- **SMILES Validation**: Check molecular structure validity
- **JSON Schema**: Validate data file structure
- **Edge Connectivity**: Verify node relationships

---

## 🔧 Extension Points

### Adding New Node Types
1. Create new component in `components/`
2. Register in `nodeTypes` object
3. Update data structure and TypeScript types

### Adding New Features
1. **Search Filters**: Extend search criteria
2. **Export Functions**: Add data export capabilities
3. **Animation Controls**: Enhanced visual effects
4. **Zoom Modes**: Different viewing perspectives

### Data Expansion
1. **New Reaction Types**: Add to filter dropdown
2. **Compound Categories**: Group related compounds
3. **Mechanism Details**: Step-by-step reaction mechanisms
4. **3D Structures**: Enhanced molecular visualization

---

This component guide serves as a reference for developers working on the Organic Chemistry Map application. Each component is designed to be modular, reusable, and easily extensible for future enhancements.