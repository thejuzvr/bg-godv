"use client";

export default function AIGraphDocsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-headline">Редактор сознания (AI Graph)</h1>
      <p>Краткая справка по узлам и работе редактора.</p>
      <h2 className="text-xl font-semibold mt-4">Узлы</h2>
      <ul className="list-disc ml-6 space-y-1">
        <li>Сенсор.Мир (Sensor.World): world — снимок мира</li>
        <li>Сенсор.Персонаж (Sensor.Character): character</li>
        <li>Сенсор.Усталость (Sensor.Fatigue): ratio 0..1</li>
        <li>Сенсор.Локация (Sensor.Location): locationId, isSafe</li>
        <li>Оценка.Приоритет (Eval.Priority): selectedActionName — выбор лучшего действия</li>
        <li>Оценка.НизкоеЗдоровье (Eval.LowHealth): low (boolean), порог config.threshold</li>
        <li>Оценка.Усталость (Eval.IsTired): tired (boolean), порог config.threshold</li>
        <li>Оценка.Перегруз (Eval.IsOverencumbered): over (boolean)</li>
        <li>Действие.ВыбратьПоИмени (Act.SelectByName): config.actionName</li>
        <li>Действие.ВыбратьПоКатегории (Act.SelectByCategory): config.category</li>
        <li>Действие.ВыбратьИзСписка (Act.SelectFromList): config.names[]</li>
        <li>Действие.Бродить (Act.Wander): фиксированный выбор «бродить»</li>
      </ul>
      <h2 className="text-xl font-semibold mt-4">Как работать</h2>
      <ol className="list-decimal ml-6 space-y-1">
        <li>ПКМ по пустому месту — добавить узел в точке клика.</li>
        <li>ПКМ по узлу — отключить связи или удалить узел.</li>
        <li>Соединяйте узлы: источник → приёмник.</li>
        <li>Нажмите «Сохранить» — применяется со следующего тика.</li>
        <li>Кнопка «Показать поток» — анимация движения по связям.</li>
      </ol>
      <h2 className="text-xl font-semibold mt-4">Советы</h2>
      <ul className="list-disc ml-6 space-y-1">
        <li>Начните с «Оценка.Приоритет» — рабочая база.</li>
        <li>Для жестких сценариев используйте «Действие.*» — перекроют приоритет.</li>
        <li>Пороги здоровья/усталости задаются в config.threshold.</li>
      </ul>
    </div>
  );
}


