// ===== Firebase setup =====
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== Custom Mute Alert =====
function showCustomMuteAlert(message) {
  const backdrop = document.getElementById("customAlertBackdrop");
  const msg = document.getElementById("alertMessage");
  const okBtn = document.getElementById("alertOkBtn");

  msg.textContent = message;
  backdrop.classList.remove("hidden");

  okBtn.onclick = () => {
    backdrop.classList.add("hidden");
  };
}

// Ny funktion för att visa alla typer av alerts
function showAlert(message) {
  showCustomMuteAlert(message);
}

// ===== DOM elements =====
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const emojiError = document.getElementById("emojiError");
const foodTitle = document.getElementById("foodTitle");
const foodCountry = document.getElementById("foodCountry");
const foodCity = document.getElementById("foodCity");
const addFoodForm = document.getElementById("addFoodForm");
const foodListContainer = document.querySelector(".my-food-list");
const publicFoodListContainer = document.querySelector(".public-food-list");

const logoutBtn = document.getElementById("logoutBtn"); // ✅ logout
const homeBtn = document.getElementById("homeBtn");     // ✅ home

let selectedEmoji = "";
let countriesData = [];
let currentUserData = null; // här sparar vi användardata inkl mute/banned
let userDocUnsubscribe = null; // för realtidslyssnare

// ===== Home & Logout knappar =====
window.addEventListener("DOMContentLoaded", () => {
  // Logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
      window.location.href = "../login.html"; // redirect till login
    } catch (err) {
      console.error("Logout failed:", err);
      showAlert("Failed to log out.");
    }
  });

  // Home
  homeBtn.addEventListener("click", () => {
    window.location.href = "../index.html"; // redirect till home
  });
});

// ===== Emoji picker =====
emojiPickerBtn.addEventListener("click", () => {
  emojiPicker.style.display =
    emojiPicker.style.display === "flex" ? "none" : "flex";
});

emojiPicker.querySelectorAll("span").forEach((span) => {
  span.addEventListener("click", () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = selectedEmoji;
    emojiPicker.style.display = "none";
    emojiError.style.display = "none"; // göm felmeddelande direkt
  });
});

// ===== Country & City - Dynamiskt =====
async function loadCountries() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    // Rensa och fyll landet dropdown
    foodCountry.innerHTML = '<option value="">Select Country</option>';
    countriesData.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      foodCountry.appendChild(opt);
    });
    foodCountry.disabled = false;
  } catch (err) {
    console.error("Failed to fetch countries:", err);
    showAlert("Failed to load countries. Try refreshing.");
  }
}

// Uppdaterad event listener för landval, med kontroll för saknade städer
foodCountry.addEventListener("change", () => {
  foodCity.innerHTML = '<option value="">Select City</option>';
  foodCity.disabled = true;

  const countryObj = countriesData.find((c) => c.country === foodCountry.value);
  if (!countryObj || !countryObj.cities || countryObj.cities.length === 0) {
    // Inga städer tillgängliga
    console.log("Inga städer tillgängliga för detta land");
    return;
  }

  // Fyll i städer om de finns
  countryObj.cities.forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    foodCity.appendChild(opt);
  });
  foodCity.disabled = false;
});

// Kör direkt vid sidladdning
loadCountries();

// ===== Kontrollera användarstatus i realtid =====
async function setupUserListener() {
  const user = auth.currentUser;
  if (!user) return;

  if (userDocUnsubscribe) userDocUnsubscribe(); // stoppa tidigare lyssnare om det finns

  userDocUnsubscribe = db.collection("users").doc(user.uid)
    .onSnapshot((docSnap) => {
      if (!docSnap.exists) return;
      currentUserData = docSnap.data();

      const now = new Date();

      // Banned
      if (currentUserData.banned === true) {
        addFoodForm.querySelectorAll("input, select, button").forEach(el => el.disabled = true);

        // Visa meddelande
        const bannedMsg = document.createElement("div");
        bannedMsg.style.background = "#ffcccc";
        bannedMsg.style.padding = "10px";
        bannedMsg.style.marginBottom = "10px";
        bannedMsg.style.border = "1px solid red";
        bannedMsg.textContent = "You have been banned by an admin. Logging out...";
        document.body.prepend(bannedMsg);

        // Logga ut efter kort timeout
        setTimeout(() => {
          auth.signOut().then(() => window.location.href = "../index.html");
        }, 500);

        return;
      }

      // Muted
      if (currentUserData.muteUntil) {
        const muteDate = currentUserData.muteUntil.toDate ? currentUserData.muteUntil.toDate() : new Date(currentUserData.muteUntil);
        if (muteDate > now) {
          showAlert(`You are muted until ${muteDate.toLocaleString()}. You cannot post foods right now.`);
        }
      }
    });
}

// ===== Valideringsfunktion för Food Name =====
function validateTitle(title) {
  const minLength = 5; // Minsta antal tecken
  const maxTitleLength = 20; // Max antal tecken
  const regex = /^[a-zA-Z0-9\s\-]+$/; // tillåter bokstäver, siffror, mellanslag, bindestreck

  if (!title) {
    return "⚠️ Title cannot be empty.";
  }
  if (title.trim().length < minLength) {
    return `⚠️ Title must be at least ${minLength} characters long.`;
  }
  if (title.length > maxTitleLength) {
    return `⚠️ Title cannot be longer than ${maxTitleLength} characters.`;
  }
  if (!regex.test(title)) {
    return "⚠️ Title contains invalid characters.";
  }
  return null; // inga fel
}

