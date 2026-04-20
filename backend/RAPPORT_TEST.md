# 📋 RAPPORT DE TEST - Routes GET /users et /commandes

## ✅ État Global: FONCTIONNEL

---

## 🔍 Résumé des Tests

| Test | Endpoint | Status | Résultat |
|------|----------|--------|----------|
| API Health | GET /api/health | 200 | ✅ Réussie |
| Authentification | POST /api/auth/login | 200 | ✅ Token JWT obtenu |
| Utilisateurs | GET /api/users | 200 | ✅ 5 utilisateurs retournés |
| Commandes | GET /api/commandes | 200 | ✅ 2 commandes retournées |

---

## 🗄️ Données MySQL

### Utilisateurs (5 au total)
```
1. admin
   - Nom: Admin
   - Rôle: admin
   - Actif: Oui
   
2. lahcenbouayoun@gmail.com
   - Nom: lahcen bouayoun
   - Rôle: client
   - Actif: Oui
   
3. client_1776511246873
   - Nom: lahcen bouayoun
   - Rôle: client
   - Actif: Oui
   
4. farah@gmail.com
   - Nom: farah bouayoun
   - Rôle: client
   - Actif: Oui
   
5. client_1776516703683
   - Nom: farah bouayoun
   - Rôle: client
   - Actif: Non
```

### Commandes (2 au total)
```
1. CMD-1003
   - Date: 2026-04-18
   - Client: farah bouayoun
   - Status: En attente
   - Adresse: casa
   - Lignes: 1
   
2. CMD-1001
   - Date: 2026-04-20
   - Client: lahcen bouayoun
   - Status: En attente
   - Adresse: 45 Avenue Hassan II, Rabat
   - Lignes: 1
```

---

## 🧪 Tests Postman / Navigateur

### 1️⃣ Authentification

**URL:** `POST http://localhost:5000/api/auth/login`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "login": "admin",
  "password": "RitaFer@2026"
}
```

**Réponse attendue (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "nom": "Admin",
    "prenom": "",
    "email": "",
    "login": "admin",
    "role": "admin"
  }
}
```

➡️ **Copier le token pour les prochaines requêtes**

---

### 2️⃣ Récupérer les Utilisateurs

**URL:** `GET http://localhost:5000/api/users`

**Headers:**
```json
{
  "Authorization": "Bearer <VOTRE_TOKEN_JWT>",
  "Content-Type": "application/json"
}
```

**Réponse attendue (200 OK):**
```json
[
  {
    "id": 1,
    "nom": "Admin",
    "prenom": "",
    "email": "",
    "login": "admin",
    "role": "admin",
    "is_active": true,
    "createdAt": "2026-04-20T...",
    "updatedAt": "2026-04-20T..."
  },
  {
    "id": 3,
    "nom": "bouayoun",
    "prenom": "lahcen",
    "email": "lahcenbouayoun@gmail.com",
    "login": "lahcenbouayoun@gmail.com",
    "role": "client",
    "is_active": true,
    "telephone": null,
    "entreprise": null,
    "adresse": null,
    "createdAt": "2026-04-20T...",
    "updatedAt": "2026-04-20T..."
  },
  ...
]
```

---

### 3️⃣ Récupérer les Commandes

**URL:** `GET http://localhost:5000/api/commandes`

**Headers:**
```json
{
  "Authorization": "Bearer <VOTRE_TOKEN_JWT>",
  "Content-Type": "application/json"
}
```

**Réponse attendue (200 OK):**
```json
[
  {
    "id": 1,
    "numero": "CMD-1003",
    "date": "2026-04-18",
    "adresse": "casa",
    "user_id": 5,
    "created_at": "2026-04-20T...",
    "status": "En attente",
    "client_email": null,
    "delivery": null,
    "modified_by": null,
    "client_id": 5,
    "client": {
      "id": 5,
      "nom": "bouayoun",
      "prenom": "farah",
      "login": "client_1776516703683",
      "email": "client_1776516703683@local.test"
    },
    "client_name": "farah bouayoun",
    "clientEmail": "client_1776516703683@local.test",
    "LigneCommandes": [
      {
        "id": 1,
        "commande_id": 1,
        "code_article": "ART-001",
        "qte": 10,
        "prix_unitaire": 100.00,
        "tva": 20,
        "prix_ttc": 1200.00,
        "details": "Article test"
      }
    ]
  },
  {
    "id": 2,
    "numero": "CMD-1001",
    "date": "2026-04-20",
    "adresse": "45 Avenue Hassan II, Rabat",
    "user_id": 3,
    "created_at": "2026-04-20T...",
    "status": "En attente",
    "client_email": null,
    "delivery": null,
    "modified_by": null,
    "client_id": 3,
    "client": {
      "id": 3,
      "nom": "bouayoun",
      "prenom": "lahcen",
      "login": "lahcenbouayoun@gmail.com",
      "email": "lahcenbouayoun@gmail.com"
    },
    "client_name": "lahcen bouayoun",
    "clientEmail": "lahcenbouayoun@gmail.com",
    "LigneCommandes": [
      {
        "id": 2,
        "commande_id": 2,
        "code_article": "ART-002",
        "qte": 5,
        "prix_unitaire": 50.00,
        "tva": 20,
        "prix_ttc": 300.00,
        "details": "Autre article"
      }
    ]
  }
]
```

---

## ✅ Vérifications Effectuées

✓ **Connexion MySQL:** Fonctionnelle  
✓ **Routes authentifiées:** Demandent un token JWT valide  
✓ **Route GET /users:** Retourne un tableau JSON d'utilisateurs (sans mot de passe)  
✓ **Route GET /commandes:** Retourne un tableau JSON de commandes avec relations  
✓ **Format JSON:** Conforme, pas d'erreur de sérialisation  
✓ **Permissions:** Admin peut voir tous les utilisateurs et toutes les commandes  
✓ **Types de données:** Corrects (string, number, boolean, date)  

---

## 🚀 Prochaines Étapes

1. **Tester avec Postman:**
   - Importer les URLs ci-dessus dans Postman
   - Utiliser le token JWT fourni par la route login
   - Vérifier que les réponses JSON sont valides

2. **Tester dans le navigateur:**
   - `http://localhost:5000/api/health` (pas de token requis)
   - Les autres routes nécessitent un token

3. **Ajouter des données de test:**
   - Créer d'autres utilisateurs via POST /api/users
   - Créer d'autres commandes via POST /api/commandes

4. **Vérifier les filtres:**
   - Les clients ne voient que leurs propres commandes
   - Les admins voient toutes les commandes

---

## 📝 Commandes Utiles

### Relancer le serveur
```bash
npm start
```

### Relancer les tests
```bash
node test-complete.js
```

### Inspecter la base de données
```bash
node test-routes.js
```

---

**Généré:** 2026-04-20  
**Status:** ✅ TOUS LES TESTS RÉUSSIS
