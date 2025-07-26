
'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ReactFlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
}

function Flow({ initialNodes, initialEdges }: ReactFlowDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  const proOptions = { hideAttribution: true };

  const memoizedNodes = useMemo(() => nodes, [initialNodes]);
  const memoizedEdges = useMemo(() => edges, [initialEdges]);


  if (!memoizedNodes || !memoizedEdges) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading diagram...</div>;
  }

  return (
      <ReactFlow
        nodes={memoizedNodes}
        edges={memoizedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={proOptions}
        nodesDraggable={true}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
  );
}


export function ReactFlowDiagram({ nodes, edges }: ReactFlowDiagramProps) {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlowProvider>
                <Flow initialNodes={nodes} initialEdges={edges} />
            </ReactFlowProvider>
        </div>
    )
}
