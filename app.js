// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91"
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
  const addFoodBtn = document.getElementById("addFoodBtn"); // knapp i formuläret

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

  // --- Logout knapp ---
  logoutBtn.addEventListener("click", async () => {
    await firebase.auth().signOut();
    window.location.href = "login.html";
  });

  // --- Navigera till myfood.html ---
  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });

  // --- Lägg till matpost ---
  if (addFoodBtn) {
    addFoodBtn.addEventListener("click", async () => {
      const titleInput = document.getElementById("title");
      const cityInput = document.getElementById("city");
      const countryInput = document.getElementById("country");
      const emojiInput = document.getElementById("emoji");

      const user = firebase.auth().currentUser;
      if (!user) return alert("Du måste vara inloggad!");

      try {
        await db.collection("foods")
                .doc(user.uid)
                .collection("items")
                .add({
                  title: titleInput.value,
                  city: cityInput.value,
                  country: countryInput.value,
                  emoji: emojiInput.value || "🍽️",
                  user: user.email,
                  ownerId: user.uid, // VIKTIGT för write-regeln
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

        alert("Maten lades till!");
        // rensa formuläret
        titleInput.value = "";
        cityInput.value = "";
        countryInput.value = "";
        emojiInput.value = "";
      } catch (err) {
        console.error("Error adding food:", err);
        alert("Det gick inte lägga till maten. Kolla console.");
      }
    });
  }

  // --- Global real-time food list ---
  let allFoods = []; // aktuell global lista

  db.collectionGroup("items")
    //.orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allFoods = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          title: data.title || "",
          city: data.city || "",
          country: data.country || "",
          emoji: data.emoji || "🍽️",
          user: data.user || "Anonymous",
          timestamp: data.timestamp || null
        };
      });

      console.log("Fetched foods:", allFoods);
      renderFoodItems(allFoods);
    }, err => {
      console.error("Error fetching global foods:", err);
    });

  // --- Render function ---
  function renderFoodItems(items) {
    foodList.innerHTML = "";
    if (!items.length) {
      foodList.innerHTML = "<p>No food found.</p>";
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("food-item");
      div.innerHTML = `
        <span class="icon">${item.emoji}</span>
        <h3>${item.title}</h3>
        <p>Location: ${item.city}, ${item.country}</p>
        <p>Shared by: ${item.user}</p>
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
