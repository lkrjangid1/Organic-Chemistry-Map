import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import { useTheme } from '../theme';

export type ReactionInfo = {
    reagents?: string;
    conditions?: string;
    mechanism?: string;
    equation?: string;
};

export type CustomEdgeData = {
    label?: string;
    reactionInfo?: ReactionInfo;
    onShowInfo?: () => void;
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
        stroke: tokens.flow.edgeStroke,
        strokeWidth: 2,
        cursor: 'pointer',
        ...(style ?? {}), // Allow style prop to override defaults
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
                        lineHeight: 1.2,
                        textAlign: 'center',
                        color: tokens.flow.labelText,
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${tokens.flow.labelBorder}`,
                        cursor: 'pointer',
                    }}
                    className="nodrag nopan"
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                        event.stopPropagation();
                        data?.onShowInfo?.();
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            data?.onShowInfo?.();
                        }
                    }}
                >
                    {data?.reactionInfo?.reagents && (
                        <div style={{ fontSize: 10, fontWeight: 600, color: tokens.flow.labelReagents }}>
                            [{data.reactionInfo.reagents}]
                        </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{data?.label}</div>
                    {data?.reactionInfo?.conditions && (
                        <div style={{ fontSize: 10, fontStyle: 'italic', color: tokens.flow.labelMuted }}>
                            ({data.reactionInfo.conditions})
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
