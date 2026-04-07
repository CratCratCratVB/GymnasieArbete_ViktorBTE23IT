# Gymnasiearbete inom Webbserverprogrammering
Detta readme.md fil är till för att visa dokumentationen av mitt gymnasiearbete (CratChat, webbaserad chatt applikation) inom webbserverprogrammering

## 1. HTML / index.html
Detta är grunden till applikationen och fungerar främst för att skapa strukturen för applikationen. Inom filen finns dessutom css i form av en <style> längst upp i <head> av filen samt en <script> portion där det finns viss javascript kod för att utföra vissa funktioner. 

1. Enkel JavaScript för att dölja/visa element 
```
        function toggleCreateRoom(){
            document.getElementById("createRoomBtn").classList.toggle("hidden");
        }
        function toggleRoomsList(){
            document.getElementById("roomsListBox").classList.toggle("hidden");
            loadRooms();
        }
```
Dessa används för att kunna toggla "hidden" klassen på vissa delar av HTML:en när en användare klickar på den specifika elementet, exempel:
```
//användare klickar på denna <a> element
  <a href="#" id="createR" onclick="toggleCreateRoom()">Create Room</a>


//följande element visas/döljs för användaren

    <div class="createRoom" id="createRoomBtn">
        <h2>Create a Room</h2>
        <form action="/createRoom" id="createRoomForm" method="post">
            <input name="roomName" type="text" id="roomNameInp" placeholder="Room Name: ">
            <button type="submit">Create</button>
        </form>
    </div>
```
Den andra funktionen ( function toggleRoomsList(){ ... } ) fungerar likadant förutom att den innehåller även en annan funktion ( loadRooms(): ) vilket används för att skaffa information om befintliga rum ifrån en separat databas fil (.JSON). 

2. Toggle för element samt visa enbart en element åt gången
```
        show = id => {

            const logOptBox = document.getElementById(id);
            if(!logOptBox.classList.contains("hidden")){
                logOptBox.classList.add("hidden");
                return;
            }

            registerBox.classList.add("hidden"); 
            loginBox.classList.add("hidden");

            document.getElementById(id).classList.remove("hidden");
        };
```
Detta funktion ( show(id) ) används som en sorts toggle för två specifika element (registerBox och loginBox) för att kunna ha enbart <i>en</i> av elementen synlig åt gången.

3. Funktion för att visa specifika element beroende på användarens status (inloggad eller inte)
```
        fetch("/auth_stats")
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn){
                    document.getElementById("registerOpt").classList.add("hidden");
                    document.getElementById("loginOpt").classList.add("hidden");
                    document.getElementById("createRoomBtn").classList.add("hidden");
                    document.getElementById("rooms").classList.remove("hidden");
                    document.getElementById("createR").classList.remove("hidden");
                }
                else {
                    document.getElementById("registerOpt").classList.remove("hidden");
                    document.getElementById("loginOpt").classList.remove("hidden");
                    document.getElementById("logOut").classList.add("hidden");
                    document.getElementById("rooms").classList.add("hidden");
                    document.getElementById("createR").classList.add("hidden");
                    document.getElementById("createRoomBtn").classList.add("hidden");
                }
            });
```
Detta funktion börjar först med att skicka en fetch (GET request för /auth_stats) för att kolla om användaren är inloggad eller inte (återkommer vidare i huvud .js filen (index.js) ), göra om det till en JavaScript objekt ( .then(res => res.json()) ) för att sedan bestämma vilka element som ska få klassen "hidden" samt vilka som inte ska ha den när användaren brukar applikationen beroende på deras status. 

## 2. JavaScript / index.js
Detta är JavaScript koden vilket används på servern och samspelar med klienten (client.js) för att applikationen ska kunna fungera som den ska. 

1. Funktioner samt en route för att ladda rum / spara rum till en .JSON fil, /api/rooms route för att koppla loadRooms till klient-sidan (client.js).
```
function loadRooms(){
  if(!fs.existsSync("rooms.json")){
    fs.writeFileSync("rooms.json", "[]");
  }
  return JSON.parse(fs.readFileSync("rooms.json").toString());
}

function saveRooms(rooms){
  fs.writeFileSync("rooms.json", JSON.stringify(rooms, null, 2))
}

// get rooms
app.get("/api/rooms", (req,res) => {
  const rooms = loadRooms();
  res.json(rooms);
});
```
Dessa funktioner används på några ställen där det krävs och dess funktionalitet är för att kunna ladda en lista av alla tillgängliga rum ( function loadRooms(){...} ), spara ner alla rum till en .JSON (rooms.json). Den sista delen (app.get("/api/rooms",  (req,res) => {...}); ) används för att kunna skapa en route vilket klienten lyssnar av för att loadRooms(); funktionen ska kunna användas och på så sätt ladda in alla tillgängliga rum.

