const loginBtn = document.getElementById("loginBtn");

// Skapa ett meddelande-element under formuläret
let msgElem = document.createElement("p");
msgElem.style.color = "red";
msgElem.style.textAlign = "center";
msgElem.style.marginTop = "0.5rem";
const formDiv = document.querySelector(".login-form");
formDiv.appendChild(msgElem);

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msgElem.textContent = ""; // töm meddelande varje gång

  if (!email || !password) {
    msgElem.textContent = "Please fill in all fields!";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Hasha lösenordet samma som vid registrering
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Kolla om e-posten finns
  const user = users.find(u => u.email === email);
  if (!user) {
    msgElem.textContent = "This account does not exist!";
    return;
  }

  // Kolla lösenord
  if (user.password !== hashedPassword) {
    msgElem.textContent = "Incorrect password!";
    return;
  }

  // Om allt är rätt
  localStorage.setItem("currentUser", JSON.stringify(user));
  window.location.href = "index.html";
});
