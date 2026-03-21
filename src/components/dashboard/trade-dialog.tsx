"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TradeDialog({ itemName, onConfirm }: { itemName: string; onConfirm: (qty: number) => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<number>(1);

  async function confirm() {
    await onConfirm(Math.max(1, qty));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">Купить/Продать</Button>
      </DialogTrigger>
      <DialogContent className="font-body">
        <DialogHeader>
          <DialogTitle className="font-headline">Количество для {itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} className="font-body" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} className="font-body">Отмена</Button>
            <Button onClick={confirm} className="font-body">Подтвердить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


