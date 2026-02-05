// ===== Firebase setup =====
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91",
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

const logoutBtn = document.getElementById("logoutBtn");
const homeBtn = document.getElementById("homeBtn");

let selectedEmoji = "";
let countriesData = [];
let currentUserData = null;
let userDocUnsubscribe = null;

// ===== Home & Logout knappar =====
window.addEventListener("DOMContentLoaded", () => {
  logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
      window.location.href = "../login.html";
    } catch (err) {
      console.error("Logout failed:", err);
      showAlert("Failed to log out.");
    }
  });

  homeBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
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
    emojiError.style.display = "none";
  });
});

// ===== Country & City - Dynamiskt =====
async function loadCountries() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

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

foodCountry.addEventListener("change", () => {
  foodCity.innerHTML = '<option value="">Select City</option>';
  foodCity.disabled = true;

  const countryObj = countriesData.find((c) => c.country === foodCountry.value);
  if (!countryObj || !countryObj.cities || countryObj.cities.length === 0) return;

  countryObj.cities.forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    foodCity.appendChild(opt);
  });
  foodCity.disabled = false;
});

loadCountries();

// ===== Kontrollera användarstatus i realtid =====
async function setupUserListener() {
  const user = auth.currentUser;
  if (!user) return;

  if (userDocUnsubscribe) userDocUnsubscribe();

  userDocUnsubscribe = db.collection("users").doc(user.uid)
    .onSnapshot((docSnap) => {
      if (!docSnap.exists) return;
      currentUserData = docSnap.data();

      const now = new Date();

      if (currentUserData.banned === true) {
        addFoodForm.querySelectorAll("input, select, button").forEach(el => el.disabled = true);

        const bannedMsg = document.createElement("div");
        bannedMsg.style.background = "#ffcccc";
        bannedMsg.style.padding = "10px";
        bannedMsg.style.marginBottom = "10px";
        bannedMsg.style.border = "1px solid red";
        bannedMsg.textContent = "You have been banned by an admin. Logging out...";
        document.body.prepend(bannedMsg);

        setTimeout(() => {
          auth.signOut().then(() => window.location.href = "../index.html");
        }, 500);

        return;
      }

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
  const minLength = 5;
  const maxTitleLength = 20;
  const regex = /^[a-zA-Z0-9\s\-]+$/;

  if (!title) return "⚠️ Title cannot be empty.";
  if (title.trim().length < minLength) return `⚠️ Title must be at least ${minLength} characters long.`;
  if (title.length > maxTitleLength) return `⚠️ Title cannot be longer than ${maxTitleLength} characters.`;
  if (!regex.test(title)) return "⚠️ Title contains invalid characters.";
  return null;
}

function checkMuteStatus() {
  if (currentUserData?.muteUntil) {
    const muteDate = currentUserData.muteUntil.toDate ? currentUserData.muteUntil.toDate() : new Date(currentUserData.muteUntil);
    if (muteDate > new Date()) {
      showAlert(`You are muted until ${muteDate.toLocaleString()}.`);
      return true;
    }
  }
  return false;
}

// ===== Add food to Firestore =====
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (checkMuteStatus()) return;

  const user = auth.currentUser;
  if (!user) return showAlert("You must be logged in!");

  if (currentUserData?.banned) return showAlert("You are banned and cannot post foods.");

  const title = foodTitle.value.trim();
  const country = foodCountry.value;
  const city = foodCity.value;

  const titleValidationError = validateTitle(title);
  if (titleValidationError) {
    alert(titleValidationError);
    return;
  }

  emojiError.style.display = "none";
  if (!selectedEmoji) {
    emojiError.style.display = "block";
    return;
  }

  if (!title || !country || !city) return showAlert("Fill in all fields!");
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
    await db.collection("foods").doc(user.uid).collection("items").add(newFoodData);
    await db.collection("publicFoods").add({
      ...newFoodData,
      publishedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

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

// ===== Load food list (privat, sanerad) =====
async function loadFoodList() {
  const user = auth.currentUser;
  if (!user) return;
  foodListContainer.innerHTML = "";

  try {
    const snapshot = await db.collection("foods").doc(user.uid).collection("items")
      .orderBy("createdAt", "desc").get();

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

      const iconSpan = document.createElement("span");
      iconSpan.className = "icon";
      iconSpan.textContent = data.emoji || "🍽️";

      const infoDiv = document.createElement("div");
      infoDiv.className = "food-info";

      const strong = document.createElement("strong");
      strong.textContent = data.title;

      const small = document.createElement("small");
      small.textContent = `${data.city}, ${data.country}`;

      infoDiv.appendChild(strong);
      infoDiv.appendChild(document.createElement("br"));
      infoDiv.appendChild(small);

      const deleteSpan = document.createElement("span");
      deleteSpan.className = "delete-icon";
      deleteSpan.dataset.id = docSnap.id;
      deleteSpan.textContent = "×";

      div.appendChild(iconSpan);
      div.appendChild(infoDiv);
      div.appendChild(deleteSpan);

      foodListContainer.appendChild(div);

      deleteSpan.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this food?")) return;
        try {
          await db.collection("foods").doc(user.uid).collection("items").doc(docSnap.id).delete();
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

// ===== Load public foods (sanerad) =====
async function loadPublicFoods() {
  if (!publicFoodListContainer) return;
  publicFoodListContainer.innerHTML = "";

  try {
    const snapshot = await db.collection("publicFoods")
      .orderBy("publishedAt", "desc").get();

    if (snapshot.empty) {
      const p = document.createElement("p");
      p.textContent = "No public foods yet!";
      publicFoodListContainer.appendChild(p);
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const publishedDate = data.publishedAt?.toDate();
      const formattedDate = publishedDate
        ? publishedDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
        : "";

      const div = document.createElement("div");
      div.className = "public-food-item";

      const iconSpan = document.createElement("span");
      iconSpan.className = "icon";
      iconSpan.textContent = data.emoji || "🍽️";

      const infoDiv = document.createElement("div");

      const strong = document.createElement("strong");
      strong.textContent = data.title;

      const em = document.createElement("em");
      em.textContent = data.userName;

      const small = document.createElement("small");
      small.textContent = `${data.city}, ${data.country} • ${formattedDate}`;

      infoDiv.appendChild(strong);
      infoDiv.appendChild(document.createTextNode(" by "));
      infoDiv.appendChild(em);
      infoDiv.appendChild(document.createElement("br"));
      infoDiv.appendChild(small);

      div.appendChild(iconSpan);
      div.appendChild(infoDiv);

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
    setupUserListener();
    loadFoodList();
    loadPublicFoods();
  }
});
