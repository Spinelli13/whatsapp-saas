import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BlocoNode from './BlocoNode';

const NODE_TYPES = { bloco: BlocoNode };

interface Props {
  estrutura: { nodes: Node[]; edges: Edge[] };
  onMudar: (estrutura: { nodes: Node[]; edges: Edge[] }) => void;
}

export default function FlowEditorCanvas({ estrutura, onMudar }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(estrutura.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(estrutura.edges || []);

  // Sincroniza quando o fluxo selecionado muda
  useEffect(() => {
    setNodes(estrutura.nodes || []);
    setEdges(estrutura.edges || []);
  }, [estrutura]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const novasEdges = addEdge(connection, eds);
        onMudar({ nodes, edges: novasEdges });
        return novasEdges;
      });
    },
    [nodes, onMudar]
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  return (
    <div style={{ width: '100%', height: '420px' }} className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
}
