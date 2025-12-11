# Implémentation du Système de Relais - État d'Avancement

## ✅ Complété

### 1. Base de Données
- ✅ Ajout des champs `team1` et `team2` à `BiathlonEvent`
- ✅ Ajout des champs `teamId`, `passageNumber`, `teamTotalTime` à `Race`
- ✅ Migration de la base de données (version 3)

### 2. Composant de Configuration
- ✅ Création de `RelayTeamSetup.tsx`
  - Interface pour ajouter des coureurs aux équipes
  - Réordonnancement des coureurs
  - Possibilité d'ajouter un coureur plusieurs fois
  - Validation (même nombre de passages)

### 3. Corrections
- ✅ Redirections corrigées (retour vers la bonne page de type)
- ✅ Profils filtrés pour n'afficher que les stats Sprint

## 🔄 En Cours / À Faire

### 1. EventCreate.tsx - Intégration Relais
**Fichier**: `src/pages/EventCreate.tsx`

**Modifications nécessaires**:

```tsx
// Dans la fonction de création d'événement (ligne ~80)
const eventId = await db.events.add({
    name,
    date: new Date(date),
    level,
    status: 'active',
    type: type,
    // Ajouter pour les relais:
    ...(type === 'relay' && { team1, team2 })
});

// Créer les races pour les relais
if (type === 'relay') {
    const racePromises = [];
    
    // Team 1
    team1.forEach((competitorId, index) => {
        racePromises.push(db.races.add({
            eventId: eventId as number,
            competitorId,
            mode: 'relay',
            splits: {},
            shooting1: { errors: 0 },
            penaltyCount: 0,
            teamId: 1,
            passageNumber: index + 1
        }));
    });
    
    // Team 2
    team2.forEach((competitorId, index) => {
        racePromises.push(db.races.add({
            eventId: eventId as number,
            competitorId,
            mode: 'relay',
            splits: {},
            shooting1: { errors: 0 },
            penaltyCount: 0,
            teamId: 2,
            passageNumber: index + 1
        }));
    });
    
    await Promise.all(racePromises);
} else {
    // Code existant pour les autres types...
}
```

**Affichage conditionnel** (ligne ~200):
```tsx
{type === 'relay' ? (
    <RelayTeamSetup
        competitors={competitors || []}
        team1={team1}
        team2={team2}
        onTeam1Change={setTeam1}
        onTeam2Change={setTeam2}
    />
) : (
    // Code existant pour la sélection de concurrents...
)}
```

**Bouton de création** (ligne ~250):
```tsx
<button
    onClick={submitEvent}
    disabled={type === 'relay' ? (team1.length === 0 || team1.length !== team2.length) : duels.length === 0}
    className="..."
>
    Créer l'événement
</button>
```

### 2. RelayRace.tsx - Interface de Course
**Fichier à créer**: `src/pages/RelayRace.tsx`

**Fonctionnalités**:
- Affichage des deux équipes côte à côte
- Chrono global pour chaque équipe
- Pour chaque passage:
  - Nom du coureur
  - Chrono du passage
  - Bouton "Départ"
  - Bouton "Arrivée"
  - Input pour le tir (0-5)
  - Calcul automatique des pénalités
- Calcul du temps total de l'équipe
- Détermination du gagnant
- Attribution automatique des points

**Structure suggérée**:
```tsx
export const RelayRace = () => {
    const { id } = useParams();
    const event = useLiveQuery(() => db.events.get(Number(id)));
    const races = useLiveQuery(() => db.races.where('eventId').equals(Number(id)).toArray());
    
    const [team1Time, setTeam1Time] = useState(0);
    const [team2Time, setTeam2Time] = useState(0);
    const [currentPassage1, setCurrentPassage1] = useState(0);
    const [currentPassage2, setCurrentPassage2] = useState(0);
    
    // Logique de chronométrage
    // Logique de passage de relais
    // Calcul des temps
    // Attribution des points
    
    return (
        <div className="grid grid-cols-2 gap-6">
            {/* Équipe 1 */}
            <TeamColumn team={1} ... />
            
            {/* Équipe 2 */}
            <TeamColumn team={2} ... />
        </div>
    );
};
```

### 3. EventDashboard.tsx - Navigation Relais
**Fichier**: `src/pages/EventDashboard.tsx`

**Modification nécessaire** (ligne ~190):
```tsx
{event.type === 'relay' && (
    <button
        onClick={() => navigate(`/relay-race/${eventId}`)}
        className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all"
    >
        <Play className="w-5 h-5" />
        DÉMARRER LE RELAIS
    </button>
)}
```

### 4. App.tsx - Route Relais
**Fichier**: `src/App.tsx`

**Ajout nécessaire**:
```tsx
import { RelayRace } from './pages/RelayRace';

// Dans les routes:
<Route path="relay-race/:id" element={<RelayRace />} />
```

### 5. Système de Points pour Relais
**Fichier**: `src/pages/RelayRace.tsx`

**Fonction à implémenter**:
```tsx
const calculateRelayPoints = async (eventId: number, winningTeamId: number) => {
    const event = await db.events.get(eventId);
    if (!event) return;
    
    const POINTS_SYSTEM = {
        0: { winner: 5, loser: 1 },
        1: { winner: 10, loser: 4 },
        2: { winner: 20, loser: 8 },
        3: { winner: 50, loser: 20 },
        4: { winner: 100, loser: 40 },
        5: { winner: 200, loser: 80 }
    };
    
    const points = POINTS_SYSTEM[event.level as keyof typeof POINTS_SYSTEM];
    
    // Attribuer les points
    const races = await db.races.where('eventId').equals(eventId).toArray();
    
    for (const race of races) {
        const isWinner = race.teamId === winningTeamId;
        await db.races.update(race.id!, {
            points: isWinner ? points.winner : points.loser
        });
    }
};
```

## 📋 Checklist d'Implémentation

- [ ] Modifier `EventCreate.tsx` pour intégrer `RelayTeamSetup`
- [ ] Créer `RelayRace.tsx` avec l'interface de course
- [ ] Ajouter la route dans `App.tsx`
- [ ] Modifier `EventDashboard.tsx` pour le bouton de démarrage
- [ ] Implémenter le système de points pour les relais
- [ ] Tester la création d'un événement relais
- [ ] Tester le déroulement d'une course relais
- [ ] Vérifier l'attribution des points
- [ ] Vérifier que les stats de relais n'apparaissent pas dans les profils

## 🎯 Prochaines Étapes Recommandées

1. **Terminer EventCreate.tsx** (30 min)
   - Intégrer le composant RelayTeamSetup
   - Modifier la logique de création

2. **Créer RelayRace.tsx** (2-3 heures)
   - Interface de course
   - Chronométrage
   - Système de points

3. **Tests** (30 min)
   - Créer un événement relais
   - Simuler une course
   - Vérifier les points

## 📝 Notes Importantes

- Les relais ne comptent PAS dans les statistiques individuelles (déjà implémenté)
- Un concurrent peut passer plusieurs fois dans la même équipe
- Les deux équipes doivent avoir le même nombre de passages
- Le temps total de l'équipe = somme des temps de tous les passages
- Points gagnant = points 1ère place, points perdant = points 3ème place
