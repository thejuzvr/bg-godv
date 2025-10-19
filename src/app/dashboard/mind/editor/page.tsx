"use client";

import { useAuth } from '@/hooks/use-auth';
import { AiGraphEditor } from '@/components/ai-graph/Editor';

export default function MindEditorPage() {
  const { user, loading } = useAuth(true);
  if (loading) return <div className="p-4">Загрузка...</div>;
  if (!user) return <div className="p-4">Требуется вход</div>;
  return (
    <div className="p-4">
      <h2 className="text-2xl font-headline mb-4">Редактор сознания</h2>
      <AiGraphEditor characterId={user.userId} />
    </div>
  );
}


