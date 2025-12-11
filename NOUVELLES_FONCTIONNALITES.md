# Nouvelles Fonctionnalités - Formats de Course

## Résumé des Modifications

J'ai implémenté deux nouveaux formats de course pour l'application Biathlon : **Relais** et **Poursuite**, avec une refonte complète de l'interface de chronométrage.

---

## 1. Refonte de l'Interface de Course (Race.tsx)

### Fonctionnalités Implémentées

✅ **Chronométrage Individuel**
- Chaque concurrent dispose de son propre bouton "DÉPART"
- Les chronos se lancent indépendamment pour chaque coureur
- Plus de chrono global forcé pour les duels

✅ **Flux de Splits Amélioré**
- **DÉPART** → Lance le chrono individuel
- **ARRIVÉE TOUR 1** → Enregistre l'entrée au pas de tir 1
- **SORTIE TIR 1** → Enregistre la sortie du pas de tir (incluant les tours de pénalité)
- **ARRIVÉE TOUR 2** → Enregistre l'entrée au pas de tir 2
- **SORTIE TIR 2** → Enregistre la sortie du pas de tir 2
- **ARRIVÉE** → Temps final

✅ **Saisie des Tirs**
- **Toujours accessible** pendant la course
- Saisie en **tirs réussis** (0-5) au lieu des erreurs
- Deux sections distinctes : Tir 1 (Couché) et Tir 2 (Debout)
- Affichage visuel avec mise en évidence du score sélectionné

---

## 2. Nouveau Format : Relais

### Création d'Événement
- Sélection du type "Relais (Liste)" dans la création d'événement
- Génération automatique en mode liste (pas de duels)
- Chaque participant court individuellement

### Interface de Course
- Utilise la même interface que Sprint/Individuel
- Format : 1 tour → Tir Couché → 1 tour → Tir Debout → Passage de relais
- Bouton final marqué "ARRIVÉE" (représente le passage de relais)

---

## 3. Nouveau Format : Poursuite

### Création d'Événement
- Sélection du type "Poursuite (Liste)" dans la création d'événement
- Saisie manuelle des participants
- Configuration des intervalles de départ

### Interface Spécifique (PursuitRace.tsx)

✅ **Chrono Général**
- Affichage d'un chrono maître en haut de page
- Bouton "LANCER DÉPART" pour démarrer l'événement
- Tous les participants visibles simultanément

✅ **Tableau de Suivi**
Colonnes :
- **Concurrent** : Nom du participant
- **Départ (Offset)** : Temps de départ (éditable avant le lancement)
- **Chrono Course** : Temps en cours
- **Tir 1** : Boutons 0-5 pour saisie rapide
- **Tir 2** : Boutons 0-5 pour saisie rapide
- **Action** : Boutons de split (DÉPART, FIN TOUR 1, SORTIE TIR 1, etc.)
- **Résultat** : Temps final

✅ **Fonctionnalités Avancées**
- Alerte visuelle "START!" quand un concurrent doit partir
- Mise en évidence des concurrents prêts à démarrer
- Saisie des tirs directement dans le tableau
- Tri automatique par offset de départ

---

## 4. Modifications de la Base de Données

### Schéma `BiathlonEvent`
```typescript
{
    type: 'sprint' | 'pursuit' | 'relay' | 'individual'
    startTime?: number  // Chrono maître pour les poursuites
}
```

### Schéma `Race`
```typescript
{
    startOffset?: number  // Offset de départ (ms) pour poursuite
    shooting3?: ShootingScore  // Support pour 4 tirs (extensibilité)
    shooting4?: ShootingScore
}
```

### Schéma `SplitTimes`
```typescript
{
    start?: number      // Temps de départ individuel
    lap1?: number       // Entrée Tir 1
    shoot1?: number     // Sortie Tir 1
    lap2?: number       // Entrée Tir 2
    shoot2?: number     // Sortie Tir 2
    lap3?: number       // Extensibilité
    shoot3?: number
    lap4?: number
    shoot4?: number
    finish?: number     // Arrivée
}
```

---

## 5. Tableau de Bord Événement (EventDashboard.tsx)

### Mode Duel (Sprint/Individuel)
- Affichage classique des duels
- Bouton "Lancer" pour chaque duel
- Saisie manuelle disponible

### Mode Liste (Poursuite/Relais)
- Affichage de la liste des participants
- **Bouton "INTERFACE COURSE"** en haut → Ouvre `/race-mass/:eventId`
- Pas de boutons "Lancer" individuels
- Ajout de participants en mode solo

---

## 6. Routes Ajoutées

- `/race-mass/:id` → Interface Poursuite (PursuitRace.tsx)
- Route existante `/race/:id` → Interface Duel (Race.tsx)

---

## 7. Utilisation

### Créer un Événement Relais
1. Aller dans "Événements" → "Nouvel Événement"
2. Sélectionner "Relais (Liste)"
3. Choisir les participants
4. Cliquer "Générer la liste"
5. Créer l'événement

### Créer une Poursuite
1. Aller dans "Événements" → "Nouvel Événement"
2. Sélectionner "Poursuite (Liste)"
3. Choisir les participants
4. Cliquer "Générer la liste"
5. Créer l'événement
6. Dans le tableau de bord, éditer les offsets de départ si nécessaire
7. Cliquer "INTERFACE COURSE"
8. Cliquer "LANCER DÉPART" pour démarrer le chrono général
9. Utiliser les boutons de split et de tir pour chaque concurrent

### Utiliser l'Interface de Course Améliorée
1. Lancer un duel Sprint/Individuel
2. Cliquer "DÉPART" pour chaque concurrent indépendamment
3. Saisir les tirs à tout moment (toujours accessibles)
4. Utiliser les boutons de split pour enregistrer les temps intermédiaires
5. Le bouton "SORTIE TIR" capture le temps incluant les tours de pénalité

---

## Compatibilité

✅ Tous les événements existants continuent de fonctionner
✅ Les événements sans `type` sont traités comme "Sprint" par défaut
✅ Export/Import de données compatible
✅ Statistiques globales compatibles avec tous les formats

---

## Prochaines Améliorations Possibles

- Support complet pour 4 tirs (Individuel longue distance)
- Gestion des équipes pour les relais
- Calcul automatique des offsets de poursuite depuis un Sprint précédent
- Interface mobile optimisée pour le chronométrage sur le terrain
