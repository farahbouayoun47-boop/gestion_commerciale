# Tests API avec Curl/PowerShell

## 1️⃣ Authentification - Obtenir un Token JWT

```powershell
$body = @{
    login = "admin"
    password = "RitaFer@2026"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

## 2️⃣ Récupérer les Utilisateurs

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/users" `
    -Method Get `
    -Headers $headers

$response.Content | ConvertFrom-Json | Format-Table -AutoSize
```

## 3️⃣ Récupérer les Commandes

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/commandes" `
    -Method Get `
    -Headers $headers

$response.Content | ConvertFrom-Json | Format-Table -AutoSize
```

---

## Avec Curl (CMD/PowerShell)

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"login\":\"admin\",\"password\":\"RitaFer@2026\"}"
```

### 2. Get Users (remplacer TOKEN par la valeur reçue)
```bash
curl -X GET http://localhost:5000/api/users ^
  -H "Authorization: Bearer TOKEN"
```

### 3. Get Commandes
```bash
curl -X GET http://localhost:5000/api/commandes ^
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Résumé des URLs

| Méthode | URL | Authentification |
|---------|-----|-----------------|
| POST | http://localhost:5000/api/auth/login | ❌ Non requis |
| GET | http://localhost:5000/api/users | ✅ JWT Token requis |
| GET | http://localhost:5000/api/commandes | ✅ JWT Token requis |

