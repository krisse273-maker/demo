rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =========================
    // USERS (privat profil)
    // =========================
    match /users/{userId} {

      function isValidUserData(data) {
        return data.name is string
               && data.name.size() > 0
               && data.name.size() <= 15
               && data.email is string
               && data.email.size() > 0
               && data.email.size() <= 100
               && data.keys().hasOnly([
                 "name",
                 "publicName",
                 "email",
                 "createdAt",
                 "admin",
                 "banned",
                 "muteUntil"
               ]);
      }

      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && isValidUserData(request.resource.data);

      allow read: if request.auth != null
                  && (
                       request.auth.uid == userId
                       || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true
                     );

      allow update: if request.auth != null
                    && (
                         request.auth.uid == userId
                         || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true
                       );
    }

    // =========================
    // PUBLIC USERS
    // =========================
    match /publicUsers/{userId} {
      allow read: if true;
      allow create, update: if request.auth != null
                            && request.auth.uid == userId;
    }

    // =========================
    // ADMINS (låst)
    // =========================
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow create, update, delete: if false;
    }

    // =========================
    // PRIVAT MATLISTA
    // =========================
    function isValidFood(data) {
      return data.keys().hasOnly([
               "title",
               "country",
               "city",
               "emoji",
               "ownerId",
               "userName",
               "createdAt",
               "type"
             ])
             && data.type == "food"
             && data.title is string
             && data.title.size() >= 5
             && data.title.size() <= 15
             && !(data.title.matches('.*[<>/()=].*'))
             && data.emoji is string
             && data.emoji.size() > 0
             && data.country is string
             && data.country.size() > 0
             && data.city is string
             && data.city.size() > 0
             && data.ownerId == request.auth.uid
             && data.userName is string
             && data.userName.size() > 0;
    }

    match /foods/{userId}/items/{itemId} {
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && isValidFood(request.resource.data);

      allow update: if false;

      allow read, delete: if request.auth != null
                          && request.auth.uid == userId;
    }

    // =========================
    // GLOBAL MATLISTA (STENHÅRD)
    // =========================
   function isValidPublicFood(data) {
  return data.keys().hasOnly([
           "title",
           "country",
           "city",
           "emoji",
           "ownerId",
           "userName",
           "createdAt",
           "type",
           "publishedAt"
         ])
         && data.type == "food"
         && data.title is string
         && data.title.size() >= 5
         && data.title.size() <= 15
         && !(data.title.matches('.*[<>/()=].*'))
         && data.emoji is string
         && data.emoji.size() > 0
         && data.country is string          // ✅ Ändringen här
         && data.country.size() > 0        // ✅ validera att den inte är tom
         && data.city is string
         && data.city.size() >= 2
         && data.city.size() <= 30
         && data.ownerId == request.auth.uid
         && data.userName is string
         && data.userName.size() > 0;
}


    match /publicFoods/{foodId} {

      allow read: if true;

      allow create: if request.auth != null
                    && isValidPublicFood(request.resource.data);

      allow update: if false; // 🔒 INGEN KAN ÄNDRA

      allow delete: if request.auth != null
                    && (
                         request.auth.uid == resource.data.ownerId
                         || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true
                       );
    }

  }
}
