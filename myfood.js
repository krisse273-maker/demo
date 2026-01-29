document.addEventListener("DOMContentLoaded", () => {

  // =====================================
  // Hämta element
  // =====================================
  const headerP = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const homeBtn = document.getElementById("homeBtn");
  const myFoodList = document.querySelector(".my-food-list");
  const addFoodForm = document.getElementById("addFoodForm");
  const emojiPickerBtn = document.getElementById("emojiPickerBtn");
  const emojiPicker = document.getElementById("emojiPicker");
  const foodTitleInput = document.getElementById("foodTitle"); 
  const foodCountrySelect = document.getElementById("foodCountry");
  const foodCitySelect = document.getElementById("foodCity");

  if (!addFoodForm || !foodTitleInput) {
    console.error("Form or foodTitle input not found in DOM!");
    return;
  }

  // =====================================
  // Firebase init
  // =====================================
  const firebaseConfig = {
    apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
    authDomain: "global-food-share.firebaseapp.com",
    projectId: "global-food-share",
    storageBucket: "global-food-share.firebasestorage.app",
    messagingSenderId: "902107453892",
    appId: "1:902107453892:web:dd9625974b8744cc94ac91"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  let firebaseUser = null;
  let selectedEmoji = "";
  let myFoods = [];
  let countriesData = [];

  // =====================================
  // Auth state
  // =====================================
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    firebaseUser = user;
    headerP.textContent = `Welcome, ${user.displayName || "Anonymous"}! Here’s your food list.`;
    await loadUserFoods();
  });

  logoutBtn?.addEventListener("click", () => {
    firebase.auth().signOut();
    window.location.href = "login.html";
  });

  homeBtn?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // =====================================
  // Ladda länder
  // =====================================
  async function loadCountries() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries");
      const data = await res.json();
      countriesData = data.data;
      countriesData.forEach(c => {
        const option = document.createElement("option");
        option.value = c.country;
        option.textContent = c.country;
        foodCountrySelect.appendChild(option);
      });
    } catch(e) {
      console.error("Failed to load countries:", e);
    }
  }
  loadCountries();

  // =====================================
  // Välj City baserat på Country
  // =====================================
  foodCountrySelect.addEventListener("change", () => {
    const selectedCountry = foodCountrySelect.value;
    foodCitySelect.innerHTML = '<option value="">Select City</option>';
    foodCitySelect.disabled = true;
    if (!selectedCountry) return;

    const countryObj = countriesData.find(c => c.country === selectedCountry);
    if (countryObj && countryObj.cities.length){
      countryObj.cities.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        foodCitySelect.appendChild(opt);
      });
      foodCitySelect.disabled = false;
    }
  });

  // =====================================
  // Emoji picker
  // =====================================
  emojiPickerBtn.addEventListener("click", () => {
    emojiPicker.style.display = emojiPicker.style.display === "flex" ? "none" : "flex";
  });

  emojiPicker.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() === "span") {
      selectedEmoji = e.target.textContent;
      emojiPicker.style.display = "none";
      emojiPickerBtn.textContent = `Selected: ${selectedEmoji}`;
    }
  });

  // =====================================
  // Lägg till ny mat
  // =====================================
  addFoodForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedEmoji) return alert("Please select an emoji!");
    if (!firebaseUser) return alert("User not logged in");

    const foodValue = foodTitleInput.value.trim();
    if (!foodValue) return alert("Please enter a food name!");
    if (foodValue.length > 50) return alert("Food name cannot exceed 50 characters!");

    const newFood = {
      title: foodValue,
      type: foodValue,
      country: foodCountrySelect.value,
      city: foodCitySelect.value,
      emoji: selectedEmoji,
      user: firebaseUser.displayName || "Anonymous", // ✅ här använder vi displayName
      ownerId: firebaseUser.uid,
      createdAt: firebase.firestore.Timestamp.now()
    };

    try {
      // Lägg till i privat lista
      const userDocRef = db.collection("foods").doc(firebaseUser.uid).collection("items").doc();
      await userDocRef.set(newFood);

      // Lägg till i public lista med serverTimestamp
      const publicDocRef = db.collection("publicFoods").doc(userDocRef.id);
      await publicDocRef.set({
        ...newFood,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      addFoodForm.reset();
      selectedEmoji = "";
      emojiPickerBtn.textContent = "Select your food Emoji";
      foodCitySelect.disabled = true;

      await loadUserFoods();
      alert("Food item added successfully!");
    } catch(err) {
      console.error("Failed to add food:", err);
      alert("Failed to add food!");
    }
  });

  // =====================================
  // Ladda användarens mat
  // =====================================
  async function loadUserFoods() {
    if (!firebaseUser) return;
    try {
      const snapshot = await db.collection("foods")
                               .doc(firebaseUser.uid)
                               .collection("items")
                               .orderBy("createdAt", "desc")
                               .get();
      myFoods = snapshot.docs.map(doc => doc.data());
      renderMyFoods();
    } catch(err) {
      console.error("Failed to load user foods:", err);
    }
  }

  // =====================================
  // Rendera matlistan
  // =====================================
  function renderMyFoods() {
    myFoodList.innerHTML = "";
    if (!myFoods.length) {
      myFoodList.innerHTML = `<p class="no-food">You don't have any food listed yet.</p>`;
      return;
    }
    myFoods.forEach(food => {
      const div = document.createElement("div");
      div.classList.add("food-item");
      div.innerHTML = `
        <span class="icon">${food.emoji}</span>
        <h3>${food.title}</h3>
        <p>${food.city}, ${food.country}</p>
      `;
      myFoodList.appendChild(div);
    });
  }

});
