# Documentation Technique et Fonctionnelle - Biathlon Manager

Ce document détaille le fonctionnement de l'application de gestion de Biathlon, les technologies utilisées, la structure des pages et la gestion des données.

## 1. Technologies Utilisées

L'application est une Single Page Application (SPA) moderne construite avec les outils suivants :

*   **Core :**
    *   **React (v18)** : Bibliothèque d'interface utilisateur.
    *   **TypeScript** : Superset typé de JavaScript pour une meilleure maintenabilité.
    *   **Vite** : Outil de build et serveur de développement ultra-rapide.

*   **Style & UI :**
    *   **Tailwind CSS** : Framework CSS utilitaire pour le design (Glassmorphism, Responsive).
    *   **Lucide React** : Librairie d'icônes vectorielles.
    *   **React Hot Toast** : Système de notifications (succès, erreurs).

*   **Données & État :**
    *   **Dexie.js** : Wrapper pour **IndexedDB**. C'est une base de données NoSQL stockée directement dans le navigateur du client.
    *   **Dexie React Hooks** : (`useLiveQuery`) Permet à l'interface de se mettre à jour automatiquement dès que la base de données change.

*   **Routing :**
    *   **React Router Dom** : Gestion de la navigation entre les pages sans rechargement.

---

## 2. Structure et Fonctionnalités des Pages

### A. Tableau de Bord (Accueil)
*   **Route:** `/`
*   **Fonction:** Vue d'ensemble. Permet un accès rapide aux sections principales : Concurrents, Événements, Statistiques. Affiche souvent les derniers événements ou des statistiques résumées.

### B. Gestion des Concurrents
*   **Routes:** `/competitors`, `/competitors/:id`
*   **Fonctionnalités:**
    *   Liste de tous les athlètes enregistrés.
    *   Ajout de nouveaux athlètes (Nom, Club, etc.).
    *   Consultation des détails d'un athlète : historique des courses, statistiques de tir et de temps.

### C. Gestion des Événements
*   **Routes:** `/events`, `/events/create`, `/events/:id`
*   **Création (`EventCreate.tsx`) :**
    *   Configuration du nom, de la date (par défaut 14/08/2025) et du niveau de difficulté (1-5).
    *   Sélection des participants.
    *   Génération automatique ou manuelle des duels (paires).
*   **Tableau de Bord Événement (`EventDashboard.tsx`) :**
    *   **Édition :** Modification du nom et de la date de l'événement.
    *   **Gestion des Duels :** Ajout de duels après coup ("Ajouter un duel"), suppression de duels spécifiques.
    *   **Lancement :** Bouton "Lancer" pour démarrer le chronomètre d'une course.
    *   **Saisie Manuelle :** Boutons "Crayon" pour saisir directement les temps (pour le joueur 1 et le joueur 2 indépendamment).
    *   **Classement Live :** Affiche les résultats en temps réel pour cet événement.

### D. Interface de Course
*   **Route:** `/race/:id`
*   **Fonction:** Chronomètre interactif.
    *   Gestion des tours de ski.
    *   Gestion du tir (cibles réussies/ratées).
    *   Calcul automatique des pénalités.

### E. Statistiques
*   **Route:** `/stats`
*   **Fonction:** Classement global et analyses.
    *   **Filtres :** Possibilité de voir le classement "Global" (toutes années confondues) ou filtré par année (ex: 2024, 2025).
    *   **Podiums :** Mise en avant des 3 meilleurs.
    *   **Tableau Détaillé :** Points, victoires, nombre de courses.
    *   **Analyses Techniques :** Meilleurs temps de ski (soustraction faite des temps de tir) et meilleurs tireurs (% de réussite).

---

## 3. Gestion de la Base de Données

L'application utilise une approche **"Local-First"**. Il n'y a pas de serveur backend classique (comme SQL ou Mongo sur un serveur distant). Tout est stocké dans le navigateur de l'utilisateur via **IndexedDB**.

### A. Schéma de Données (`src/db/db.ts`)
La base de données `BiathlonDB` contient trois tables principales :
1.  **competitors** : `id, name, ...`
2.  **events** : `id, date, level, status...`
3.  **races** : `id, eventId, competitorId, totalTime, shooting...`

### B. Sauvegarde et Persistance
*   Les données sont persistantes tant que l'utilisateur ne vide pas le cache/données de son navigateur.
*   Si vous fermez l'onglet ou redémarrez l'ordinateur, les données sont conservées.

### C. Comment Reset / Voir les données (Pour les développeurs)
1.  Ouvrez les outils de développement (F12).
2.  Allez dans l'onglet **Application**.
3.  Dans la section **Storage**, déroulez **IndexedDB**.
4.  Vous verrez la base `BiathlonDB`. Vous pouvez cliquer sur les tables pour voir les données brutes.
5.  Pour tout effacer : Cliquez droit sur `BiathlonDB` -> **Delete database**.

---

## 4. Maintenance et Développement

### Commandes Principales
*   `npm run dev` : Lance le serveur de développement local (généralement sur `http://localhost:5173`).
*   `npm run build` : Compile l'application pour la production (crée le dossier `dist`).
*   `npm run preview` : Prévisualise la version de production localement.

### Structure du Code
*   `src/components` : Composants réutilisables (Boutons, Modales, Cards).
*   `src/pages` : Les vues principales (Correspondent aux routes).
*   `src/db` : Configuration de la base de données.
*   `src/App.tsx` : Point d'entrée principal avec la configuration du Routeur.
