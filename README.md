Ход мыслей при поиске ошибок:

1) Установил пакеты, запускаю приложение. Даже не запускается.
2) Проходимся по файлам. Обнаружил что в server.ts горят две красные ошибки.
Первую ошибку в функции conn.onInialize исправил с помощью чтения документации language server.
Добавил textDocumentSync.
Вторая ошибка в функции validateProperty меняем property.key.loc -> property.loc Чтобы её исправить я посмотрел интерфейсы в файле json-to-ast.
3) Запускаем проект. Результат уже неплох, плагин запустился. Открываю превью и в новом окне получаю {{content}}.
Проверил регулярное выражение. Чтобы оно работало, в шаблоне должны быть отступы между фигурными скобками и названием.
Не стал переписывать регулярку, просто поменял {{content}} -> {{ content }} и т.д. в preview index.html.
4) Открываем превью ещё раз. Теперь оно пустое. Добавил css стили из первого задания в style.css. Принялся снова читать документацию и понял, что
ошибка в подключении стилей. В функции updateContent файла extension добавил подключение css и js. Теперь превью работает.
5) Начинаем работу с линтером. Переходим в package.json и включаем его example.enable.default: true. Теперь при открытии json сыпятся ошибки.
6) Ошибка с получение файла json. Мы передавали в функцию линтера путь к json, а необходимо передавать именно сам json.
В функции validateTextDocument сервера меняем:
const json = textDocument.uri -> const json = textDocument.getText();
7) Ошибок больше нет, но и линтер не работает. Тестировал саму функцию линтера, смотрел где происходит потеря данных. В итоге пришел к тому, что
ошибки не пушатся в массив и массив ошибок не возвращается из функции. Меняем тип возвращаемого значения у cbProp и cbObj с void на массив ошибок LinterProblem<TProblemKey>[].
Пушим результаты этих функций в массив errors и возвращаем его из функции. При вызове функции walk меняем параметры и линтер-заглушка работает.
8) Подключил свой линтер. Для обнаружения ошибок не стал использовать ast, быстрее было чуть поменять алгоритм поиска из моего линтера.


В ветке example находится линтер из примера.
В master линтер со второго задания.
