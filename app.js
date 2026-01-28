window.addEventListener("DOMContentLoaded", async () => {
  // --- DOM-element ---
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const headerP = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!countrySelect || !citySelect || !foodList || !filterBtn) {
    console.error("One or more DOM elements not found");
    return;
  }

  // --- Kontrollera inloggad användare ---
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  } else {
    headerP.textContent = `Welcome, ${currentUser.name}! Find and share food near you!`;
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    firebase.auth().signOut();
    window.location.href = "login.html";
  });

  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });

  // --- Firebase init ---
  const firebaseConfig = {
    apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
    authDomain: "global-food-share.firebaseapp.com",
    projectId: "global-food-share",
    storageBucket: "global-food-share.firebasestorage.app",
    messagingSenderId: "902107453892",
    appId: "1:902107453892:web:dd9625974b8744cc94ac91",
    measurementId: "G-S1G7JY0TH5",
  };
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore(app);

  let allFoods = [];
  let countriesData = [];
  let firebaseUser = null;

  // --- Ladda länder och städer ---
  async function loadCountries() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries");
      const data = await res.json();
      countriesData = data.data;

      countrySelect.innerHTML = '<option value="">Select country</option>';
      countriesData.forEach((c) => {
        const option = document.createElement("option");
        option.value = c.country;
        option.textContent = c.country;
        countrySelect.appendChild(option);
      });
      countrySelect.disabled = false;
    } catch (err) {
      console.error("Failed to load countries:", err);
      alert("Failed to load countries. Try refreshing.");
    }
  }
  await loadCountries();

  countrySelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;

    const selectedCountry = countrySelect.value;
    if (!selectedCountry) return;

    const countryObj = countriesData.find((c) => c.country === selectedCountry);
    if (!countryObj || !countryObj.cities.length) return;

    countryObj.cities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  // --- Rendera matlistan ---
  function renderFoodItems(items) {
    foodList.innerHTML = "";
    if (!items.length) {
      foodList.innerHTML = "<p>No food found.</p>";
      return;
    }

    items.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("food-item");
      div.innerHTML = `
        <span class="icon">${item.emoji || "🍽️"}</span>
        <h3>${item.title}</h3>
        <p>Location: ${item.city}, ${item.country}</p>
        <p>Shared by: ${item.user || "Anonymous"}</p>
      `;
      foodList.appendChild(div);
    });
  }

  // --- Filtrering ---
  filterBtn.addEventListener("click", () => {
    const country = countrySelect.value;
    const city = citySelect.value;
    const filtered = allFoods.filter(
      (f) => (!country || f.country === country) && (!city || f.city === city)
    );
    renderFoodItems(filtered);
  });

  // --- Ladda mat från Firebase ---
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    firebaseUser = user;

    try {
      const snapshot = await db
        .collectionGroup("items")
        .orderBy("timestamp", "desc")
        .get();

      allFoods = snapshot.docs.map((doc) => doc.data());
      renderFoodItems(allFoods);
    } catch (err) {
      console.error("Error loading foods:", err);
      foodList.innerHTML = "<p>Failed to load food list.</p>";
    }
  });
});
