# Gymnasiearbete inom Webbserverprogrammering
Detta readme.md fil är till för att visa dokumentationen av mitt gymnasiearbete (CratChat, webbaserad chatt applikation) inom webbserverprogrammering

## 1. HTML / index.html
Detta är grunden till applikationen och fungerar främst för att skapa strukturen för applikationen. Inom filen finns dessutom css i form av en <style> längst upp i <head> av filen samt en <script> portion där det finns viss javascript kod för att utföra vissa funktioner. 

1. 
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

2.
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

3.
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
