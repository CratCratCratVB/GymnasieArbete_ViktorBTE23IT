// const { application } = require("express");

console.log("client");

// Connects user to website, 
const socket = io({
    withCredentials: true
});

function sendMes(msg){
    socket.emit("chat", msg)
    console.log("Message sent: ", msg)
}

socket.on("globalChat", handleChatClient);

socket.on("notLogged", data =>{
  alert(data.message);
});

function handleChatClient(msg){
    console.log(msg)

    const chatB = document.querySelector("#chatB");
    const mesText = document.createElement("p");

    mesText.innerText = `${msg.username}: ${msg.message}`;
    chatB.appendChild(mesText);

}

const mesForm = document.querySelector("#mesForm");
mesForm.addEventListener("submit", submitMes);

function submitMes(ev){
    ev.preventDefault();
    const msg = ev.target.msg.value;

    if(msg.trim()) sendMes(msg);
    ev.target.msg.value = ""
}

document.getElementById("createRoomForm")?.addEventListener("submit", async (e) => {

    e.preventDefault();
    const roomName = document.getElementById("roomNameInp").value;

    const res = await fetch("/createRoom", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({roomName})
    });


    const data = await res.json();
    if (data.success){
        console.log("Room Created: ", data.room)

        socket.emit("joinRoom", data.room.name);

        alert(`Room "${data.room.name}" created!`);
        document.getElementById("createRoomBtn").classList.add("hidden");
    } else {
        alert("Error: " + data.message);
    }

    console.log("Room submitted: " + roomName);
});

// Rooms and such
async function loadRooms(){
    const res = await fetch("/api/rooms");
    const rooms = await res.json();

    const roomList = document.getElementById("roomList");
    roomList.innerHTML = "";

    if(rooms.length === 0){
        roomList.innerHTML = "<p>No rooms created, sad... :(</p>"
        return;
    }
    
    rooms.forEach(room => {
        const div = document.createElement("div");
        div.style.border = "1px solid";
        div.style.padding = "10px";
        div.style.margin = "10px";
        div.style.borderRadius = "10px";

        div.innerHTML = `
        <strong>${room.name}</strong>
        <br>
        <button data-room="${room.name}">Join room</button> 
        `;

        roomList.appendChild(div);
    });

    document.querySelectorAll("button[data-room]").forEach(btn => {
        btn.addEventListener("click", () => {
            const roomName = btn.dataset.room
            socket.emit("joinRoom", roomName);
            alert("Joined: " + roomName);
            window.location.href = "/home";
        });
    });
}

loadRooms();