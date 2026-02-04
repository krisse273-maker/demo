// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

// Initiera Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

window.addEventListener("DOMContentLoaded", async () => {
  const userList = document.querySelector(".user-list");
  const searchInput = document.getElementById("searchInput");
  const logoutBtn = document.getElementById("logoutBtn");

  const popup = document.getElementById("userPopup");
  const closePopup = document.getElementById("closePopup");
  const popupUserName = document.getElementById("popupUserName");
  const banBtn = document.getElementById("banBtn");
  const muteBtns = document.querySelectorAll(".mute-btn");

  let usersData = [];
  let selectedUser = null;

  // Logga ut
  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => window.location.href = "../index.html")
      .catch(err => console.error("Logout error:", err));
  });

  // Kontrollera admin
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "../login.html";

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists || !userDoc.data()?.admin) {
        alert("Access denied! Only admins can access this page.");
        return window.location.href = "../index.html";
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      alert("Failed to verify admin. Try logging in again.");
      return window.location.href = "../login.html";
    }

    loadUsers();
  });

  // Hämta användare
  async function loadUsers() {
    try {
      const snapshot = await db.collection("users").orderBy("name").get();
      usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderUsers(usersData);
    } catch (err) {
      console.error("Error loading users:", err);
      userList.textContent = "Failed to load users.";
    }
  }

  // Rendera användare
  function renderUsers(users) {
    userList.innerHTML = "";
    if (users.length === 0) {
      userList.textContent = "No users found.";
      return;
    }

    const fragment = document.createDocumentFragment();

    users.forEach(user => {
      const div = document.createElement("div");
      div.className = "user-item";
      div.textContent = `${user.name} (${user.email})`;
      div.addEventListener("click", () => openPopup(user));
      fragment.appendChild(div);
    });

    userList.appendChild(fragment);
  }

  // Sökfunktion
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = usersData.filter(u =>
      u.name.toLowerCase().includes(query) ||
      (u.email && u.email.toLowerCase().includes(query))
    );
    renderUsers(filtered);
  });

  // Öppna popup
  function openPopup(user) {
    selectedUser = user;
    popupUserName.textContent = `${user.name} (${user.email})`;
    popup.style.display = "flex";
  }

  // Stäng popup
  closePopup.addEventListener("click", () => {
    popup.style.display = "none";
    selectedUser = null;
  });

  // Ban användare
  banBtn.addEventListener("click", async () => {
    if (!selectedUser) return;
    const confirmBan = confirm(`Are you sure you want to ban ${selectedUser.name}?`);
    if (!confirmBan) return;

    try {
      await db.collection("users").doc(selectedUser.id).update({ banned: true });
      alert(`${selectedUser.name} has been banned.`);
      popup.style.display = "none";
      loadUsers();
    } catch (err) {
      console.error("Error banning user:", err);
      alert("Failed to ban user.");
    }
  });

  // Mute användare
  muteBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!selectedUser) return;
      const hours = parseInt(btn.dataset.hours);
      const now = new Date();
      const muteUntil = new Date(now.getTime() + hours * 60 * 60 * 1000); // X timmar framåt

      try {
        await db.collection("users").doc(selectedUser.id).update({ muteUntil });
        alert(`${selectedUser.name} is muted for ${hours} hour(s).`);
        popup.style.display = "none";
      } catch (err) {
        console.error("Error muting user:", err);
        alert("Failed to mute user.");
      }
    });
  });

});
