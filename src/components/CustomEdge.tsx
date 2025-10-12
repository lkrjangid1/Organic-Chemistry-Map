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
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    markerEnd,
    markerStart,
    style,
}: EdgeProps<CustomEdgeData>) {
    const { tokens } = useTheme();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    const computedStyle = {
        ...(style ?? {}),
        stroke: style?.stroke ?? tokens.flow.edgeStroke,
        strokeWidth: style?.strokeWidth ?? 2,
    };

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={computedStyle}
                markerStart={markerStart}
                markerEnd={typeof markerEnd === 'string' ? markerEnd : undefined}
            />

            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        background: tokens.flow.labelBackground,
                        padding: '2px 4px',
                        borderRadius: 4,
                        fontFamily: 'sans-serif',
                        lineHeight: 1,
                        textAlign: 'center',
                        color: tokens.flow.labelText,
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${tokens.flow.labelBorder}`,
                    }}
                    className="nodrag nopan"
                >
                    {data?.reagents && (
                        <div style={{ fontSize: 8, fontWeight: 600, color: tokens.flow.labelReagents }}>
                            [{data.reagents}]
                        </div>
                    )}
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{data?.label}</div>
                    {data?.conditions && (
                        <div style={{ fontSize: 8, fontStyle: 'italic', color: tokens.flow.labelMuted }}>
                            ({data.conditions})
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