// ===== Kontrollera mutstatus separat =====
function checkMuteStatus() {
  if (currentUserData?.muteUntil) {
    const muteDate = currentUserData.muteUntil.toDate ? currentUserData.muteUntil.toDate() : new Date(currentUserData.muteUntil);
    if (muteDate > new Date()) {
      showAlert(`You are muted until ${muteDate.toLocaleString()}.`);
      return true; // mutad
    }
  }
  return false; // inte mutad
}

// ===== Add food to Firestore =====
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Kontrollera mutstatus först
  if (checkMuteStatus()) {
    return; // avbryt om mutad
  }

  const user = auth.currentUser;
  if (!user) return showAlert("You must be logged in!");

  // Kolla mute/banned innan posten
  if (currentUserData?.banned) {
    return showAlert("You are banned and cannot post foods.");
  }
  if (currentUserData?.muteUntil) {
    const muteDate = currentUserData.muteUntil.toDate ? currentUserData.muteUntil.toDate() : new Date(currentUserData.muteUntil);
    if (muteDate > new Date()) {
      return showAlert(`You are muted until ${muteDate.toLocaleString()}. You cannot post foods right now.`);
    }
  }

  const title = foodTitle.value.trim();
  const country = foodCountry.value;
  const city = foodCity.value;

  // Validera titel
  const titleValidationError = validateTitle(title);
  if (titleValidationError) {
    return showAlert(titleValidationError);
  }

  emojiError.style.display = "none"; // reset

  if (!selectedEmoji) {
    emojiError.style.display = "block";
    return; // stoppar formuläret
  }

  if (!title || !country || !city) {
    return showAlert("Fill in all fields!");
  }
  if (!confirm(`Are you sure you want to publish this Foodpost: "${title}"?`)) return;

  const newFoodData = {
    title,
    emoji: selectedEmoji,
    country,
    city,
    type: "meal",
    ownerId: user.uid,
    userName: user.displayName || user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    // 1️⃣ Lägg till i användarens privata collection
    await db
      .collection("foods")
      .doc(user.uid)
      .collection("items")
      .add(newFoodData);

    // 2️⃣ Lägg till i global publicFoods collection
    await db.collection("publicFoods").add({
      ...newFoodData,
      publishedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Reset form
    foodTitle.value = "";
    foodCountry.value = "";
    foodCity.innerHTML = '<option value="">Select City</option>';
    foodCity.disabled = true;
    emojiPickerBtn.textContent = "Select your food Emoji";
    selectedEmoji = "";
    emojiError.style.display = "none";

    loadFoodList();
    loadPublicFoods();
  } catch (err) {
    console.error("Error adding food: ", err);
    showAlert("Error adding food. Please try again.");
  }
});

// ===== Load food list =====
async function loadFoodList() {
  const user = auth.currentUser;
  if (!user) return;

  foodListContainer.innerHTML = "";

  try {
    const snapshot = await db
      .collection("foods")
      .doc(user.uid)
      .collection("items")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      const p = document.createElement("p");
      p.className = "no-food";
      p.textContent = "No foods added yet!";
      foodListContainer.appendChild(p);
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <span class="icon">${data.emoji || "🍽️"}</span>
        <div class="food-info">
          <strong>${data.title}</strong><br/>
          <small>${data.city}, ${data.country}</small>
        </div>
        <span class="delete-icon" data-id="${docSnap.id}">&times;</span>
      `;
      foodListContainer.appendChild(div);
    });

    // Event-listener på röda X
    document.querySelectorAll(".delete-icon").forEach((icon) => {
      icon.addEventListener("click", async () => {
        const docId = icon.dataset.id;
        if (!confirm("Are you sure you want to delete this food?")) return;

        try {
          await db
            .collection("foods")
            .doc(user.uid)
            .collection("items")
            .doc(docId)
            .delete();
          loadFoodList();
        } catch (err) {
          console.error(err);
          showAlert("Error deleting food.");
        }
      });
    });
  } catch (err) {
    console.error("Error loading foods:", err);
    showAlert("Failed to load foods.");
  }
}

// ===== Load public foods =====
async function loadPublicFoods() {
  if (!publicFoodListContainer) return;

  publicFoodListContainer.innerHTML = "";

  try {
    const snapshot = await db
      .collection("publicFoods")
      .orderBy("publishedAt", "desc")
      .get();

    if (snapshot.empty) {
      const p = document.createElement("p");
      p.textContent = "No public foods yet!";
      publicFoodListContainer.appendChild(p);
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const publishedDate = data.publishedAt?.toDate();
      const options = { day: "2-digit", month: "short" };
      const formattedDate = publishedDate
        ? publishedDate.toLocaleDateString("en-US", options)
        : "";

      const div = document.createElement("div");
      div.className = "public-food-item";
      div.innerHTML = `
        <span class="icon">${data.emoji || "🍽️"}</span>
        <div>
          <strong>${data.title}</strong> by <em>${data.userName}</em><br/>
          <small>${data.city}, ${data.country} • ${formattedDate}</small>
        </div>
      `;
      publicFoodListContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading public foods:", err);
    showAlert("Failed to load public foods.");
  }
}

// ===== Initial load =====
auth.onAuthStateChanged((user) => {
  if (user) {
    setupUserListener(); // ✅ realtime lyssnare för mute/banned
    loadFoodList();
    loadPublicFoods();
  }
});


