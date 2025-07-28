// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCRugv7cn58bHGJLFBjwDteMpc4eEmMMkk",
    authDomain: "sansgram.firebaseapp.com",
    projectId: "sansgram",
    storageBucket: "sansgram.firebasestorage.app",
    messagingSenderId: "843052776681",
    appId: "1:843052776681:web:a7fdebb7b2f605499c8478"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// Инициализация reCAPTCHA
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible'
});

// Обработчик отправки кода
document.getElementById('send-code').addEventListener('click', () => {
    const phoneNumber = document.getElementById('phone-number').value;
    const appVerifier = window.recaptchaVerifier;

    auth.signInWithPhoneNumber(phoneNumber, appVerifier)
        .then(confirmationResult => {
            window.confirmationResult = confirmationResult;
            alert('Код отправлен на ваш телефон');
        })
        .catch(error => {
            console.error(error);
            alert('Ошибка при отправке кода');
        });
});

// Обработчик подтверждения кода
document.getElementById('verify-code').addEventListener('click', () => {
    const code = document.getElementById('verification-code').value;

    window.confirmationResult.confirm(code)
        .then(result => {
            currentUser = result.user;
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'block';
            loadUserData();
            loadChats();
        })
        .catch(error => {
            console.error(error);
            alert('Неверный код');
        });
});

// Вход по номеру телефона выполнен успешно
function loadUserData() {
    document.getElementById('user-name').textContent = currentUser.phoneNumber;
}

// Выйти из аккаунта
document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        currentUser = null;
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('chat-container').style.display = 'none';
        location.reload();
    });
});

// Загрузка списка чатов
function loadChats() {
    const chatListDiv = document.getElementById('chat-list');
    chatListDiv.innerHTML = '';

    db.collection('chats')
      .where('members', 'array-contains', currentUser.uid)
      .onSnapshot(snapshot => {
          chatListDiv.innerHTML = '';
          snapshot.forEach(doc => {
              const chat = doc.data();
              const btn = document.createElement('button');
              btn.textContent = chat.name || 'Без имени';
              btn.onclick = () => openChat(doc.id, chat.name);
              chatListDiv.appendChild(btn);
          });
      });
}

// Создать новый чат
document.getElementById('create-chat').addEventListener('click', () => {
    const chatName = prompt("Введите название чата");
    if (chatName) {
        db.collection('chats').add({
            name: chatName,
            members: [currentUser.uid],
            messages: []
        });
    }
});

let currentChatId = null;

// Открыть чат
function openChat(chatId, chatName) {
    currentChatId = chatId;
    document.getElementById('current-chat-name').textContent = chatName;
    document.getElementById('chat-window').style.display='block';
    
    // Загрузка сообщений
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML='';

    db.collection('chats').doc(chatId).collection('messages')
      .orderBy('timestamp')
      .onSnapshot(snapshot => {
          messagesDiv.innerHTML='';
          snapshot.forEach(doc => {
              const msgData=doc.data();
              const msgDiv=document.createElement('div');
              msgDiv.className='message';
              msgDiv.textContent=`${msgData.sender}: ${msgData.text}`;
              messagesDiv.appendChild(msgDiv);
          });
          messagesDiv.scrollTop=messagesDiv.scrollHeight;
      });
}

// Отправка сообщения
document.getElementById('send-message').addEventListener('click', () => {
   const text=document.getElementById('message-input').value.trim();
   if (text && currentChatId) {
       db.collection('chats').doc(currentChatId).collection('messages')
         .add({
             sender: currentUser.phoneNumber,
             text,
             timestamp: firebase.firestore.FieldValue.serverTimestamp()
         });
       document.getElementById('message-input').value='';
   }
});