2. Funktion som lägger till en koppling till klienten med servern (addConnection) samt vidare funktioner för att användaren ska kunna interagera med applikationen. Sparande, laddning, redigering och radering av tidigare skickade meddelander
```
function addConnection(socket){
    console.log("Connected");

    //join room
    socket.on("joinRoom", async (roomName) => {
      const user = socket.request.session.user;

      if(!user){
        return socket.emit("notLogged",
          {message:"You must be logged in to use this function!"});
      }


//loading room history (old messages)
      socket.join(roomName);


      const allMes = await getData("roomMessages.json");
      const roomMesHistory = allMes[roomName] || [];

      socket.emit("roomHistory", {
        room: roomName,
        history: roomMesHistory
      });

      //console.log(`${socket.id} joined room ${roomName}`); logging for user join

      socket.emit("roomJoined", {room: roomName});

      socket.to(roomName).emit("userJoined", {
        username: user.username,
        room: roomName
      });
    });

    //leaving room
    socket.on("leaveRoom", (roomName) =>{
      socket.leave(roomName);
      console.log(`${socket.id} left room ${roomName}`);

      socket.emit("roomLeft", {room: roomName});

      socket.to(roomName).emit("userLeftR", {
        username: socket.request.session.user?.username,
        room: roomName
      });
    });

    //room chatting (plz work :) )
    socket.on("roomChat", ({room, message}) => {
      handleRoomChat(room, message, socket);
    });

    //message editor (server)
    socket.on("editMes", async ({ room, mesID, newText}) => {
      const user = socket.request.session.user;
      if (!user) return socket.emit("notLogged", { message: "You must be logged in to use this function!" });
    
      const allMes = await getData("roomMessages.json");
      const roomMessages = allMes[room] || [];
    
      const msg = roomMessages.find(m => m.id === mesID);
      if (!msg) return;
      if (msg.username !== user.username) return;
    
      msg.message = newText;
      msg.edited = true;
    
      await saveData("roomMessages.json", allMes);
    
      io.to(room).emit("messageEdit", {
        id: mesID,
        newText: msg.message,
        room: room
      });
    });


    //delete message (server)
    socket.on("messageDel", async ({ room, mesID }) => {
      const user = socket.request.session.user;
      if (!user) return socket.emit("notLogged", { message: "You must be logged in to use this function!" });
    
      const allMes = await getData("roomMessages.json");
      const roomMessages = allMes[room] || [];
    
      const msgIndex = roomMessages.findIndex(m => m.id === mesID);
      if (msgIndex === -1) return;
    
      if (roomMessages[msgIndex].username !== user.username) return;
    
      roomMessages.splice(msgIndex, 1);
    
      await saveData("roomMessages.json", allMes);
    
      io.to(room).emit("messageDel", {
        id: mesID,
        room: room
      });
    });
}
```

3. handleRoomChat funktion vilket används för att hantera meddelander som användare skickar (sätta information om meddelandet som vilket användare som skickade, specifik id, meddelandets innehåll samt tiden då meddelandet skickades.)
```
async function handleRoomChat(room, msg, socket){
  const user = socket.request.session.user;
  const mesID = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  if(!user){
    return socket.emit("notLogged", {
      message: "You must be logged in to use this function!"
    });
  }


  //adding new messages to file / loading from file
  const allMes = await getData("roomMessages.json");
  if (!allMes[room]) allMes[room] = [];

  //add new message
  allMes[room].push({
    id: mesID,
    username: user.username,
    message: msg,
    ToS: Date.now()
  });

  //save updated messages
  await saveData("roomMessages.json", allMes);

  io.to(room).emit("roomMessage",{
    id: mesID,
    username: user.username,
    message: msg,
    room: room,
    ToS: Date.now()
  });
}
```
Resterande delar av koden inom filen är främst routes för att kunna koppla index.js till client.js, som inloggningar och registrering osv.

## 3. Klienten / client.js
Detta fil innehåller huvudsakligen routes som kopplar till index.js (servern) och funktioner vilka gör det möjligt för användare att använda applikationen. 

1. Funktion för att skaffa information om användaren och bekräfta att de är inloggade.
```
async function loadUser(){
    const res = await fetch("/auth_stats");
    const data = await res.json();

    if(data.loggedIn){
        window.currentUser = data.username;
    } else {
        window.currentUser = null;
    }
}

loadUser();

```

2. Funktion vilket gör det möjligt för att användare ska kunna skapa rum, går omedelbart in i rummet med hjälp av websockets efter rummet skapats. 
```
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

        await loadUser();

        window.currentRoom = data.room.name;
        socket.emit("joinRoom", data.room.name); 

        alert(`Room "${data.room.name}" created!`);
    
        document.getElementById("createRoomBtn").classList.add("hidden");
        document.getElementById("chatHere").classList.remove("hidden");
        document.getElementById("roomTitle").innerText = "Room: " + data.room.name;

    } else {
        alert("Error: " + data.message);
    }

    console.log("Room submitted: " + roomName);
});
```

3. Funktion vilket används för att ta fram listan av alla rum för att sedan skapa "cards" vilket användaren kan interagera med för att gå med i just det rummet med hjälp av websockets. All tidigare data som skickats i rummet sparas och laddas när användaren går med, korrekt namn visas och vyn ändras till rummet istället för att visa listan.
```
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
        btn.addEventListener("click", async () => {
            await loadUser();
            const roomName = btn.dataset.room;

            window.currentRoom = roomName;
            socket.emit("joinRoom", roomName);


            document.getElementById("roomMessages").innerHTML = ""
            document.getElementById("roomTitle").innerText = "Room: " + roomName;
            document.getElementById("roomsListBox")?.classList.add("hidden");
            document.getElementById("chatHere")?.classList.remove("hidden");

            alert("Joined: " + roomName);
        });
    });
}
```

All kod som visas i detta readme.md fil är särskilt viktiga eftersom de täcker nya ämnen vilket jag själv behövde gå igenom och studera för att få de att fungera så bra som möjligt. Mitt gymnasiearbete handlar främst om websockets men använder ett antal andra metoder vilka bygger på applikationen (ex. Bcyrpt, express, session osv...) men nämns inte  direkt då dessa inte är fokusämnet av mitt arbete men spelar fortfarande stor roll. 
