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

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) { window.location.href = "login.html"; return; }
  firebaseUser = user;
  headerP.textContent = `Welcome, ${user.displayName || user.email}! Here’s your food list.`;
  await loadUserFoods();
});

logoutBtn.addEventListener("click", () => {
  firebase.auth().signOut();
  window.location.href = "login.html";
});

homeBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

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
  } catch(e) { console.error(e); }
}
loadCountries();

foodCountrySelect.addEventListener("change", () => {
  const selectedCountry = foodCountrySelect.value;
  foodCitySelect.innerHTML = '<option value="">Select City</option>';
  foodCitySelect.disabled = true;
  if (!selectedCountry) return;
  const countryObj = countriesData.find(c=>c.country===selectedCountry);
  if(countryObj && countryObj.cities.length){
    countryObj.cities.forEach(city=>{
      const opt=document.createElement("option");
      opt.value=city;
      opt.textContent=city;
      foodCitySelect.appendChild(opt);
    });
    foodCitySelect.disabled=false;
  }
});

emojiPickerBtn.addEventListener("click", ()=>{
  emojiPicker.style.display = emojiPicker.style.display==="flex"?"none":"flex";
});

emojiPicker.addEventListener("click",(e)=>{
  if(e.target.tagName.toLowerCase()==="span"){
    selectedEmoji = e.target.textContent;
    emojiPicker.style.display="none";
    emojiPickerBtn.textContent=`Selected: ${selectedEmoji}`;
  }
});

addFoodForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!selectedEmoji) return alert("Please select an emoji!");
  if(!firebaseUser) return alert("User not logged in");

  const newFood={
    title: foodTitleInput.value,
    country: foodCountrySelect.value,
    city: foodCitySelect.value,
    emoji: selectedEmoji,
    user: firebaseUser.email,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  try{
    await db.collection("foods").doc(firebaseUser.uid).collection("items").add(newFood);
    addFoodForm.reset();
    selectedEmoji="";
    emojiPickerBtn.textContent="Select your food Emoji";
    foodCitySelect.disabled=true;
    await loadUserFoods();
    alert("Food item added successfully!");
  }catch(err){
    console.error(err);
    alert("Failed to add food!");
  }
});

async function loadUserFoods(){
  if(!firebaseUser) return;
  try{
    const snapshot = await db.collection("foods").doc(firebaseUser.uid).collection("items").orderBy("timestamp","desc").get();
    myFoods = snapshot.docs.map(doc=>doc.data());
    renderMyFoods();
  }catch(err){
    console.error(err);
  }
}

function renderMyFoods(){
  myFoodList.innerHTML="";
  if(!myFoods.length){
    myFoodList.innerHTML=`<p class="no-food">You don't have any food listed yet.</p>`;
    return;
  }
  myFoods.forEach(food=>{
    const div = document.createElement("div");
    div.classList.add("food-item");
    div.innerHTML=`
      <span class="icon">${food.emoji}</span>
      <h3>${food.title}</h3>
      <p>${food.city}, ${food.country}</p>
    `;
    myFoodList.appendChild(div);
  });
}
