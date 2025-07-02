# Guide des Fonctionnalités Client - GameZone Manager

## 🔐 Authentification et Gestion de Compte

### Nouvelles Fonctionnalités Ajoutées

#### 1. Changement de Mot de Passe
**Endpoint :** `PUT /api/auth/client/change-password`
**Authentification :** Requise (token client)

```javascript
// Corps de la requête
{
  "currentPassword": "ancienMotDePasse",
  "newPassword": "nouveauMotDePasse"
}

// Headers requis
{
  "Authorization": "Bearer <token_client>",
  "Content-Type": "application/json"
}
```

**Réponses :**
- `200` : Mot de passe changé avec succès
- `400` : Mot de passe actuel incorrect ou données invalides
- `401` : Token manquant ou invalide
- `500` : Erreur serveur

#### 2. Suppression de Compte
**Endpoint :** `DELETE /api/auth/client/delete-account`
**Authentification :** Requise (token client)

```javascript
// Corps de la requête
{
  "password": "motDePasseActuel"
}

// Headers requis
{
  "Authorization": "Bearer <token_client>",
  "Content-Type": "application/json"
}
```

**Actions effectuées :**
- Suppression des réservations du client
- Suppression des sessions du client
- Suppression du compte client

**Réponses :**
- `200` : Compte supprimé avec succès
- `400` : Mot de passe incorrect
- `401` : Token manquant ou invalide
- `404` : Client non trouvé
- `500` : Erreur serveur

## 👤 Gestion du Profil Client

### Nouvelles Routes Ajoutées (`/api/client/`)

#### 1. Récupérer le Profil
**Endpoint :** `GET /api/client/profile`
**Authentification :** Requise (token client)

```javascript
// Réponse
{
  "id_client": 1,
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "created_at": "2025-01-01T10:00:00.000Z"
}
```

#### 2. Mettre à Jour le Profil
**Endpoint :** `PUT /api/client/profile`
**Authentification :** Requise (token client)

```javascript
// Corps de la requête
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prénom", 
  "email": "nouvel.email@example.com"
}
```

#### 3. Récupérer les Réservations
**Endpoint :** `GET /api/client/reservations`
**Authentification :** Requise (token client)

```javascript
// Réponse
[
  {
    "id_reservation": 1,
    "date_reservation": "2025-07-02",
    "heure_debut": "14:00:00",
    "heure_fin": "16:00:00",
    "statut": "confirmee",
    "nom_station": "Gaming Station 1",
    "type_station": "PC Gaming"
  }
]
```

#### 4. Récupérer les Sessions
**Endpoint :** `GET /api/client/sessions`
**Authentification :** Requise (token client)

```javascript
// Réponse
[
  {
    "id_session": 1,
    "heure_debut": "2025-07-02T14:00:00.000Z",
    "heure_fin": "2025-07-02T16:00:00.000Z",
    "duree_session": 120,
    "cout_total": 25.00,
    "nom_station": "Gaming Station 1",
    "type_station": "PC Gaming",
    "date_reservation": "2025-07-02"
  }
]
```

## 🔒 Sécurité

### Mesures de Sécurité Implémentées

1. **Vérification du mot de passe** : Pour les actions sensibles (changement de mot de passe, suppression de compte)
2. **Hachage des mots de passe** : Utilisation de bcrypt avec salt de 10
3. **Validation des données** : Validation avec express-validator
4. **Authentification par token** : JWT avec vérification de l'existence du client
5. **Transactions de base de données** : Pour la suppression de compte (rollback en cas d'erreur)

## 🧪 Tests

### Fichiers de Test Créés

1. **`test-client-account-management.js`** : Tests complets de gestion de compte
2. **`test-mobile-account-management.js`** : Tests pour environnement mobile
3. **`test-complete-client-functionality.js`** : Tests de toutes les fonctionnalités

### Exécution des Tests

```bash
# Test local
node test-client-account-management.js

# Test mobile  
node test-mobile-account-management.js

# Test complet
node test-complete-client-functionality.js
```

## 📱 Utilisation Mobile

Les endpoints sont accessibles depuis un appareil mobile connecté au même réseau.
URL de base pour mobile : `http://[IP_SERVEUR]:3001/api`

### Configuration CORS
Le serveur est configuré pour accepter les connexions depuis différentes adresses IP locales.

## 🛠️ Intégration Frontend

### Exemple d'Utilisation React/Vue

```javascript
// Service de gestion de compte
class AccountService {
  async changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('/api/auth/client/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du changement de mot de passe');
    }
    
    return response.json();
  }
  
  async deleteAccount(password) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('/api/auth/client/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du compte');
    }
    
    // Supprimer le token local après suppression réussie
    localStorage.removeItem('authToken');
    
    return response.json();
  }
}
```

## 🔄 Prochaines Étapes

1. Ajouter la récupération de mot de passe par email
2. Implémenter la double authentification (2FA)
3. Ajouter des logs d'activité pour le client
4. Créer une interface utilisateur pour ces fonctionnalités
