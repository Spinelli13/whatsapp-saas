import { Handle, Position } from 'reactflow';

const TIPO_CONFIG: Record<string, { bg: string; border: string; label: string }> = {
  inicio:       { bg: 'bg-green-50',  border: 'border-green-500',  label: '▶ Início' },
  mensagem:     { bg: 'bg-blue-50',   border: 'border-blue-500',   label: '💬 Mensagem' },
  pergunta:     { bg: 'bg-yellow-50', border: 'border-yellow-500', label: '❓ Pergunta' },
  condicao:     { bg: 'bg-purple-50', border: 'border-purple-500', label: '⚡ Condição' },
  acao:         { bg: 'bg-orange-50', border: 'border-orange-500', label: '🎯 Ação' },
  transferencia:{ bg: 'bg-red-50',    border: 'border-red-500',    label: '👤 Transferir' },
};

export default function BlocoNode({ data }: { data: any }) {
  const cfg = TIPO_CONFIG[data?.tipo] || TIPO_CONFIG.mensagem;

  return (
    <div className={`px-3 py-2 rounded-lg border-2 shadow-sm min-w-[140px] ${cfg.bg} ${cfg.border}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="font-semibold text-xs text-gray-800 mb-1">{cfg.label}</div>
      <div className="text-xs text-gray-600 max-w-[160px] break-words line-clamp-2">
        {data?.conteudo || '...'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
