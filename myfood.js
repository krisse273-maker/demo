// ===== Firebase setup =====
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:1:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

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

// ===== Country & City =====
async function loadCountries() {
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
}

foodCountry.addEventListener("change", () => {
  foodCity.innerHTML = '<option value="">Select City</option>';
  foodCity.disabled = true;

  const countryObj = countriesData.find(c => c.country === foodCountry.value);
  if (!countryObj || !countryObj.cities) return;

  countryObj.cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    foodCity.appendChild(opt);
  });

  foodCity.disabled = false;
});

loadCountries();

// ===== Title validation =====
function validateTitle(title) {
  const minLength = 5;
  const maxTitleLength = 20;
  const regex = /^[a-zA-Z0-9\s\-]+$/;

  if (!title) return "Title cannot be empty.";
  if (title.length < minLength) return `Title must be at least ${minLength} characters.`;
  if (title.length > maxTitleLength) return `Title cannot be longer than ${maxTitleLength} characters.`;
  if (!regex.test(title)) return "Title contains invalid characters.";

  return null;
}

// ===== Add food =====
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = foodTitle.value.trim();
  const country = foodCountry.value;
  const city = foodCity.value;

  const titleValidationError = validateTitle(title);
  if (titleValidationError) {
    alert(titleValidationError); // ✅ VANLIG ALERT
    return;
  }

  if (!selectedEmoji || !country || !city) {
    showAlert("Fill in all fields!");
    return;
  }

  if (!confirm(`Publish "${title}"?`)) return;

  await db.collection("publicFoods").add({
    title,
    emoji: selectedEmoji,
    country,
    city,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  foodTitle.value = "";
  foodCountry.value = "";
  foodCity.innerHTML = '<option value="">Select City</option>';
  foodCity.disabled = true;
  emojiPickerBtn.textContent = "Select your food Emoji";
  selectedEmoji = "";
});
