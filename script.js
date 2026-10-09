const noteInput = document.getElementById("noteInput");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const savedNote = document.getElementById("savedNote");


// Load saved note automatically
window.onload = () => {

    const note = localStorage.getItem("secureNote");

    if(note){
        savedNote.textContent = note;
    }

};


// Save Note
saveBtn.addEventListener("click", () => {

    const note = noteInput.value;

    localStorage.setItem("secureNote", note);

    savedNote.textContent = note;

    alert("Note saved successfully!");

});


// Delete Note
deleteBtn.addEventListener("click", () => {

    localStorage.removeItem("secureNote");

    savedNote.textContent = "";

    noteInput.value = "";

    alert("Note deleted successfully!");

});