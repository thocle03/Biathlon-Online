import { EventsByType } from './EventsByType';

export const PursuitEvents = () => {
    return (
        <EventsByType
            type="pursuit"
            title="Événements Poursuite"
            description="Courses avec départs décalés basés sur les résultats"
        />
    );
};
