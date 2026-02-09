// ===== Firebase setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-storage.js";

// ===== Firebase config =====
const firebaseConfig = { 
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===== DOM Elements =====
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const foodTitle = document.getElementById("foodTitle");
const foodCountry = document.getElementById("foodCountry");
const foodCity = document.getElementById("foodCity");
const addFoodForm = document.getElementById("addFoodForm");
const foodListContainer = document.querySelector(".my-food-list");
const publicFoodListContainer = document.querySelector(".public-food-list");
const logoutBtn = document.getElementById("logoutBtn");
const homeBtn = document.getElementById("homeBtn");

// ===== Custom Alert Elements =====
const customAlertBackdrop = document.getElementById("customAlertBackdrop");
const alertMessage = document.getElementById("alertMessage");
const alertOkBtn = document.getElementById("alertOkBtn");

// ===== Styling for validation =====
const titleError = document.getElementById("titleError");
const emojiError = document.getElementById("emojiError");
const countryError = document.getElementById("countryError");
const cityError = document.getElementById("cityError");

let selectedEmoji = "";
let currentUserData = null;
let userDocUnsubscribe = null;
let countriesData = [];

// ===== Navigation =====
logoutBtn.onclick = async () => {
  await auth.signOut();
  window.location.href = "../login.html";
};
homeBtn.onclick = () => window.location.href = "../index.html";

// ===== Emoji picker =====
emojiPickerBtn.onclick = () => {
  emojiPicker.classList.toggle("show");
};

emojiPicker.querySelectorAll("span").forEach(span => {
  span.onclick = () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = `Select your food Emoji ${selectedEmoji}`;
    emojiPicker.classList.remove("show");
    emojiError.classList.add("hidden");
  };
});

// ===== User listener + Mute check =====
function setupUserListener() {
  const user = auth.currentUser;
  if (!user) return;
  if (userDocUnsubscribe) userDocUnsubscribe();

  const userDocRef = doc(db, "users", user.uid);
  userDocUnsubscribe = onSnapshot(userDocRef, docSnap => {
    currentUserData = docSnap.data();
    if (currentUserData?.banned) {
      showCustomAlert("You are banned.");
      auth.signOut().then(() => window.location.href = "../index.html");
    }
    if (currentUserData?.muteUntil) {
      const muteUntilDate = currentUserData.muteUntil.toDate();
      if (muteUntilDate > new Date()) {
        showCustomAlert(`You are muted until ${muteUntilDate.toLocaleString()}`);
      }
    }
  });
}

// ===== Custom Alert Function =====
function showCustomAlert(msg) {
  if (!customAlertBackdrop || !alertMessage) return;
  alertMessage.textContent = msg;
  customAlertBackdrop.classList.add("show");
}

alertOkBtn?.addEventListener("click", () => {
  customAlertBackdrop.classList.remove("show");
});

// ===== Load countries + cities =====
async function loadCountries() {
  const spinner = document.getElementById("countrySpinner");

  spinner.classList.remove("hidden");
  foodCountry.disabled = true;
  foodCity.disabled = true;

  foodCountry.textContent = "";
  foodCity.textContent = "";

  const defaultCountry = document.createElement("option");
  defaultCountry.value = "";
  defaultCountry.textContent = "Select Country";
  foodCountry.appendChild(defaultCountry);

  const defaultCity = document.createElement("option");
  defaultCity.value = "";
  defaultCity.textContent = "Select City";
  foodCity.appendChild(defaultCity);

  try {
    const snap = await getDocs(query(collection(db, "countries"), orderBy("country")));
    countriesData = snap.docs.map(doc => doc.data());

    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      foodCountry.appendChild(opt);
    });

    foodCountry.disabled = false;
    spinner.classList.add("hidden");

    foodCountry.addEventListener('change', () => {
      const selectedCountry = countriesData.find(c => c.country === foodCountry.value);

      foodCity.textContent = "";
      const defaultCityOption = document.createElement("option");
      defaultCityOption.value = "";
      defaultCityOption.textContent = "Select City";
      foodCity.appendChild(defaultCityOption);

      if (!selectedCountry) {
        foodCity.disabled = true;
        foodCountry.style.backgroundImage = 'none';
        return;
      }

      selectedCountry.cities.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        foodCity.appendChild(opt);
      });
      foodCity.disabled = false;
    });

  } catch (err) {
    console.error("Failed to load countries from Firestore:", err);
    spinner.classList.add("hidden");
  }
}

// ===== Validation =====
function validateTitle(title) {
  if (!title || title.trim() === "") return "Title cannot be empty";
  if (title.length < 5) return "Title must be at least 5 characters long";
  if (title.length > 15) return "Title cannot be longer than 15 characters";
  if (/[<>\/()=]/.test(title)) return "Title contains invalid characters: < > / ( ) =";
  return null;
}

