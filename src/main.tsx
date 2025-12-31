import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { db } from './db/db'
import initialData from './data/initialData.json'

// Helper to ensure types match (especially Date objects)
const seedDatabase = async () => {
  try {
    await db.transaction('rw', db.competitors, db.events, db.races, async () => {
      await db.competitors.clear();
      await db.events.clear();
      await db.races.clear();

      if (initialData.competitors.length > 0) {
        await db.competitors.bulkAdd(initialData.competitors);
      }

      if (initialData.events.length > 0) {
        // Convert date strings to Date objects
        const events = initialData.events.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
        await db.events.bulkAdd(events);
      }

      if (initialData.races.length > 0) {
        await db.races.bulkAdd(initialData.races as any);
      }
    });
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

seedDatabase().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
});
