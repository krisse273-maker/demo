// --- Kolla om användaren är inloggad ---
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "login.html";
}

// --- Hälsa användaren i header ---
const headerP = document.getElementById("welcomeMsg");
headerP.textContent = `Welcome, ${currentUser.name}! Find and share food near you!`;

// --- Log Out knapp ---
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// --- DOM-element ---
const countrySelect = document.getElementById("country");
const citySelect = document.getElementById("city");
const filterBtn = document.getElementById("filterBtn");
const foodList = document.querySelector(".food-list");
const myFoodBtn = document.getElementById("myFoodBtn");

// --- Hämta globala matobjekt från localStorage ---
let foodItems = JSON.parse(localStorage.getItem("allFoods")) || [];

// --- Hämta alla länder och städer från API ---
let countriesData = [];
async function loadCountries() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countriesData.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.country;
      option.textContent = c.country;
      countrySelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load countries:", err);
    alert("Could not load countries data. Try refreshing the page.");
  }
}
loadCountries();

// --- Ladda städer när ett land väljs ---
countrySelect.addEventListener("change", () => {
  const selectedCountry = countrySelect.value;
  citySelect.innerHTML = '<option value="">Select city</option>';
  citySelect.disabled = true;

  if (!selectedCountry) return;

  const countryObj = countriesData.find((c) => c.country === selectedCountry);
  if (countryObj && countryObj.cities.length) {
    countryObj.cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
    citySelect.disabled = false;
  }
});

// --- Rendera matobjekt ---
function renderFoodItems(items) {
  foodList.innerHTML = "";
  if (items.length === 0) {
    foodList.innerHTML = "<p>No food found for this filter.</p>";
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
      <button class="messageBtn">Contact User</button>
    `;

    const btn = div.querySelector(".messageBtn");
    btn.addEventListener("click", () => {
      alert(
        `Contact info for ${item.title}:\nEmail: ${item.user || "example@example.com"}`,
      );
    });

    foodList.appendChild(div);
  });
}

// --- Initial render ---
renderFoodItems(foodItems);

// --- Filterknapp ---
filterBtn.addEventListener("click", () => {
  const country = countrySelect.value;
  const city = citySelect.value;

  const filtered = foodItems.filter((item) => {
    return (
      (!country || item.country === country) && (!city || item.city === city)
    );
  });

  renderFoodItems(filtered);
});

// --- My Food List knapp ---
myFoodBtn.addEventListener("click", () => {
  window.location.href = "myfood.html";
});

// --- Emoji Picker ---
// Hämta emoji-picker-knappen och emoji-picker div
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");

// Första gången sätts emojiPicker på "none" så den inte syns
emojiPicker.style.display = "none";

// 1. Växla mellan att visa eller dölja emoji-pickern när knappen trycks
emojiPickerBtn.addEventListener("click", () => {
  // Om emojiPicker är doldt, visa den. Om den är synlig, göm den.
  if (emojiPicker.style.display === "none") {
    emojiPicker.style.display = "flex";
  } else {
    emojiPicker.style.display = "none";
  }
});

// 2. Hämta alla emojis i emoji-picker
const emojiPickerSpans = document.querySelectorAll("#emojiPicker span");

// 3. Lägg till eventlyssnare på varje emoji i emoji-picker
emojiPickerSpans.forEach((span) => {
  span.addEventListener("click", () => {
    // Här kan du göra något med den valda emojin
    console.log(`Vald emoji: ${span.textContent}`);

    // Exempel: Uppdatera ett input-fält med den valda emojin
    // Om du har ett input-fält där emojin ska visas, använd detta:
    document.getElementById("foodTitle").value = span.textContent;

    // Stäng emoji-pickern när en emoji är vald
    emojiPicker.style.display = "none";
  });
});
