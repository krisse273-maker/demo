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

window.addEventListener("DOMContentLoaded", async () => {
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileIcon = document.getElementById("profileIcon");
  const welcomeMsg = document.getElementById("welcomeMsg");

  // --- Länder/städer ---
  let countriesData = [];
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

  countrySelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;

    const selectedCountry = countrySelect.value;
    if (!selectedCountry) return;

    const countryObj = countriesData.find(c => c.country === selectedCountry);
    if (!countryObj || !countryObj.cities.length) return;

    countryObj.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  // --- Navigera ---
  myFoodBtn.addEventListener("click", () => window.location.href = "myfood.html");
  logoutBtn.addEventListener("click", async () => {
    await firebase.auth().signOut();
    window.location.href = "login.html";
  });

  // --- Vänta tills användaren är inloggad innan Firestore ---
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // --- Hämta kön från Firestore ---
    const docRef = db.collection("publicUsers").doc(user.uid);
    const docSnap = await docRef.get();
    const gender = docSnap.exists ? docSnap.data().gender : "male";

    // --- Sätt välkomsttext ---
    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}!`;

    // --- Sätt profilikon baserat på kön ---
    // --- Sätt profilikon baserat på kön ---
if (gender === "male") {
  // Male: huvud + rundad torso som FB-profil
  profileIcon.innerHTML = `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <!-- Huvud -->
      <circle cx="32" cy="20" r="12" fill="#262d37"/>
      <!-- Kropp: rundad torso -->
      <path d="M20,52 C20,40 44,40 44,52 Z" fill="#262d37"/>
    </svg>
  `;
} else {
  // Female: huvud + rundad torso + hästsvans
  profileIcon.innerHTML = `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <!-- Huvud -->
      <circle cx="32" cy="20" r="12" fill="#262d37"/>
      <!-- Kropp: rundad torso -->
      <path d="M20,52 C20,40 44,40 44,52 Z" fill="#262d37"/>
      <!-- Hästsvans åt sidan -->
      <path d="M44,16 C52,14 52,24 44,28" stroke="#262d37" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>
  `;
}

    // --- Global real-time food list ---
    let allFoods = [];
    db.collection("publicFoods")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            title: data.title || "",
            city: data.city || "",
            country: data.country || "",
            emoji: data.emoji || "🍽️",
            user: data.userName || "Anonymous",
            timestamp: data.createdAt || null
          };
        });

        renderFoodItems(allFoods);
      }, err => {
        console.error("Error fetching global foods:", err);
      });

    // --- Render-funktion ---
    function renderFoodItems(items) {
      foodList.innerHTML = "";
      if (!items.length) {
        foodList.innerHTML = "<p>No food found.</p>";
        return;
      }

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      items.forEach(item => {
        let dateStr = "";
        if (item.timestamp && item.timestamp.toDate) {
          const date = item.timestamp.toDate();
          const day = date.getDate();
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear();
          dateStr = `${day} ${month} ${year}`;
        }

        const div = document.createElement("div");
        div.classList.add("food-item");
        div.innerHTML = `
          <div class="food-header">
            <span>${item.emoji}</span>
            <h3>${item.title}</h3>
          </div>
          <div class="food-details">
            <p><span class="icon-small">📍</span><strong>Location:</strong> ${item.city}, ${item.country}</p>
            <p><span class="icon-small">👤</span><strong>Published By:</strong> ${item.user}</p>
            ${dateStr ? `<p><span class="icon-small">📅</span><strong>Posted On:</strong> ${dateStr}</p>` : ""}
          </div>
        `;
        foodList.appendChild(div);
      });
    }

    // --- Filterknapp ---
    filterBtn.addEventListener("click", () => {
      const country = countrySelect.value;
      const city = citySelect.value;

      const filtered = allFoods.filter(f =>
        (!country || f.country === country) &&
        (!city || f.city === city)
      );

      renderFoodItems(filtered);
    });

  });
});