function validateCountryAndCity(country, city) {
  const countryObj = countriesData.find(c => c.country === country);
  if (!countryObj) return "Invalid country selected";
  if (!countryObj.cities.includes(city)) return "Invalid city selected";
  return null;
}

// ===== Add Food =====
addFoodForm.onsubmit = async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  titleError.textContent = "";
  emojiError.classList.add("hidden");
  countryError.textContent = "";
  cityError.textContent = "";

  const title = foodTitle.value.trim();
  let hasError = false;

  const titleErr = validateTitle(title);
  if (titleErr) {
    titleError.textContent = titleErr;
    foodTitle.classList.add("error-title", "shake");
    hasError = true;
  }

  if (!selectedEmoji) {
    emojiError.textContent = "You need to select an emoji";
    emojiError.classList.remove("hidden");
    hasError = true;
  }

  if (!foodCountry.value) {
    countryError.textContent = "Please select a country";
    hasError = true;
  }
  if (!foodCity.value) {
    cityError.textContent = "Please select a city";
    hasError = true;
  }

  const countryCityError = validateCountryAndCity(foodCountry.value, foodCity.value);
  if (countryCityError) {
    if (countryCityError.includes("country")) countryError.textContent = countryCityError;
    if (countryCityError.includes("city")) cityError.textContent = countryCityError;
    hasError = true;
  }

  if (currentUserData?.muteUntil && currentUserData.muteUntil.toDate() > new Date()) {
    const muteUntilDate = currentUserData.muteUntil.toDate();
    showCustomAlert(`You are muted until ${muteUntilDate.toLocaleString()}`);
    return;
  }

  if (hasError) return;

  // ===== Firebase Storage Upload =====
  const file = document.getElementById("foodImage").files[0];
  if (!file) {
    alert("Please select an image of the food");
    return;
  }

  try {
    const fileName = `foodImages/${user.uid}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);               // ✅ Modern SDK upload
    const imageUrl = await getDownloadURL(storageRef); // ✅ Hämta URL

    // ===== Firestore save =====
    const foodRef = doc(collection(doc(collection(db, "foods"), user.uid), "items"));
    const now = Timestamp.now();
    const foodData = {
      title,
      emoji: selectedEmoji,
      country: foodCountry.value.trim(),
      city: foodCity.value.trim(),
      type: "food",
      ownerId: user.uid,
      userName: user.displayName || user.email,
      createdAt: now,
      status: "pending",
      imageUrl
    };

    await setDoc(foodRef, foodData);

    addFoodForm.reset();
    foodTitle.classList.remove("valid-title", "error-title", "shake");
    emojiPickerBtn.textContent = "Select your food Emoji";
    selectedEmoji = "";
    emojiError.classList.add("hidden");

    loadFoodList();
    loadPublicFoods();

  } catch (err) {
    console.error("Image upload failed:", err);
    alert("Image upload failed. Check console.");
  }
};

// ===== Load Private Foods =====
async function loadFoodList() {
  const user = auth.currentUser;
  if (!user) return;

  foodListContainer.innerHTML = "";
  const allItemsDiv = document.createElement("div");
  allItemsDiv.className = "my-food-items";

  const snap = await getDocs(query(collection(doc(collection(db, "foods"), user.uid), "items"), orderBy("createdAt", "desc")));

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "food-item";

    const del = document.createElement("span");
    del.textContent = "×";
    del.className = "delete-icon";

    del.onclick = async () => {
      try {
        const foodDocId = docSnap.id;
        await deleteDoc(doc(collection(doc(collection(db, "foods"), user.uid), "items"), foodDocId));
        await deleteDoc(doc(db, "publicFoods", foodDocId));
        loadFoodList();
        loadPublicFoods();
      } catch (err) {
        console.error("Failed to delete food:", err);
        showCustomAlert("Could not delete this food. Try again.");
      }
    };

    const info = document.createElement("div");
    info.className = "food-info";
    info.textContent = `${data.emoji} ${data.title}`;

    div.appendChild(info);
    div.appendChild(del);
    allItemsDiv.appendChild(div);
  });

  foodListContainer.appendChild(allItemsDiv);
}

// ===== Load Public Foods =====
async function loadPublicFoods() {
  if (!publicFoodListContainer) return;

  publicFoodListContainer.innerHTML = "";
  const snap = await getDocs(query(collection(db, "publicFoods"), orderBy("publishedAt", "desc")));

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const div = document.createElement("div");
    div.className = "food-item";

    const info = document.createElement("div");
    info.className = "food-info";
    info.textContent = `${d.emoji} ${d.title} by ${d.userName}`;

    div.appendChild(info);
    publicFoodListContainer.appendChild(div);
  });
}

// ===== Init =====
auth.onAuthStateChanged(user => {
  if (user) {
    setupUserListener();
    loadCountries();
    loadFoodList();
    loadPublicFoods();
  }
});
