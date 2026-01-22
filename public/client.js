console.log("client")

// Connects user to website, 
const socket = io();

function sendMes(msg){

    socket.emit("chat", msg)
    console.log("Message sent: "+msg)

}

socket.on("globalChat", handleChatClient);

function handleChatClient(msg){
    console.log(msg)
}

const mesForm = document.querySelector("#mesForm");
mesForm.addEventListener("submit", submitMes);

function submitMes(ev){
    ev.preventDefault();

    console.log(ev.target.msg);

}