# Редактор сознания (AI Graph)

Эта страница объясняет, как пользоваться редактором узлов и что делает каждый узел.

## Узлы
- Сенсор.Мир (`Sensor.World`): world — снимок мира
- Сенсор.Персонаж (`Sensor.Character`): character
- Сенсор.Усталость (`Sensor.Fatigue`): ratio (0..1)
- Сенсор.Локация (`Sensor.Location`): locationId, isSafe
- Оценка.Приоритет (`Eval.Priority`): selectedActionName — выбор лучшего действия
- Оценка.НизкоеЗдоровье (`Eval.LowHealth`): low (boolean), порог `config.threshold`
- Оценка.Усталость (`Eval.IsTired`): tired (boolean), порог `config.threshold`
- Оценка.Перегруз (`Eval.IsOverencumbered`): over (boolean)
- Действие.ВыбратьПоИмени (`Act.SelectByName`): `config.actionName`
- Действие.ВыбратьПоКатегории (`Act.SelectByCategory`): `config.category`
- Действие.ВыбратьИзСписка (`Act.SelectFromList`): `config.names[]`
- Действие.Бродить (`Act.Wander`): selectedActionName = «бродить»

## Как работать
1) ПКМ по пустому месту — добавить узел в точке клика
2) ПКМ по узлу — отключить связи или удалить узел
3) Соединяйте узлы: источник → приёмник
4) Нажмите «Сохранить» — применяется со следующего тика
5) «Показать поток» — включает анимацию по рёбрам

## Советы
- Начните с «Оценка.Приоритет» — это рабочая база
- Для жестких сценариев используйте «Действие.*», они перекрывают приоритет
- Пороги здоровья/усталости задаются в `config.threshold`
