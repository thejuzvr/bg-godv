"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { fetchTelegramSubscriptions, setTelegramSubscriptionActive, type AdminTelegramSubscription } from "../actions";

export default function AdminTelegramPage() {
  const { user, loading } = useAuth(true);
  const { toast } = useToast();
  const [subs, setSubs] = useState<AdminTelegramSubscription[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTelegramSubscriptions();
      if (res.success && res.subs) setSubs(res.subs);
      else toast({ variant: 'destructive', title: 'Ошибка', description: res.error || 'Не удалось загрузить подписки' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user?.isAdmin) load();
  }, [loading, user]);

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Доступ запрещен</CardTitle>
            <CardDescription>У вас нет прав для доступа к этой странице.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Вернуться на дашборд</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-headline text-primary">Telegram подписки</h1>
        <p className="text-muted-foreground">Активные подписки и время последней отправки дайджеста.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Подписчики</CardTitle>
          <CardDescription>Включайте/выключайте подписки по необходимости.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6">Загрузка...</div>
          ) : subs.length === 0 ? (
            <div className="py-6 text-muted-foreground">Подписок не найдено.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Активна</TableHead>
                  <TableHead>Last sent</TableHead>
                  <TableHead>Создано</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.email || s.userId}</TableCell>
                    <TableCell className="font-mono text-xs">{s.chatId}</TableCell>
                    <TableCell>{s.mode}</TableCell>
                    <TableCell>
                      <Switch
                        checked={s.isActive}
                        disabled={busyId === s.id}
                        onCheckedChange={async (checked) => {
                          setBusyId(s.id);
                          const res = await setTelegramSubscriptionActive(s.id, checked);
                          if (!res.success) {
                            toast({ variant: 'destructive', title: 'Ошибка', description: res.error });
                          } else {
                            setSubs(prev => prev.map(p => p.id === s.id ? { ...p, isActive: checked } : p));
                          }
                          setBusyId(null);
                        }}
                      />
                    </TableCell>
                    <TableCell>{s.lastSentAt ? new Date(s.lastSentAt).toLocaleString('ru-RU') : '—'}</TableCell>
                    <TableCell>{s.createdAt ? new Date(s.createdAt).toLocaleString('ru-RU') : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


