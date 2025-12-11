# Système de Relais - Spécifications

## Vue d'ensemble
Les relais sont des courses par équipes où 2 équipes s'affrontent. Chaque membre de l'équipe effectue 1 tour + 1 tir, puis passe le relais au suivant.

## Format de Course

### Structure
- **2 équipes** qui s'affrontent
- **Ordre prédéfini** des coureurs dans chaque équipe
- **Un même concurrent peut passer plusieurs fois** dans la même équipe
- **1 tour + 1 tir** par passage
- **Tours de pénalité** après le tir si nécessaire
- **Passage de relais** après les pénalités

### Déroulement
1. Premier coureur de chaque équipe démarre
2. Effectue 1 tour de ski
3. Effectue 1 tir (couché ou debout)
4. Effectue les tours de pénalité (1 par cible manquée)
5. Passe le relais au coureur suivant de son équipe
6. Le processus se répète jusqu'à ce que tous les passages soient terminés

## Système de Points

### Points pour l'Équipe Gagnante
- **Niveau 0** : 5 points
- **Niveau 1** : 10 points
- **Niveau 2** : 20 points
- **Niveau 3** : 50 points
- **Niveau 4** : 100 points
- **Niveau 5** : 200 points

### Points pour l'Équipe Perdante
Tous les membres de l'équipe perdante reçoivent les points de la **3ème place** :
- **Niveau 0** : 1 point
- **Niveau 1** : 4 points
- **Niveau 2** : 8 points
- **Niveau 3** : 20 points
- **Niveau 4** : 40 points
- **Niveau 5** : 80 points

## Interface de Création

### Configuration Pré-Course
1. **Sélection des équipes**
   - Équipe 1 : Liste ordonnée des coureurs
   - Équipe 2 : Liste ordonnée des coureurs
   
2. **Ordre des passages**
   - Possibilité d'ajouter/retirer des passages
   - Possibilité de réordonner les coureurs
   - Un coureur peut apparaître plusieurs fois

3. **Validation**
   - Les deux équipes doivent avoir le même nombre de passages
   - Au moins 1 passage par équipe

## Interface de Course

### Affichage
- **Chrono Équipe 1** (temps total cumulé)
- **Chrono Équipe 2** (temps total cumulé)
- **Passage actuel** pour chaque équipe
- **Coureur actuel** pour chaque équipe

### Pour Chaque Passage
- Nom du coureur
- Temps du passage
- Score au tir (X/5)
- Nombre de pénalités
- Bouton "Terminer le passage"

### Fin de Course
- Temps total de chaque équipe
- Équipe gagnante
- Attribution automatique des points

## Modifications de la Base de Données

### Table `races`
Champs supplémentaires nécessaires :
- `teamId` : Identifiant de l'équipe (1 ou 2)
- `passageNumber` : Numéro du passage dans le relais
- `teamTotalTime` : Temps total de l'équipe (calculé)

### Table `events`
Champs supplémentaires pour les relais :
- `team1` : Array des IDs des coureurs de l'équipe 1 dans l'ordre
- `team2` : Array des IDs des coureurs de l'équipe 2 dans l'ordre

## Implémentation Technique

### Composants à Créer
1. **RelaySetup.tsx** - Configuration des équipes avant la course
2. **RelayRace.tsx** - Interface de course en temps réel
3. **RelayResults.tsx** - Affichage des résultats

### Flux de Données
1. Création événement → Configuration équipes → Sauvegarde
2. Démarrage course → Chrono équipes → Enregistrement passages
3. Fin course → Calcul gagnant → Attribution points

### Calculs
- Temps total équipe = Somme des temps de tous les passages
- Gagnant = Équipe avec le temps total le plus court
- Points = Selon le niveau et le résultat (gagnant/perdant)

## Notes d'Implémentation
- Les relais utilisent le même système de chronométrage que les autres courses
- Chaque passage est enregistré comme une `race` individuelle
- Le lien entre les passages se fait via `eventId` et `teamId`
- Les statistiques individuelles ne comptent PAS les relais (uniquement Sprint)
