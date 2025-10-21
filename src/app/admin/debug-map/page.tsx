"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, MapPinned, Save, PlusCircle } from "lucide-react";

// Debug markers persisted locally (per admin browser)
interface DebugMarker {
  id: string;
  name: string;
  x: number; // percentage (0..100)
  y: number; // percentage (0..100)
}

export default function AdminDebugMapPage() {
  const { user, loading } = useAuth(true);
  const router = useRouter();
  const [markers, setMarkers] = useState<DebugMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load markers from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("debugMarkers") : null;
      if (raw) setMarkers(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("debugMarkers", JSON.stringify(markers));
    } catch {}
  }, [markers]);

  // Guard for non-admins
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace("/dashboard");
  }, [user, loading, router]);

  const addMarker = () => {
    const id = crypto.randomUUID();
    setMarkers((prev) => prev.concat({ id, name: `Метка ${prev.length + 1}`, x: 50, y: 50 }));
    setSelectedId(id);
  };

  const removeMarker = (id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateMarker = (id: string, patch: Partial<DebugMarker>) => {
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const active = useMemo(() => markers.find((m) => m.id === selectedId) || null, [markers, selectedId]);

  const onMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !active) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateMarker(active.id, { x: xPct, y: yPct });
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const id = e.dataTransfer.getData("text/plain");
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateMarker(id, { x, y });
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка…</div>;
  }

  if (!user.isAdmin) {
    return null;
  }

  return (
    <div className="w-full p-4 md:p-8 space-y-6">
      <header className="flex items-center gap-2">
        <MapPinned className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-headline">Debug Map</h1>
      </header>
      <p className="text-sm text-muted-foreground">Перетаскивайте маркеры по карте. Координаты сохраняются в браузере (localStorage).</p>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Карта</CardTitle>
            <CardDescription>Клик по карте — переместить выбранную метку.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative w-full h-[60vh] rounded-lg border overflow-hidden bg-muted"
              onClick={onMapClick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              {/* Background world map */}
              <img
                src="/images/world-map/SR-map-Skyrim_DE.svg"
                alt="World Map"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Markers */}
              {markers.map((m) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, m.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(m.id);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 ${
                    selectedId === m.id ? "border-accent bg-accent/20" : "border-primary bg-primary/20"
                  }`}
                  style={{ top: `${m.y}%`, left: `${m.x}%`, width: 24, height: 24 }}
                  title={`${m.name} (${m.x.toFixed(2)}%, ${m.y.toFixed(2)}%)`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Метки</CardTitle>
            <CardDescription>Создавайте, переименовывайте и удаляйте метки.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={addMarker} className="gap-2"><PlusCircle className="h-4 w-4"/>Добавить</Button>
            </div>
            <Separator />
            <div className="space-y-3">
              {markers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Метки не созданы.</p>
              ) : (
                markers.map((m) => (
                  <div key={m.id} className={`rounded-md border p-3 ${selectedId === m.id ? "ring-1 ring-accent" : ""}`}>
                    <div className="flex items-center gap-2">
                      <Input
                        value={m.name}
                        onChange={(e) => updateMarker(m.id, { name: e.target.value })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeMarker(m.id)} aria-label="Удалить">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X (%)</Label>
                        <Input type="number" step="0.01" value={m.x.toFixed(2)} onChange={(e) => updateMarker(m.id, { x: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">Y (%)</Label>
                        <Input type="number" step="0.01" value={m.y.toFixed(2)} onChange={(e) => updateMarker(m.id, { y: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
