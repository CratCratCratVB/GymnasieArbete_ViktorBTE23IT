const { application } = require("express");

console.log("client")

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
        document.getElementById("createRoomForm").classList.toggle("hidden");
    } else {
        alert
    }
});