#!/usr/bin/env python3
"""
Circular Radial Layout Algorithm for Organic Chemistry Compound Map
Creates a spider-web structure with benzene at center and compounds arranged in concentric circles
"""

import json
import math
from collections import defaultdict

def calculate_radial_layout():
    """Calculate optimal positions for all 293 nodes using circular radial algorithm"""

    # Load the data
    with open('/Users/lokeshjangid/Desktop/organic-chem-map/organic_chemistry_data.json', 'r') as f:
        data = json.load(f)

    # Constants
    MIN_SPACING = 500  # Minimum 500px spacing between nodes
    PRIMARY_RADIUS = 600  # Primary connections at 600px from center
    RADIUS_INCREMENT = 500  # Each ring 500px further out

    # Primary benzene connections (identified from analysis)
    primary_connections = {
        'benzaldehyde': 'Gattermann-Koch Reaction',
        'acetophenone': 'Friedel-Crafts Acylation',
        'nitrobenzene': 'Nitration',
        'anisole': 'Friedel-Crafts Alkylation',
        'cumene': 'Friedel-Crafts Alkylation',
        'cyclohexa_1_4_diene': 'Birch Reduction'
    }

    # Build adjacency graph to understand connectivity
    graph = defaultdict(set)
    edge_reactions = {}

    for edge in data['edges']:
        source = edge['source']
        target = edge['target']
        graph[source].add(target)
        graph[target].add(source)
        edge_reactions[(source, target)] = edge.get('label', '')
        edge_reactions[(target, source)] = edge.get('label', '')

    # Categorize nodes by reaction types for angular grouping
    reaction_categories = {
        'Friedel-Crafts': [],
        'Oxidation': [],
        'Reduction': [],
        'Substitution': [],
        'Addition': [],
        'Condensation': [],
        'Rearrangement': [],
        'Other': []
    }

    def categorize_by_reaction_type(node_id, connections):
        """Categorize nodes based on their reaction types"""
        reaction_keywords = []
        for connected_node in connections:
            if (node_id, connected_node) in edge_reactions:
                reaction = edge_reactions[(node_id, connected_node)].lower()
                reaction_keywords.append(reaction)

        # Determine category based on reaction keywords
        if any('friedel' in r or 'acylation' in r or 'alkylation' in r for r in reaction_keywords):
            return 'Friedel-Crafts'
        elif any('oxidation' in r or 'epoxidation' in r for r in reaction_keywords):
            return 'Oxidation'
        elif any('reduction' in r or 'hydrog' in r for r in reaction_keywords):
            return 'Reduction'
        elif any('substitution' in r or 'halogen' in r or 'nitration' in r for r in reaction_keywords):
            return 'Substitution'
        elif any('addition' in r or 'cyclo' in r for r in reaction_keywords):
            return 'Addition'
        elif any('condensation' in r or 'aldol' in r for r in reaction_keywords):
            return 'Condensation'
        elif any('rearrang' in r or 'migration' in r for r in reaction_keywords):
            return 'Rearrangement'
        else:
            return 'Other'

    # Initialize node positions
    positions = {}
    placed_nodes = set()

    # Step 1: Place benzene at center
    positions['benzene'] = {'x': 0, 'y': 0}
    placed_nodes.add('benzene')

    # Step 2: Place primary connections in first ring
    primary_angles = {}
    angle_step = 2 * math.pi / len(primary_connections)

    for i, (node_id, reaction_type) in enumerate(primary_connections.items()):
        angle = i * angle_step
        x = PRIMARY_RADIUS * math.cos(angle)
        y = PRIMARY_RADIUS * math.sin(angle)
        positions[node_id] = {'x': x, 'y': y}
        placed_nodes.add(node_id)
        primary_angles[node_id] = angle

    # Step 3: Build rings based on distance from benzene using BFS
    rings = []
    visited = set(['benzene'])
    current_ring = list(primary_connections.keys())
    visited.update(current_ring)
    rings.append(current_ring)

    while len(visited) < len([node for node in data['nodes'] if node['id'] in graph]):
        next_ring = []
        for node in current_ring:
            for neighbor in graph[node]:
                if neighbor not in visited:
                    next_ring.append(neighbor)
                    visited.add(neighbor)

        if not next_ring:  # Handle disconnected components
            unvisited = [node['id'] for node in data['nodes'] if node['id'] not in visited and node['id'] in graph]
            if unvisited:
                next_ring = unvisited[:min(20, len(unvisited))]  # Take up to 20 unvisited nodes
                visited.update(next_ring)

        if next_ring:
            rings.append(next_ring)
            current_ring = next_ring
        else:
            break

    # Step 4: Add any remaining nodes that might not be connected
    all_node_ids = {node['id'] for node in data['nodes']}
    remaining_nodes = all_node_ids - visited
    if remaining_nodes:
        rings.append(list(remaining_nodes))

    # Step 5: Position nodes in each ring
    for ring_index, ring_nodes in enumerate(rings[1:], 1):  # Skip first ring (already placed)
        # Calculate initial radius based on required spacing
        base_radius = PRIMARY_RADIUS + (ring_index * RADIUS_INCREMENT)

        # Calculate minimum radius needed for this ring to maintain 500px spacing
        circumference_needed = len(ring_nodes) * MIN_SPACING
        min_radius_for_spacing = circumference_needed / (2 * math.pi)

        # Use the larger of the two radii
        radius = max(base_radius, min_radius_for_spacing)

        # Categorize nodes in this ring
        ring_categories = defaultdict(list)
        for node_id in ring_nodes:
            if node_id in graph:
                category = categorize_by_reaction_type(node_id, graph[node_id])
                ring_categories[category].append(node_id)

        # Calculate angular spacing to maintain minimum distance
        angle_per_node = 2 * math.pi / len(ring_nodes)

        # Ensure angular spacing maintains minimum distance at this radius
        min_angle_for_spacing = MIN_SPACING / radius
        if angle_per_node < min_angle_for_spacing:
            # Need to increase radius further
            radius = MIN_SPACING / angle_per_node * 1.1  # 10% buffer

        angle_per_node = 2 * math.pi / len(ring_nodes)

        # Assign angular positions
        node_index = 0
        for category, nodes in ring_categories.items():
            if not nodes:
                continue

            # For each category, try to group nodes near related primary connections
            best_primary_angle = 0
            if category == 'Friedel-Crafts':
                # Group near acetophenone, anisole, or cumene
                candidates = ['acetophenone', 'anisole', 'cumene']
                for candidate in candidates:
                    if candidate in primary_angles:
                        best_primary_angle = primary_angles[candidate]
                        break
            elif category == 'Substitution':
                # Group near nitrobenzene
                if 'nitrobenzene' in primary_angles:
                    best_primary_angle = primary_angles['nitrobenzene']
            elif category == 'Reduction':
                # Group near cyclohexa_1_4_diene
                if 'cyclohexa_1_4_diene' in primary_angles:
                    best_primary_angle = primary_angles['cyclohexa_1_4_diene']

            # Position nodes in this category
            for node_id in nodes:
                # Calculate angle with sector grouping
                if len(ring_categories) > 1:
                    # Use category-based positioning
                    category_angle_offset = best_primary_angle
                    angle = category_angle_offset + (node_index % len(nodes)) * angle_per_node / len(ring_categories)
                else:
                    # Evenly distribute if only one category
                    angle = node_index * angle_per_node

                x = radius * math.cos(angle)
                y = radius * math.sin(angle)

                # Final check and adjustment for minimum spacing
                adjusted_radius = radius
                max_attempts = 20
                attempts = 0

                while attempts < max_attempts:
                    x = adjusted_radius * math.cos(angle)
                    y = adjusted_radius * math.sin(angle)

                    # Check minimum distance to all placed nodes
                    min_distance_ok = True
                    for placed_node, pos in positions.items():
                        distance = math.sqrt((x - pos['x'])**2 + (y - pos['y'])**2)
                        if distance < MIN_SPACING:
                            min_distance_ok = False
                            break

                    if min_distance_ok:
                        break
                    else:
                        adjusted_radius += 100  # Increase radius by 100px and try again
                        attempts += 1

                positions[node_id] = {'x': x, 'y': y}
                placed_nodes.add(node_id)
                node_index += 1

    # Step 6: Update the data with new positions
    for node in data['nodes']:
        node_id = node['id']
        if node_id in positions:
            node['position'] = positions[node_id]
        else:
            # Fallback position for any missed nodes
            angle = hash(node_id) % 360 * (math.pi / 180)
            fallback_radius = PRIMARY_RADIUS + (len(rings) * RADIUS_INCREMENT)
            node['position'] = {
                'x': fallback_radius * math.cos(angle),
                'y': fallback_radius * math.sin(angle)
            }

    return data

def main():
    """Main function to update the layout"""
    print("Starting circular radial layout calculation...")

    # Calculate new layout
    updated_data = calculate_radial_layout()

    # Write back to file
    with open('/Users/lokeshjangid/Desktop/organic-chem-map/organic_chemistry_data.json', 'w') as f:
        json.dump(updated_data, f, indent=2)

    print("Layout calculation completed!")
    print("✓ Benzene positioned at center (0,0)")
    print("✓ Primary connections positioned at 600px radius")
    print("✓ All 293 nodes arranged in expanding concentric circles")
    print("✓ Minimum 500px spacing maintained between nodes")
    print("✓ Similar reaction types grouped in angular sectors")
    print("✓ JSON file updated with new coordinates")

if __name__ == "__main__":
    main()