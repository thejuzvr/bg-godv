"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { SectionContainer } from "@/components/layout/section-container";

export default function AIGraphDocsPage() {
  return (
    <PageContainer maxWidth="3xl">
      <SectionContainer>
        <header>
          <h1 className="text-4xl font-headline text-primary">Редактор сознания (AI Graph)</h1>
          <p className="text-lg text-muted-foreground mt-2 font-body">Краткая справка по узлам и работе редактора.</p>
        </header>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Узлы</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2 font-body text-foreground/90">
              <li><strong className="text-primary">Сенсор.Мир (Sensor.World):</strong> world — снимок мира</li>
              <li><strong className="text-primary">Сенсор.Персонаж (Sensor.Character):</strong> character</li>
              <li><strong className="text-primary">Сенсор.Усталость (Sensor.Fatigue):</strong> ratio 0..1</li>
              <li><strong className="text-primary">Сенсор.Локация (Sensor.Location):</strong> locationId, isSafe</li>
              <li><strong className="text-primary">Оценка.Приоритет (Eval.Priority):</strong> selectedActionName — выбор лучшего действия</li>
              <li><strong className="text-primary">Оценка.НизкоеЗдоровье (Eval.LowHealth):</strong> low (boolean), порог config.threshold</li>
              <li><strong className="text-primary">Оценка.Усталость (Eval.IsTired):</strong> tired (boolean), порог config.threshold</li>
              <li><strong className="text-primary">Оценка.Перегруз (Eval.IsOverencumbered):</strong> over (boolean)</li>
              <li><strong className="text-primary">Действие.ВыбратьПоИмени (Act.SelectByName):</strong> config.actionName</li>
              <li><strong className="text-primary">Действие.ВыбратьПоКатегории (Act.SelectByCategory):</strong> config.category</li>
              <li><strong className="text-primary">Действие.ВыбратьИзСписка (Act.SelectFromList):</strong> config.names[]</li>
              <li><strong className="text-primary">Действие.Бродить (Act.Wander):</strong> фиксированный выбор «бродить»</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Как работать</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal ml-6 space-y-2 font-body text-foreground/90">
              <li><strong className="text-primary">ПКМ</strong> по пустому месту — добавить узел в точке клика.</li>
              <li><strong className="text-primary">ПКМ</strong> по узлу — отключить связи или удалить узел.</li>
              <li>Соединяйте узлы: источник → приёмник.</li>
              <li>Нажмите <strong className="text-primary">«Сохранить»</strong> — применяется со следующего тика.</li>
              <li>Кнопка <strong className="text-primary">«Показать поток»</strong> — анимация движения по связям.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm border-l-4 border-l-primary/60">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Советы</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2 font-body text-foreground/90">
              <li>Начните с <strong className="text-primary">«Оценка.Приоритет»</strong> — рабочая база.</li>
              <li>Для жестких сценариев используйте <strong className="text-primary">«Действие.*»</strong> — перекроют приоритет.</li>
              <li>Пороги здоровья/усталости задаются в <strong className="text-primary">config.threshold</strong>.</li>
            </ul>
          </CardContent>
        </Card>
      </SectionContainer>
    </PageContainer>
  );
}
