// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

// Initiera Firebase om det inte redan är gjort
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
  const welcomeMsg = document.getElementById("welcomeMsg");
  const foodTitle = document.getElementById("foodTitle");
  const adminPanel = document.getElementById("adminPanel"); // referens till adminpanelen

  let countriesData = [];
  let allFoods = [];

  // Länder-flaggor (kan lägga till fler)
  const countryFlags = {
    "Sweden": "🇸🇪",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Mexico": "🇲🇽",
    "Japan": "🇯🇵",
    "China": "🇨🇳",
    "India": "🇮🇳"
  };

  // --- Logga ut / navigera ---
  logoutBtn.addEventListener("click", () => auth.signOut().then(() => window.location.href = "login.html"));
  myFoodBtn.addEventListener("click", () => window.location.href = "myfood.html");

  // --- Ladda länder ---
  async function loadCountries() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries");
      const data = await res.json();
      countriesData = data.data;

      countrySelect.innerHTML = '<option value="">Select country</option>';
      countriesData.forEach(c => {
        const opt = document.createElement("option");
        const flag = countryFlags[c.country] || "";
        opt.value = c.country;
        opt.textContent = `${flag} ${c.country}`;
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

  // --- Filter ---
  filterBtn.addEventListener("click", () => {
    const country = countrySelect.value;
    const city = citySelect.value;

    const filtered = allFoods.filter(f =>
      (!country || f.country === country) &&
      (!city || f.city === city)
    );
    renderFoodItems(filtered);
  });

  // --- Loading animation ---
  let dots = 0;
  foodTitle.textContent = "Shared Meals";
  const loadingInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    foodTitle.textContent = `Shared Meals${".".repeat(dots)}`;
  }, 500);

  // --- Vänta på inloggad användare ---
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "login.html";

    const loggedInUserName = user.displayName || user.email;
    if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${loggedInUserName}!`;

    // --- FIX: kolla om användaren är admin baserat på email ---
    const userSnapshot = await db.collection("users").where("email", "==", user.email).get();
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      if (userData.admin === true && adminPanel) {
        adminPanel.style.display = "block"; // visa adminpanelen
      }
    }

    await loadCountries();
    loadGlobalFood(user);
  });

  // --- Hämta global publicFoods ---
  function loadGlobalFood(user) {
    db.collection("publicFoods").orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            title: data.title || "",
            city: data.city || "",
            country: data.country || "",
            emoji: data.emoji || "🍽️",
            user: data.ownerId === user.uid ? (user.displayName || user.email) : (data.userName || "Anonymous"),
            timestamp: data.createdAt || null
          };
        });

        renderFoodItems(allFoods);
        clearInterval(loadingInterval);
        foodTitle.textContent = "Shared Meals";
      }, err => {
        console.error("Error fetching public foods:", err);
        foodList.innerHTML = "<p>Failed to load public foods.</p>";
        clearInterval(loadingInterval);
      });
  }

  // --- Renderfunktion ---
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
        const day = date.getDate().toString().padStart(2, "0");
        const month = monthNames[date.getMonth()];
        dateStr = `${day} ${month}`;
      }

      const div = document.createElement("div");
      div.className = "food-item";
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
});
