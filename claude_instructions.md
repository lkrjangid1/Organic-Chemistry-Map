## 🧩 1. Overview

You are building a **React-based interactive map** that visualizes organic chemistry reactions.
Each **compound** is a **node**, each **reaction** is an **edge** connecting two compounds.

Users can:

* Zoom and pan freely (like Google Maps).
* Click on any compound to open detailed info.
* Filter reactions by type (e.g. nitration, sulfonation, Friedel–Crafts, etc.).
* Search compounds and highlight transformation paths.

---

## ⚙️ 2. Technology Stack

| Purpose                      | Library / Tool            |
| ---------------------------- | ------------------------- |
| UI Framework                 | **React (with Vite)**     |
| Node–Edge Graph Rendering    | **React Flow**            |
| Chemical Structure Rendering | **SMILES Drawer**         |
| Styling                      | **Tailwind CSS**          |
| State Management             | **Zustand**               |
| Layout Helper                | **D3-force (optional)**   |
| Deployment                   | **Vercel** or **Netlify** |

---

## 🗂️ 3. Folder Structure

```
chem-map/
├── src/
│   ├── components/
│   │   ├── NodeChemical.tsx       # Custom node rendering with SMILES Drawer
│   │   ├── ReactionEdge.tsx       # Custom edge with labels (reagents, conditions)
│   │   ├── SidePanel.tsx          # Displays compound or reaction details
│   │   ├── Controls.tsx           # Zoom, filter, reset, and search controls
│   │   └── Header.tsx             # Optional app header
│   ├── data/
│   │   └── jee_organic.json       # Graph data for JEE Advanced syllabus
│   ├── pages/
│   │   └── MapPage.tsx            # Main React Flow visualization
│   ├── store/
│   │   └── useMapStore.ts         # Zustand store (selected node, filters)
│   ├── utils/
│   │   └── layout.ts              # D3 layout functions for positioning
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
└── package.json
```

---

## 🧱 4. Data Structure (jee_organic.json)

Each **node** represents a compound.
Each **edge** represents a chemical transformation.

**Example:**

```json
{
  "nodes": [
    {
      "id": "benzene",
      "label": "Benzene",
      "smiles": "C1=CC=CC=C1",
      "type": "compound",
      "info": {
        "iupac": "Benzene",
        "formula": "C6H6",
        "notes": "Base aromatic compound"
      },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "nitrobenzene",
      "label": "Nitrobenzene",
      "smiles": "C1=CC=C(C=C1)[N+](=O)[O-]",
      "type": "compound",
      "info": { "reactionType": "Nitration" }
    }
  ],
  "edges": [
    {
      "id": "benzene_to_nitrobenzene",
      "source": "benzene",
      "target": "nitrobenzene",
      "label": "Nitration (HNO3 + H2SO4)",
      "reaction": "C6H6 + HNO3 → C6H5NO2 + H2O"
    }
  ]
}
```

---

## 🧬 5. Core Features

### 🔹 Basic Map Functions

* Zoom and pan freely within the graph.
* Reset or fit view to graph bounds.
* Smooth animations during navigation.

### 🔹 Nodes (Compounds)

* Display molecule structure via **SMILES Drawer**.
* Show compound name, formula, and basic data below structure.
* On click: open a **SidePanel** with full details (e.g. uses, reaction list).

### 🔹 Edges (Reactions)

* Show reaction name and reagent/condition text above edge line.
* Hovering highlights both source and target nodes.

### 🔹 Filtering & Search

* Filter reactions by **type**: nitration, halogenation, sulfonation, oxidation, reduction, etc.
* Search compounds by **name or formula** and auto-focus in map.

### 🔹 Path Highlighting

* When user selects two nodes, highlight all possible reaction paths between them.

### 🔹 Info Side Panel

* Shows:

  * Chemical name & formula
  * SMILES
  * Related reactions (in/out edges)
  * Mechanism summary (optional)

### 🔹 Future Mode (optional)

* Quiz mode: hide products and ask user to predict.
* Mechanism expansion: zoom into multi-step processes.

---

## 🧪 6. Integration Examples

### SMILES Drawer Node Example

`src/components/NodeChemical.tsx`

```tsx
import { useEffect, useRef } from "react";
import SmilesDrawer from "smiles-drawer";

export default function NodeChemical({ smiles, label }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const drawer = new SmilesDrawer.Drawer({ width: 150, height: 100 });
    SmilesDrawer.parse(smiles, (tree) => {
      drawer.draw(tree, canvasRef.current, "light", false);
    });
  }, [smiles]);

  return (
    <div className="flex flex-col items-center text-center">
      <canvas ref={canvasRef}></canvas>
      <p className="text-xs mt-1 font-medium">{label}</p>
    </div>
  );
}
```

---

## ⚙️ 7. React Flow Configuration

In `MapPage.tsx`:

```tsx
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import NodeChemical from "../components/NodeChemical";
import { useMapStore } from "../store/useMapStore";
import data from "../data/jee_organic.json";

const nodeTypes = { chemical: NodeChemical };

export default function MapPage() {
  const { selectedNode, setSelectedNode } = useMapStore();

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={data.nodes.map((n) => ({ ...n, type: "chemical" }))}
        edges={data.edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => setSelectedNode(node)}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

---

## 💾 8. State Management (Zustand)

`useMapStore.ts`

```ts
import { create } from "zustand";

export const useMapStore = create((set) => ({
  selectedNode: null,
  filter: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  setFilter: (filter) => set({ filter })
}));
```

---

## 🎨 9. Styling Rules (TailwindCSS)

* Light background (`bg-slate-50` or `bg-gray-100`)
* Nodes use rounded cards with shadow
* Consistent typography for chemical labels
* SidePanel uses glass effect (`bg-white/80 backdrop-blur`)

---

## 🚀 10. Build and Deploy

1. Run locally

   ```bash
   npm install
   npm run dev
   ```
2. Build production bundle

   ```bash
   npm run build
   ```
3. Deploy `dist/` folder to **Vercel** or **Netlify**

---

## 🧠 11. Data Expansion Roadmap

* Phase 1: JEE Advanced aromatic compounds (benzene → phenol → aniline, etc.)
* Phase 2: Aliphatic organic chemistry (alcohols, aldehydes, carboxylic acids)
* Phase 3: Add physical/organic mechanism steps (multi-level zoom).

---

## ✅ 12. Claude Behavior Rules

When generating project code:

1. **Follow all folder and naming conventions** above.
2. **Always use TypeScript (.tsx)**.
3. **Use functional components with hooks.**
4. **Keep all UI modular** — each logical unit should be a separate file.
5. **Ensure SMILES Drawer integration works inside ReactFlow nodes.**
6. **No hardcoded HTML structures for molecules.**
7. **All styles must be Tailwind-based.**
8. **Write self-documented, commented, production-quality code.**
9. **Output should include example JSON data** for 10–15 reactions (aromatic subset).
10. **Export as zip-ready project** that can run with `npm run dev` immediately.

