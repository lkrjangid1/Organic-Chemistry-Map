# Organic Chemistry Map

An interactive, zoomable map of organic chemistry reactions designed for JEE Advanced preparation. Nodes represent compounds, edges capture reactions, and every node renders its molecular structure with SMILES Drawer.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

<img width="1680" height="932" alt="image" src="https://github.com/user-attachments/assets/28d5f1c4-aa77-45fa-bc34-23973f4f4e41" />


## Features

### Interactive Map
- Pan and zoom with mouse, trackpad, or touch gestures
- React Flow driven node and edge visualization
- Smooth transitions and selection feedback to keep context while exploring

### Chemical Structures
- SMILES Drawer renders molecule diagrams for each compound
- Rich metadata including IUPAC names, formulae, and notes
- Visual state highlighting for the active pathway

### Search and Filter (planned)
- Search compounds by label, formula, or IUPAC name
- Filter reactions by transformation type (e.g., nitration, oxidation)
- Highlight shortest paths to trace reaction routes

### Responsive Design
- Mobile friendly layout with safe-area padding and fixed header
- Consistent React Flow controls across screen sizes
- Tailwind CSS theming with coordinated light and dark palettes

## Quick Start

### Prerequisites
- Node.js 18+
- npm (bundled with Node) or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd organic-chem-map

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production output
npm run build
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | React 19 with TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Graph Rendering | React Flow 11 |
| Molecule Rendering | SMILES Drawer 2 |
| State Management | Zustand 5 |
| Icons | Lucide React |

## Project Structure

```
src/
├── App.tsx               # Root application component
├── index.css             # Global styles and React Flow overrides
├── main.tsx              # Application entry point
├── assets/               # Static assets
├── components/           # Reusable UI building blocks
│   ├── Header.tsx        # Top navigation and theme toggle
│   ├── NodeChemical.tsx  # Custom React Flow node for compounds
│   ├── SidePanel.tsx     # (Planned) contextual information panel
│   └── SmilesRenderer.tsx# SMILES Drawer integration
├── data/                 # Static JSON describing nodes and reactions
│   └── jee_organic.json
├── pages/                # Top-level pages
│   └── MapPage.tsx       # React Flow visualization canvas
├── store/                # Zustand stores
│   └── useMapStore.ts
├── theme/                # Theme tokens and provider hooks
└── utils/                # Helper utilities
```

## Chemical Data Format

Organic Chemistry Map reads a JSON description of nodes and reactions. A minimal entry looks like this:

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
        "notes": "Base aromatic compound",
        "properties": "Colorless liquid, carcinogenic"
      },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "benzene_to_nitrobenzene",
      "source": "benzene",
      "target": "nitrobenzene",
      "label": "Nitration",
      "type": "reaction",
      "reactionInfo": {
        "reagents": "HNO3 + H2SO4",
        "conditions": "50-60 deg C",
        "mechanism": "Electrophilic aromatic substitution",
        "equation": "C6H6 + HNO3 -> C6H5NO2 + H2O"
      }
    }
  ]
}
```

## Key Components

### `NodeChemical`
- Wraps a SMILES rendering canvas with compound metadata
- Applies selection styling and exposes connection handles
- Uses responsive sizing to keep nodes legible on all devices

### `MapPage`
- Configures React Flow with custom nodes, edges, and theming
- Manages fit view, zoom bounds, and background styling
- Positions navigation controls consistently on mobile and desktop

### `SmilesRenderer`
- Lazily loads SMILES Drawer to keep the bundle lean
- Converts generated SVG output into React content safely
- Handles loading states and error messaging for invalid SMILES strings

## Development Notes

### Adding Compounds
1. Append a new node entry to `src/data/jee_organic.json` with a unique `id` and coordinates.
2. Include a valid SMILES string to generate the diagram.
3. Provide supporting metadata (formula, IUPAC name, notes) for richer context.

### Adding Reactions
1. Create an edge entry connecting the source and target compound ids.
2. Supply reagents, conditions, and mechanism within `reactionInfo` for tooltips.
3. Adjust node positions if needed to minimise edge crossings.

### Styling and Theming
1. Tailwind tokens live in `tailwind.config.js` and `src/theme/tokens.ts`.
2. Global React Flow overrides reside in `src/index.css`.
3. Component-level styling uses Tailwind utility classes for consistency.

## Scripts

```
npm run dev     # Start Vite in development mode
npm run build   # Generate production assets
npm run preview # Preview the production build locally
```

## Contributing

Issues and pull requests are welcome. Please open a discussion before submitting large changes to coordinate on data formats or visualization conventions.

## License

This project is distributed under the MIT License. See `LICENSE` for details.
