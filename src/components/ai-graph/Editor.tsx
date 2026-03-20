"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

type GraphModel = {
  nodes: { id: string; type: string; inputs: Record<string, string>; outputs: Record<string, string>; config?: Record<string, unknown> }[];
  edges: { from: { nodeId: string; port: string }; to: { nodeId: string; port: string } }[];
  version: number;
};

function toFlow(graph: GraphModel): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((n, idx) => ({
    id: n.id,
    data: { label: `${n.type}` },
    position: { x: 100 + (idx % 5) * 150, y: 80 + Math.floor(idx / 5) * 120 },
  }));
  const edges: Edge[] = graph.edges.map((e, idx) => ({ id: `e${idx}`, source: e.from.nodeId, target: e.to.nodeId }));
  return { nodes, edges };
}

function fromFlow(nodes: Node[], edges: Edge[], base?: GraphModel): GraphModel {
  // preserve types/config from base
  const baseMap = new Map((base?.nodes || []).map(n => [n.id, n] as const));
  return {
    version: base?.version || 1,
    nodes: nodes.map(n => ({ id: n.id, type: baseMap.get(n.id)?.type || 'Act.SelectByName', inputs: baseMap.get(n.id)?.inputs || {}, outputs: baseMap.get(n.id)?.outputs || { selectedActionName: 'string' }, config: baseMap.get(n.id)?.config })),
    edges: edges.map(e => ({ from: { nodeId: e.source!, port: 'out' }, to: { nodeId: e.target!, port: 'in' } })),
  };
}

