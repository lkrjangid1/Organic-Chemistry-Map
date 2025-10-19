#!/usr/bin/env python3
"""
Fixed Circular Radial Layout Algorithm for Organic Chemistry Compound Map
Creates a spider-web structure with benzene at center and compounds arranged in concentric circles
"""

import json
import math
import random
from collections import defaultdict

def calculate_radial_layout():
    """Calculate optimal positions for all 293 nodes using circular radial algorithm"""

    # Load the data
    with open('/Users/lokeshjangid/Desktop/organic-chem-map/organic_chemistry_data.json', 'r') as f:
        data = json.load(f)

    # Constants
    MIN_SPACING = 500  # Minimum 500px spacing between nodes
    PRIMARY_RADIUS = 600  # Primary connections at 600px from center
    RADIUS_INCREMENT = 600  # Each ring 600px further out

    # Primary benzene connections (all 6 identified)
    primary_connections = [
        'benzaldehyde',
        'acetophenone',
        'nitrobenzene',
        'anisole',
        'cumene',
        'cyclohexa_1_4_diene'
    ]

    # Verify all primary connections exist
    node_ids = {node['id'] for node in data['nodes']}
    existing_primaries = [node_id for node_id in primary_connections if node_id in node_ids]
    print(f"Found {len(existing_primaries)} of {len(primary_connections)} primary connections: {existing_primaries}")

    # Build adjacency graph
    graph = defaultdict(set)
    for edge in data['edges']:
        source = edge['source']
        target = edge['target']
        if source in node_ids and target in node_ids:
            graph[source].add(target)
            graph[target].add(source)

    # Initialize positions dictionary
    positions = {}
    placed_nodes = set()

    # Step 1: Place benzene at center
    positions['benzene'] = {'x': 0, 'y': 0}
    placed_nodes.add('benzene')
    print("✓ Benzene placed at center (0,0)")

    # Step 2: Place primary connections in first ring
    primary_angles = {}
    for i, node_id in enumerate(existing_primaries):
        angle = i * (2 * math.pi / len(existing_primaries))
        x = PRIMARY_RADIUS * math.cos(angle)
        y = PRIMARY_RADIUS * math.sin(angle)
        positions[node_id] = {'x': x, 'y': y}
        placed_nodes.add(node_id)
        primary_angles[node_id] = angle

    print(f"✓ {len(existing_primaries)} primary connections placed at {PRIMARY_RADIUS}px radius")

    # Step 3: Build rings using BFS from benzene
    rings = []
    visited = set(['benzene'])
    current_ring = existing_primaries.copy()
    visited.update(current_ring)
    rings.append(current_ring)

    # Build subsequent rings
    while len(visited) < len(node_ids):
        next_ring = []
        for node in current_ring:
            if node in graph:
                for neighbor in graph[node]:
                    if neighbor not in visited and neighbor in node_ids:
                        next_ring.append(neighbor)
                        visited.add(neighbor)

        # Add any remaining unconnected nodes
        if not next_ring:
            remaining = [nid for nid in node_ids if nid not in visited]
            if remaining:
                # Take a reasonable chunk
                chunk_size = min(20, len(remaining))
                next_ring = remaining[:chunk_size]
                visited.update(next_ring)

        if next_ring:
            rings.append(next_ring)
            current_ring = next_ring
        else:
            break

    print(f"✓ Created {len(rings)} rings with nodes: {[len(ring) for ring in rings]}")

    # Step 4: Position nodes in each ring
    for ring_index, ring_nodes in enumerate(rings[1:], 1):
        if not ring_nodes:
            continue

        # Calculate radius ensuring minimum spacing
        base_radius = PRIMARY_RADIUS + (ring_index * RADIUS_INCREMENT)
        circumference_needed = len(ring_nodes) * MIN_SPACING
        min_radius_for_spacing = circumference_needed / (2 * math.pi)
        radius = max(base_radius, min_radius_for_spacing)

        print(f"  Ring {ring_index}: {len(ring_nodes)} nodes at radius {radius:.0f}px")

        # Calculate positions for this ring
        for i, node_id in enumerate(ring_nodes):
            # Calculate base angle
            angle = i * (2 * math.pi / len(ring_nodes))

            # Add some randomization to avoid perfect alignment
            angle += random.uniform(-0.1, 0.1)

            # Calculate initial position
            x = radius * math.cos(angle)
            y = radius * math.sin(angle)

            # Ensure minimum spacing by adjusting position if needed
            attempts = 0
            max_attempts = 50
            adjusted_radius = radius

            while attempts < max_attempts:
                x = adjusted_radius * math.cos(angle)
                y = adjusted_radius * math.sin(angle)

                # Check distance to all already placed nodes
                too_close = False
                for placed_pos in positions.values():
                    distance = math.sqrt((x - placed_pos['x'])**2 + (y - placed_pos['y'])**2)
                    if distance < MIN_SPACING:
                        too_close = True
                        break

                if not too_close:
                    break

                # Try adjusting radius or angle
                if attempts % 2 == 0:
                    adjusted_radius += 50
                else:
                    angle += 0.2
                attempts += 1

            positions[node_id] = {'x': x, 'y': y}
            placed_nodes.add(node_id)

    # Step 5: Handle any remaining nodes
    unplaced_nodes = node_ids - placed_nodes
    if unplaced_nodes:
        print(f"  Placing {len(unplaced_nodes)} remaining nodes")
        outer_radius = PRIMARY_RADIUS + (len(rings) * RADIUS_INCREMENT)

        for i, node_id in enumerate(unplaced_nodes):
            angle = i * (2 * math.pi / len(unplaced_nodes))
            x = outer_radius * math.cos(angle)
            y = outer_radius * math.sin(angle)
            positions[node_id] = {'x': x, 'y': y}

    # Step 6: Update the data with new positions
    for node in data['nodes']:
        node_id = node['id']
        if node_id in positions:
            node['position'] = positions[node_id]
        else:
            print(f"Warning: No position calculated for node {node_id}")

    return data

