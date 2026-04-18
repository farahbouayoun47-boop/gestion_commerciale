# Gestion Commerciale

Application de gestion commerciale avec interface web moderne.

## 🚀 Démarrage Rapide

Pour démarrer l'application complète (backend + frontend), utilisez l'un des scripts suivants :

### Option 1: Script Batch (Windows)
Double-cliquez sur `start-servers.bat`

### Option 2: Script PowerShell
Exécutez `start-servers.ps1` dans PowerShell

## 📋 Ce que font les scripts

1. **Backend Server** (`http://localhost:5000`)
   - API REST pour la gestion des commandes
   - Base de données MySQL
   - Authentification JWT

2. **Frontend Server** (`http://localhost:3001`)
   - Application React
   - Interface utilisateur
   - Routing SPA (Single Page Application)

## 🔧 Connexion Admin

- **Login**: `admin`
- **Mot de passe**: `RitaFer@2026`
- **URL**: `http://localhost:3001`

## 🛠️ Dépannage

Si les serveurs ne démarrent pas :

1. Vérifiez que Node.js et Python sont installés
2. Vérifiez que MySQL est en cours d'exécution
3. Vérifiez les ports 3000 et 5000 (ne doivent pas être utilisés)

## 📁 Structure du projet

```
gestion-commerciale/
├── backend/          # Serveur API (Node.js/Express)
├── frontend/         # Application React
├── start-servers.bat # Script de démarrage (Windows)
└── start-servers.ps1 # Script de démarrage (PowerShell)
```