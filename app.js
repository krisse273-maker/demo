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
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileIcon = document.getElementById("profileIcon");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const foodTitle = document.getElementById("foodTitle");

  let countriesData = [];
  let allFoods = [];

  // --- Ladda länder ---
  async function loadCountries() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries");
      const data = await res.json();
      countriesData = data.data;

      countrySelect.innerHTML = '<option value="">Select country</option>';
      countriesData.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.country;
        opt.textContent = c.country;
        countrySelect.appendChild(opt);
      });
      countrySelect.disabled = false;
    } catch (err) {
      console.error("Could not fetch countries:", err);
      alert("Failed to load countries. Try refreshing.");
    }
  }

  countrySelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;
    const countryObj = countriesData.find(c => c.country === countrySelect.value);
    if (!countryObj) return;
    countryObj.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  // --- Navigering ---
  myFoodBtn.addEventListener("click", () => window.location.href = "myfood.html");
  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "login.html";
  });

  // --- Auth och profilikon ---
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "login.html";

    const docRef = db.collection("publicUsers").doc(user.uid);
    const docSnap = await docRef.get();
    const gender = docSnap.exists ? docSnap.data().gender : "male";

    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}!`;

    // --- SVG med kroppen synlig ---
    if (gender === "male") {
      profileIcon.innerHTML = `
        <svg viewBox="0 0 64 64" width="100%" height="100%">
          <!-- Huvud -->
          <circle cx="32" cy="20" r="12" fill="#262d37" stroke="#1c222b" stroke-width="2"/>
          <!-- Kropp -->
          <path d="M22,52 C22,38 42,38 42,52 L42,46 C42,44 22,44 22,46 Z" fill="#262d37" stroke="#1c222b" stroke-width="2"/>
        </svg>
      `;
    } else {
      profileIcon.innerHTML = `
        <svg viewBox="0 0 64 64" width="100%" height="100%">
          <!-- Huvud -->
          <circle cx="32" cy="20" r="12" fill="#262d37" stroke="#1c222b" stroke-width="2"/>
          <!-- Kropp -->
          <path d="M22,52 C22,38 42,38 42,52 L42,46 C42,44 22,44 22,46 Z" fill="#262d37" stroke="#1c222b" stroke-width="2"/>
          <!-- Hästsvans -->
          <path d="M44,16 C52,14 52,24 44,28" stroke="#1c222b" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>
      `;
    }

    await loadCountries();
    loadGlobalFood();
  });

  // --- Load global food ---
  function loadGlobalFood() {
    const loadingInterval = setInterval(() => {
      foodTitle.textContent = `Shared Meals${'.'.repeat((new Date().getSeconds() % 4))}`;
    }, 500);

    db.collection("publicFoods").orderBy("createdAt","desc")
      .onSnapshot(snap => {
        allFoods = snap.docs.map(d => d.data());
        renderFoodItems(allFoods);
        clearInterval(loadingInterval);
        foodTitle.textContent = "Shared Meals";
      }, err => {
        console.error("Error fetching global foods:", err);
      });
  }

  // --- Render ---
  function renderFoodItems(items) {
    foodList.innerHTML = "";
    if (!items.length) { foodList.innerHTML = "<p>No food found.</p>"; return; }

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    items.forEach(item => {
      let dateStr = "";
      if(item.createdAt) {
        const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        dateStr = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      }

      const div = document.createElement("div");
      div.classList.add("food-item");
      div.innerHTML = `
        <div class="food-header">
          <span>${item.emoji || "🍽️"}</span>
          <h3>${item.title || ""}</h3>
        </div>
        <div class="food-details">
          <p><span class="icon-small">📍</span><strong>Location:</strong> ${item.city || ""}, ${item.country || ""}</p>
          <p><span class="icon-small">👤</span><strong>Published By:</strong> ${item.user || "Anonymous"}</p>
          ${dateStr ? `<p><span class="icon-small">📅</span><strong>Posted On:</strong> ${dateStr}</p>` : ""}
        </div>
      `;
      foodList.appendChild(div);
    });
  }

  // --- Filter ---
  filterBtn.addEventListener("click", () => {
    const filtered = allFoods.filter(f =>
      (!countrySelect.value || f.country === countrySelect.value) &&
      (!citySelect.value || f.city === citySelect.value)
    );
    renderFoodItems(filtered);
  });
});
