const noteInput = document.getElementById("noteInput");
const notePassword = document.getElementById("notePassword");
const saveBtn = document.getElementById("saveBtn");
const unlockBtn = document.getElementById("unlockBtn");
const deleteBtn = document.getElementById("deleteBtn");
const savedNote = document.getElementById("savedNote");

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Convert binary data to text for storage
function toBase64(bytes) {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

// Convert stored text back to binary data
function fromBase64(text) {
    return Uint8Array.from(atob(text), char => char.charCodeAt(0));
}

// Create an encryption key from the password
async function deriveKey(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 310000,
            hash: "SHA-256"
        },
        passwordKey,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a note
async function encryptNote(note, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoder.encode(note)
    );

    return JSON.stringify({
        version: 1,
        salt: toBase64(salt),
        iv: toBase64(iv),
        data: toBase64(new Uint8Array(encrypted))
    });
}

// Decrypt a note
async function decryptNote(stored, password) {
    const payload = JSON.parse(stored);

    if (payload.version !== 1) {
        throw new Error("Unsupported note format");
    }

    const key = await deriveKey(
        password,
        fromBase64(payload.salt)
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: fromBase64(payload.iv)
        },
        key,
        fromBase64(payload.data)
    );

    return decoder.decode(decrypted);
}

// Save an encrypted note
saveBtn.addEventListener("click", async () => {
    const note = noteInput.value;
    const password = notePassword.value;

    if (!note.trim() || !password) {
        alert("Please enter a note and an encryption password.");
        return;
    }

    if (localStorage.getItem("encryptedSecureNote")) {
        const overwrite = confirm(
            "Replace your existing encrypted note?"
        );

        if (!overwrite) return;
    }

    try {
        const encrypted = await encryptNote(note, password);

        localStorage.setItem("encryptedSecureNote", encrypted);

        noteInput.value = "";
        notePassword.value = "";
        savedNote.textContent = "Note encrypted and saved successfully.";

        alert("Your note has been encrypted and saved!");
    } catch (error) {
        alert("Unable to encrypt the note.");
        console.error(error);
    }
});

// Unlock an encrypted note
unlockBtn.addEventListener("click", async () => {
    const stored = localStorage.getItem("encryptedSecureNote");
    const password = notePassword.value;

    if (!stored) {
        alert("No encrypted note found.");
        return;
    }

    if (!password) {
        alert("Please enter your encryption password.");
        return;
    }

    try {
        const note = await decryptNote(stored, password);

        savedNote.textContent = note;
        notePassword.value = "";

        alert("Note unlocked successfully!");
    } catch (error) {
        alert("Incorrect password or damaged encrypted note.");
    }
});

// Delete the encrypted note
deleteBtn.addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure you want to delete your encrypted note?"
    );

    if (!confirmed) return;

    localStorage.removeItem("encryptedSecureNote");

    noteInput.value = "";
    notePassword.value = "";
    savedNote.textContent = "";

    alert("Encrypted note deleted successfully.");
});

// Keep encrypted notes locked when the page opens
window.addEventListener("load", () => {
    if (localStorage.getItem("encryptedSecureNote")) {
        savedNote.textContent = "Encrypted note saved. Enter your password to unlock.";
    }
});