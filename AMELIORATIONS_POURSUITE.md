# Améliorations Poursuite et Organisation des Événements

## Résumé des Modifications

J'ai implémenté les améliorations demandées pour l'interface de poursuite et la séparation des événements par type.

---

## 1. Améliorations Interface Poursuite

### ✅ Démarrage Automatique des Chronos Individuels
- **Fonctionnement** : Quand le chrono général atteint l'offset d'un concurrent, son chrono démarre automatiquement
- **Visuel** : Alerte "START!" affichée quand un concurrent doit partir
- **Logique** : `useEffect` surveille le temps maître et lance les chronos aux bons moments

### ✅ Arrêt Automatique du Chrono Général
- **Détection** : Le système détecte quand tous les participants ont franchi la ligne d'arrivée
- **Arrêt** : Le chrono général s'arrête automatiquement
- **Affichage** : 
  - Chrono passe en vert
  - Message "ARRÊTÉ" affiché
  - Bouton "ARRÊTER" manuel disponible pendant la course

### ✅ Gestion des Offsets de Départ
- **Édition** : Les offsets peuvent être modifiés AVANT le lancement du chrono général
- **Format** : Saisie en secondes, stockage en millisecondes
- **Affichage** : Format MM:SS.t une fois la course lancée
- **Tri** : Les participants sont automatiquement triés par offset croissant

### Code Clé (PursuitRace.tsx)
```typescript
// Détection de fin de course
const allFinished = races?.every(r => r.splits.finish) || false;

// Arrêt du timer si tous ont fini
useEffect(() => {
    if (allFinished && event?.startTime) {
        return; // Don't update timer
    }
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
}, [allFinished, event?.startTime]);

// Démarrage automatique des chronos individuels
useEffect(() => {
    if (!event?.startTime || !races) return;
    const masterTime = Date.now() - event.startTime;
    
    races.forEach(async (race) => {
        const shouldAutoStart = masterTime >= (race.startOffset || 0) && !race.splits.start;
        if (shouldAutoStart) {
            const splits = { ...race.splits, start: Date.now() };
            await db.races.update(race.id!, { splits });
        }
    });
}, [now, event?.startTime, races]);
```

---

## 2. Exclusion des Événements Non-Sprint des Statistiques

### ✅ Filtrage Automatique
- **Règle** : Seuls les événements de type "Sprint" (ou sans type défini) comptent pour les statistiques
- **Impact** : 
  - Classement général
  - Meilleurs temps
  - Meilleurs tireurs
  - Podiums
  - Tous les calculs de points

### Code (Stats.tsx)
```typescript
// Filter logic - Only Sprint events count for statistics
const sprintEvents = events.filter(e => !e.type || e.type === 'sprint');
const availableYears = Array.from(new Set(sprintEvents.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

const filteredEvents = selectedYear === 'all'
    ? sprintEvents
    : sprintEvents.filter(e => new Date(e.date).getFullYear() === selectedYear);
```

---

## 3. Séparation des Événements par Type

### ✅ Nouvelles Pages Créées

#### **Sprint** (`/events/sprint`)
- Affiche uniquement les événements Sprint
- Description : "Courses en duel avec 2 tirs (couché et debout)"

#### **Poursuite** (`/events/pursuit`)
- Affiche uniquement les événements Poursuite
- Description : "Courses avec départs décalés basés sur les résultats"

#### **Relais** (`/events/relay`)
- Affiche uniquement les événements Relais
- Description : "Courses par équipes avec passage de relais"

#### **Individuel** (`/events/individual`)
- Affiche uniquement les événements Individuel
- Description : "Courses individuelles avec 4 tirs"

### ✅ Menu Restructuré
```
📊 Tableau de bord
👥 Concurrents

📅 ÉVÉNEMENTS
  ⏱️ Sprint
  ⏱️ Poursuite
  ⏱️ Relais
  ⏱️ Individuel

🏆 Statistiques
⚙️ Paramètres
```

### ✅ Composant Générique `EventsByType`
- **Réutilisable** : Un seul composant pour tous les types
- **Filtrage** : Utilise `db.events.where('type').equals(type)`
- **Affichage** :
  - Grille de cartes d'événements
  - Nombre de participants
  - Nombre de courses terminées
  - Bouton "Nouvel Événement"
  - Message si aucun événement

---

## 4. Fichiers Créés

### Nouveaux Composants
- `src/pages/EventsByType.tsx` - Composant générique
- `src/pages/SprintEvents.tsx` - Page Sprint
- `src/pages/PursuitEvents.tsx` - Page Poursuite
- `src/pages/RelayEvents.tsx` - Page Relais
- `src/pages/IndividualEvents.tsx` - Page Individuel

### Fichiers Modifiés
- `src/pages/PursuitRace.tsx` - Auto-start et auto-stop
- `src/pages/Stats.tsx` - Filtrage Sprint uniquement
- `src/components/Layout.tsx` - Nouveau menu
- `src/App.tsx` - Nouvelles routes

---

## 5. Routes Ajoutées

```typescript
/events/sprint      → SprintEvents
/events/pursuit     → PursuitEvents
/events/relay       → RelayEvents
/events/individual  → IndividualEvents
```

---

## 6. Utilisation

### Créer un Événement Poursuite
1. Aller dans "Événements" → "Poursuite"
2. Cliquer "Nouvel Événement"
3. Sélectionner type "Poursuite (Liste)"
4. Ajouter les participants
5. Créer l'événement

### Configurer les Offsets
1. Ouvrir le tableau de bord de l'événement
2. Cliquer "INTERFACE COURSE"
3. **AVANT de lancer** : Éditer les offsets dans la colonne "Départ (Offset)"
4. Saisir en secondes (ex: 15 pour +15 secondes)

### Lancer la Course
1. Cliquer "LANCER DÉPART"
2. Le chrono général démarre
3. Les chronos individuels démarrent automatiquement selon leurs offsets
4. Alerte "START!" visible pour chaque concurrent au bon moment
5. Le chrono s'arrête automatiquement quand tous ont fini

### Arrêt Manuel
- Bouton "ARRÊTER" disponible pendant la course
- Permet d'arrêter manuellement si besoin

---

## 7. Compatibilité

✅ Les événements existants sans `type` sont traités comme "Sprint"
✅ Les statistiques continuent de fonctionner normalement
✅ Export/Import compatible
✅ Aucune migration de données nécessaire

---

## 8. Points Techniques

### Gestion du Timer
- **Intervalle** : 100ms (10Hz) pour fluidité
- **Arrêt conditionnel** : `useEffect` avec dépendance sur `allFinished`
- **Précision** : Timestamps en millisecondes

### Performance
- **Requêtes optimisées** : Filtrage au niveau de la base de données
- **Réactivité** : `useLiveQuery` pour mises à jour en temps réel
- **Tri automatique** : Par offset de départ

### UX
- **Feedback visuel** : Couleurs, animations, alertes
- **État clair** : "ARRÊTÉ" affiché explicitement
- **Navigation intuitive** : Menu organisé par type d'événement
