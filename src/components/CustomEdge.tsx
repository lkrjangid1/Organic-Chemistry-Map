import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';

type CustomEdgeData = {
    label?: string;
    reagents?: string;
    conditions?: string;
};

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
}: EdgeProps<CustomEdgeData>) {
    const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={{ stroke: '#6366f1', strokeWidth: 2 }} />

            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        background: 'rgba(255,255,255,0.85)',
                        padding: '3px 6px',
                        borderRadius: 6,
                        fontFamily: 'sans-serif',
                        lineHeight: 1.2,
                        textAlign: 'center',
                    }}
                    className="nodrag nopan"
                >
                    {data?.reagents && (
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb' }}>
                            [{data.reagents}]
                        </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{data?.label}</div>
                    {data?.conditions && (
                        <div style={{ fontSize: 10, fontStyle: 'italic', color: '#6b7280' }}>
                            ({data.conditions})
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