export function AiGraphEditor({ characterId }: { characterId: string }) {
  const [graph, setGraph] = useState<GraphModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [actions, setActions] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const NODE_TYPES: string[] = [
    'Sensor.World','Sensor.Character','Sensor.Fatigue','Sensor.Location',
    'Eval.Priority','Eval.LowHealth','Eval.IsTired','Eval.IsOverencumbered',
    'Act.SelectByName','Act.SelectByCategory','Act.SelectFromList','Act.Wander'
  ];
  const [newType, setNewType] = useState<string>('Act.SelectByName');
  const [showFlow, setShowFlow] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfRef = useRef<any>(null);
  const [ctx, setCtx] = useState<{ visible: boolean; x: number; y: number; target: 'pane' | 'node'; nodeId?: string; flowPos?: { x: number; y: number } } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ai-graphs/runtime/${characterId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const g = (data.graph || data) as GraphModel;
          if (!cancelled) {
            setGraph(g);
            const f = toFlow(g);
            setNodes(f.nodes);
            setEdges(f.edges);
          }
        } else {
          // init minimal graph
          const g: GraphModel = {
            version: 1,
            nodes: [
              { id: 'world', type: 'Sensor.World', inputs: {}, outputs: { world: 'json' } },
              { id: 'char', type: 'Sensor.Character', inputs: {}, outputs: { character: 'json' } },
              { id: 'fatigue', type: 'Sensor.Fatigue', inputs: {}, outputs: { ratio: 'number' } },
              { id: 'priority', type: 'Eval.Priority', inputs: {}, outputs: { selectedActionName: 'string' } },
            ],
            edges: [
              { from: { nodeId: 'world', port: 'world' }, to: { nodeId: 'priority', port: 'in' } }
            ],
          };
          setGraph(g);
          const f = toFlow(g);
          setNodes(f.nodes);
          setEdges(f.edges);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [characterId, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleSave = useCallback(async () => {
    const model = fromFlow(nodes, edges, graph || undefined);
    const res = await fetch(`/api/ai-graphs/runtime/${characterId}`, { method: 'PATCH', body: JSON.stringify({ graph: model }) });
    if (!res.ok) {
      alert('Не удалось сохранить граф');
    }
  }, [nodes, edges, characterId, graph]);

  const addSelectNode = () => {
    const id = `node_${Math.random().toString(36).slice(2, 8)}`;
    setNodes(n => n.concat({ id, data: { label: 'Act.SelectByName' }, position: { x: 200, y: 200 } } as any));
    setGraph(g => {
      const base = g || { version: 1, nodes: [], edges: [] } as GraphModel;
      return { ...base, nodes: base.nodes.concat({ id, type: 'Act.SelectByName', inputs: {}, outputs: { selectedActionName: 'string' }, config: { actionName: 'Прогулка' } }) };
    });
  };

  const DEFAULT_OUTPUTS: Record<string, Record<string, string>> = {
    'Sensor.World': { world: 'json' },
    'Sensor.Character': { character: 'json' },
    'Sensor.Fatigue': { ratio: 'number' },
    'Sensor.Location': { locationId: 'string', isSafe: 'boolean' },
    'Eval.Priority': { selectedActionName: 'string' },
    'Eval.LowHealth': { low: 'boolean' },
    'Eval.IsTired': { tired: 'boolean' },
    'Eval.IsOverencumbered': { over: 'boolean' },
    'Act.SelectByName': { selectedActionName: 'string' },
    'Act.SelectByCategory': { selectedActionName: 'string' },
    'Act.SelectFromList': { selectedActionName: 'string' },
    'Act.Wander': { selectedActionName: 'string' },
  };

  const addNodeOfType = () => {
    const id = `node_${Math.random().toString(36).slice(2, 8)}`;
    const label = newType;
    setNodes(n => n.concat({ id, data: { label }, position: { x: 240, y: 220 } } as any));
    setGraph(g => {
      const base = g || { version: 1, nodes: [], edges: [] } as GraphModel;
      const outputs = DEFAULT_OUTPUTS[newType] || { out: 'json' };
      const config = newType === 'Act.SelectByCategory' ? { category: 'rest' } : (newType === 'Eval.LowHealth' ? { threshold: 0.3 } : (newType === 'Eval.IsTired' ? { threshold: 0.6 } : {}));
      return { ...base, nodes: base.nodes.concat({ id, type: newType, inputs: {}, outputs, config }) };
    });
  };

  const addNodeAt = (type: string, pos: { x: number; y: number }) => {
    const id = `node_${Math.random().toString(36).slice(2, 8)}`;
    const outputs = DEFAULT_OUTPUTS[type] || { out: 'json' };
    const config = type === 'Act.SelectByCategory' ? { category: 'rest' } : (type === 'Eval.LowHealth' ? { threshold: 0.3 } : (type === 'Eval.IsTired' ? { threshold: 0.6 } : {}));
    setNodes(n => n.concat({ id, data: { label: type }, position: pos } as any));
    setGraph(g => {
      const base = g || { version: 1, nodes: [], edges: [] } as GraphModel;
      return { ...base, nodes: base.nodes.concat({ id, type, inputs: {}, outputs, config }) };
    });
  };

  const disconnectNode = (nodeId: string) => {
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setGraph(g => g ? { ...g, edges: (g.edges || []).filter(e => e.from.nodeId !== nodeId && e.to.nodeId !== nodeId) } : g);
  };

  const deleteNode = (nodeId: string) => {
    disconnectNode(nodeId);
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setGraph(g => g ? { ...g, nodes: g.nodes.filter(n => n.id !== nodeId) } : g);
  };

  const onPaneContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const local = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    const p = rfRef.current?.project ? rfRef.current.project(local) : { x: 0, y: 0 };
    setCtx({ visible: true, x: local.x, y: local.y, target: 'pane', flowPos: p });
  };

  const onNodeContextMenu = (e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    const bounds = wrapperRef.current?.getBoundingClientRect();
    const local = bounds ? { x: e.clientX - bounds.left, y: e.clientY - bounds.top } : { x: 0, y: 0 };
    setCtx({ visible: true, x: local.x, y: local.y, target: 'node', nodeId: node.id });
  };

  const hideCtx = () => setCtx(null);

  // Fetch action catalog for inspector
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai-graphs/actions', { cache: 'no-store' });
        if (!res.ok) return;
        const list = await res.json();
        if (!cancelled) setActions(list);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const onSelectionChange = useCallback(({ nodes: selNodes }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeId(selNodes && selNodes.length > 0 ? selNodes[0].id : null);
  }, []);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const updateSelectActionName = (value: string) => {
    if (!graph || !selectedNodeId) return;
    setGraph(g => {
      if (!g) return g;
      const next = { ...g, nodes: g.nodes.map(n => n.id === selectedNodeId ? { ...n, config: { ...(n.config || {}), actionName: value } } : n) } as GraphModel;
      return next;
    });
  };

  const LABELS_RU: Record<string, string> = {
    'Sensor.World': 'Сенсор.Мир',
    'Sensor.Character': 'Сенсор.Персонаж',
    'Sensor.Fatigue': 'Сенсор.Усталость',
    'Sensor.Location': 'Сенсор.Локация',
    'Eval.Priority': 'Оценка.Приоритет',
    'Eval.LowHealth': 'Оценка.НизкоеЗдоровье',
    'Eval.IsTired': 'Оценка.Усталость',
    'Eval.IsOverencumbered': 'Оценка.Перегруз',
    'Act.SelectByName': 'Действие.ВыбратьПоИмени',
    'Act.SelectByCategory': 'Действие.ВыбратьПоКатегории',
    'Act.SelectFromList': 'Действие.ВыбратьИзСписка',
    'Act.Wander': 'Действие.Бродить',
  };

  const localizedNodes: Node[] = useMemo(() => nodes.map(n => ({ ...n, data: { label: LABELS_RU[(graph?.nodes.find(x => x.id === n.id)?.type) || ''] || (n.data as any)?.label || '' } })), [nodes, graph]);

  const renderEdges: Edge[] = useMemo(() => showFlow ? edges.map(e => ({ ...e, animated: true, style: { ...(e.style || {}), stroke: 'hsl(var(--primary))' } })) : edges, [edges, showFlow]);

  if (loading) return <div className="p-4 md:p-8 font-body">Загрузка редактора...</div>;

  return (
    <div className="w-full h-[85vh] border rounded-md grid grid-cols-[1fr_360px] font-body">
      <div className="relative" ref={wrapperRef} onContextMenu={onPaneContextMenu} onClick={hideCtx}>
        <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-card">
          <button className="px-3 py-1 border rounded font-body text-sm hover:bg-accent transition-colors" onClick={addSelectNode}>Добавить выбор по имени</button>
          <div className="flex items-center gap-2">
            <select className="border rounded px-2 py-1 bg-background font-body text-sm" value={newType} onChange={(e) => setNewType(e.target.value)}>
              {NODE_TYPES.map(t => (<option key={t} value={t}>{LABELS_RU[t] || t}</option>))}
            </select>
            <button className="px-3 py-1 border rounded font-body text-sm hover:bg-accent transition-colors" onClick={addNodeOfType}>Добавить узел</button>
          </div>
          <button className="px-3 py-1 border rounded font-body text-sm hover:bg-accent transition-colors" onClick={() => setShowFlow(s => !s)}>{showFlow ? 'Спрятать поток' : 'Показать поток'}</button>
          <a className="px-3 py-1 border rounded font-body text-sm hover:bg-accent transition-colors" href="/docs/ai-graph" target="_blank" rel="noreferrer">Документация</a>
          <button className="px-3 py-1 border rounded font-body text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ml-auto" onClick={handleSave}>Сохранить</button>
        </div>
        <ReactFlowProvider>
          <ReactFlow nodes={localizedNodes} edges={renderEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onSelectionChange={onSelectionChange} onNodeContextMenu={onNodeContextMenu} onInit={(inst) => { rfRef.current = inst; }} fitView>
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
        {ctx?.visible && (
          <div className="absolute z-50 bg-popover text-popover-foreground border rounded shadow font-body" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
            {ctx.target === 'pane' && (
              <div className="p-2 space-y-2">
                <div className="text-xs text-muted-foreground font-body">Добавить узел здесь</div>
                <select className="border rounded px-2 py-1 w-56 bg-background font-body text-sm" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  {NODE_TYPES.map(t => (<option key={t} value={t}>{LABELS_RU[t] || t}</option>))}
                </select>
                <button className="w-full px-3 py-1 border rounded font-body text-sm hover:bg-accent transition-colors" onClick={() => { if (ctx.flowPos) addNodeAt(newType, ctx.flowPos); hideCtx(); }}>Добавить</button>
              </div>
            )}
            {ctx.target === 'node' && (
              <div className="p-2 space-y-2 font-body">
                <button className="w-full px-3 py-1 border rounded font-body text-sm hover:bg-accent transition-colors" onClick={() => { if (ctx.nodeId) { disconnectNode(ctx.nodeId); hideCtx(); } }}>Отключить связи</button>
                <button className="w-full px-3 py-1 border rounded font-body text-sm text-destructive hover:bg-destructive/10 transition-colors" onClick={() => { if (ctx.nodeId) { deleteNode(ctx.nodeId); hideCtx(); } }}>Удалить узел</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="border-l p-3 text-sm bg-card/40 overflow-auto font-body">
        <h3 className="font-headline font-semibold text-lg mb-2">Справка</h3>
        <ol className="list-decimal ml-4 mb-3 space-y-1 font-body text-muted-foreground">
          <li>Добавьте узлы (сенсоры/оценки/действия).</li>
          <li>Соедините их линиями от источника к приёмнику.</li>
          <li>Узел действия должен выводить имя выбранного действия.</li>
          <li>Нажмите «Сохранить» — новая логика применится со следующего тика.</li>
        </ol>
        {selectedNode && (
          <div className="space-y-2 border-t pt-3">
            <div className="text-xs text-muted-foreground font-body">Выбран узел: <span className="font-mono text-primary">{(selectedNode.data as any)?.label}</span></div>
            {((graph?.nodes.find(n => n.id === selectedNode.id)?.type) === 'Act.SelectByName') && (
              <div className="space-y-2 font-body">
                <label className="block text-xs font-medium">Действие по имени</label>
                <input className="w-full border rounded px-2 py-1 bg-background font-body text-sm focus:ring-1 focus:ring-primary outline-none" value={String((graph?.nodes.find(n => n.id === selectedNode.id)?.config as any)?.actionName || '')} onChange={(e) => updateSelectActionName(e.target.value)} placeholder="Например: Отдохнуть в таверне" />
                <label className="block text-xs font-medium">Или выбрать из каталога</label>
                <select className="w-full border rounded px-2 py-1 bg-background font-body text-sm focus:ring-1 focus:ring-primary outline-none" onChange={(e) => updateSelectActionName(e.target.value)} value={String((graph?.nodes.find(n => n.id === selectedNode.id)?.config as any)?.actionName || '')}>
                  <option value="">— выберите —</option>
                  {actions.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            {!selectedNode && <div className="text-xs text-muted-foreground font-body">Выберите узел, чтобы настроить его.</div>}
          </div>
        )}
      </div>
      <style jsx global>{`
        /* Улучшение видимости и переносов текста внутри узлов */
        .react-flow__node { 
          min-width: 220px;
          max-width: 340px;
          white-space: normal;
          overflow-wrap: anywhere;
          line-height: 1.2;
        }
        /* Чуть крупнее хэндлы и контраст для нацеливания */
        .react-flow__handle { width: 10px; height: 10px; border: 2px solid var(--foreground); }
      `}</style>
    </div>
  );
}


