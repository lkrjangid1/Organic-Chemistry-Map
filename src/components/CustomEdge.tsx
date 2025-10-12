import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import { useTheme } from '../theme';

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
    const { tokens } = useTheme();
    const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={{ stroke: tokens.flow.edgeStroke, strokeWidth: 2 }} />

            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        background: tokens.flow.labelBackground,
                        padding: '3px 6px',
                        borderRadius: 6,
                        fontFamily: 'sans-serif',
                        lineHeight: 1.2,
                        textAlign: 'center',
                        color: tokens.flow.labelText,
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${tokens.flow.labelBorder}`,
                    }}
                    className="nodrag nopan"
                >
                    {data?.reagents && (
                        <div style={{ fontSize: 10, fontWeight: 600, color: tokens.flow.labelReagents }}>
                            [{data.reagents}]
                        </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{data?.label}</div>
                    {data?.conditions && (
                        <div style={{ fontSize: 10, fontStyle: 'italic', color: tokens.flow.labelMuted }}>
                            ({data.conditions})
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
