const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: 'uploads/avatars',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Регистрация
router.post('/register', upload.single('avatar'), async (req, res) => {
    try {
        const { nickname, email, password } = req.body;
        
        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Путь к аватарке
        const avatar = req.file ? req.file.path : null;
        
        // Сохранение в БД
        db.createUser(nickname, email, hashedPassword, avatar);
        
        res.status(201).json({ message: 'Аккаунт создан!' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    const { nickname, password } = req.body;
    
    // Поиск пользователя
    const user = db.getUserByNickname(nickname);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
        return res.status(401).json({ error: 'Неверный пароль' });
    }
    
    // Генерация токена (упрощённо)
    res.json({ 
        token: 'JWT_TOKEN', 
        user: { id: user.id, nickname: user.nickname, avatar: user.avatar } 
    });
});

module.exports = router;