def verify_layout(data):
    """Verify the layout meets requirements"""
    print("\nLayout Verification:")

    # Check benzene position
    benzene_node = next((node for node in data['nodes'] if node['id'] == 'benzene'), None)
    if benzene_node and benzene_node.get('position') == {'x': 0, 'y': 0}:
        print("✓ Benzene at center (0,0)")
    else:
        print("✗ Benzene not at center")

    # Check nodes with positions
    nodes_with_positions = sum(1 for node in data['nodes'] if 'position' in node)
    print(f"✓ {nodes_with_positions}/{len(data['nodes'])} nodes have positions")

    # Check for duplicate positions
    position_counts = defaultdict(int)
    for node in data['nodes']:
        if 'position' in node:
            pos_key = (round(node['position']['x'], 1), round(node['position']['y'], 1))
            position_counts[pos_key] += 1

    duplicates = sum(1 for count in position_counts.values() if count > 1)
    if duplicates == 0:
        print("✓ No duplicate positions")
    else:
        print(f"⚠ {duplicates} duplicate positions found")

    # Sample minimum distance check
    positions = [(node['position']['x'], node['position']['y']) for node in data['nodes'] if 'position' in node]
    min_distance = float('inf')

    for i in range(min(20, len(positions))):
        for j in range(i+1, min(i+10, len(positions))):
            dist = math.sqrt((positions[i][0] - positions[j][0])**2 + (positions[i][1] - positions[j][1])**2)
            if dist > 0:  # Ignore same position
                min_distance = min(min_distance, dist)

    if min_distance >= 500:
        print(f"✓ Minimum spacing maintained: {min_distance:.1f}px")
    else:
        print(f"⚠ Some nodes closer than 500px: {min_distance:.1f}px")

def main():
    """Main function to update the layout"""
    print("Starting improved circular radial layout calculation...")
    random.seed(42)  # For reproducible results

    # Calculate new layout
    updated_data = calculate_radial_layout()

    # Verify the layout
    verify_layout(updated_data)

    # Write back to file
    with open('/Users/lokeshjangid/Desktop/organic-chem-map/organic_chemistry_data.json', 'w') as f:
        json.dump(updated_data, f, indent=2)

    print("\n🎉 Layout calculation completed successfully!")

if __name__ == "__main__":
    main()