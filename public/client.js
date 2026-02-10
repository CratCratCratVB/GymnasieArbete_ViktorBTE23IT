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