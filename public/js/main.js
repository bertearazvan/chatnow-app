const socket = io();
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users")

// Get username and room from URL using QS library
const {
    username,
    room
} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})


// Join chatroom
socket.emit("joinRoom", {
    username: username,
    room: room
})

//Get room and users
socket.on("roomUsers", ({
    room,
    users
}) => {
    outputRoomName(room);
    outputUsers(users)
})

socket.on("message", data => {
    // console.log(data);
    outputMessage(data);

    //Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
})

// Message submit
chatForm.addEventListener("submit", e => {
    //prevent reload
    e.preventDefault();

    //select the message value
    const msg = e.target.elements.msg.value;

    //emit the event
    socket.emit("chatMessage", msg);
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
})

// Output message to dom

outputMessage = (data) => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<p class="meta">${data.username} <span>${data.time}</span></p>
          <p class="text">
            ${data.text}
          </p>`;
    document.querySelector(".chat-messages").appendChild(div);
}

//Output room name to DOM

outputRoomName = room => {
    roomName.innerText = room;
}

outputUsers = users => {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}