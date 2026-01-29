const loginBtn = document.getElementById("loginBtn");

let msgElem = document.createElement("p");
msgElem.style.color = "red";
msgElem.style.textAlign = "center";
msgElem.style.marginTop = "0.5rem";
document.querySelector(".login-form").appendChild(msgElem);

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msgElem.textContent = "";

  if (!email || !password) {
    msgElem.textContent = "Please fill in all fields!";
    return;
  }

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    window.location.href = "index.html";
  } catch (err) {
    msgElem.textContent = err.message;
  }
});
