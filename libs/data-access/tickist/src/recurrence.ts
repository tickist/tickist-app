// Dependency-free entry point for recurrence rules. The web app imports this
// instead of the full data-access library, which needs a Supabase client.
export * from './lib/recurrence';

export { nextRecurringFinishDate } from './lib/task-lifecycle';
