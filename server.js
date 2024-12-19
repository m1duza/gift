const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');

// Настройки MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
     password: '32953m4a4%', // Ваш пароль
    database: 'drawing_app'
});

db.connect(err => {
    if (err) throw err;
    console.log('Подключение к базе данных успешно!');
});

// Создание таблицы (один раз)
db.query(`
    CREATE TABLE IF NOT EXISTS drawings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        x FLOAT NOT NULL,
        y FLOAT NOT NULL
    )
`, (err) => {
    if (err) throw err;
    console.log('Таблица drawings создана или уже существует.');
});

// Настройка сервера
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// События Socket.IO
io.on('connection', (socket) => {
    console.log('Новый пользователь подключился:', socket.id);

    // Отправка существующих данных клиенту
    db.query('SELECT x, y FROM drawings', (err, results) => {
        if (err) throw err;
        socket.emit('init', results);
    });

    // Обработка рисования
    socket.on('draw', ({ x, y }) => {
        // Сохранение точки в базу данных
        db.query('INSERT INTO drawings (x, y) VALUES (?, ?)', [x, y], (err) => {
            if (err) throw err;
        });

        // Рассылка точки всем пользователям
        socket.broadcast.emit('draw', { x, y });
    });

    // Очистка холста
    socket.on('clear', () => {
        db.query('DELETE FROM drawings', (err) => {
            if (err) throw err;
        });
        io.emit('clear');
    });
});

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

