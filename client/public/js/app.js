// Подключение к серверу WebSocket
const socket = io("https://your-render-backend-url.onrender.com");

// Элементы интерфейса
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const messagesContainer = document.getElementById("messages-container");
const fileInput = document.getElementById("file-input");

// Текущий пользователь и выбранный контакт
let currentUser = JSON.parse(localStorage.getItem("user"));
let currentContact = null;

// ===== Обработчики событий =====

// Отправка сообщения
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Загрузка файла
document.getElementById("attach-btn").addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });
        const { url } = await response.json();
        sendMessage("", url); // Отправляем URL файла
    } catch (error) {
        console.error("Ошибка загрузки:", error);
    }
});

// ===== Функции =====

// Отправка сообщения
function sendMessage() {
    const content = messageInput.value.trim();
    if (!content && !fileInput.files[0]) return;

    socket.emit("send-message", {
        receiverId: currentContact.id,
        content: content,
        fileUrl: fileInput.files[0] ? "uploaded-file-url" : null
    });

    messageInput.value = "";
    fileInput.value = "";
}

// Получение сообщения
socket.on("new-message", (message) => {
    if (message.senderId === currentContact.id || message.receiverId === currentUser.id) {
        displayMessage(message);
    }
});

// Отображение сообщения
function displayMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    
    if (message.fileUrl) {
        messageElement.innerHTML = `
            <img src="${message.fileUrl}" class="message-file">
        `;
    } else {
        messageElement.textContent = message.content;
    }
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Авторизация
function login(nickname, password) {
    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/app.html";
    });
}

// Инициализация при загрузке
if (window.location.pathname.includes("app.html")) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) window.location.href = "/index.html";
    
    document.getElementById("user-name").textContent = user.nickname;
    document.getElementById("user-avatar").src = user.avatar || "default-avatar.jpg";
}