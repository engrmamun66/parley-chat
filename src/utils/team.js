import { firstName, initials } from './format.js';

/** Find a team member by full or first name; unknown names get neutral colours. */
export function member(team, name) {
  const hit = (team || []).find((t) => t.name === name || firstName(t.name) === firstName(name));
  if (hit) return { initials: initials(hit.name), bg: '#EEF5FF', fg: '#1B84FF', ...hit };
  return { name: name || 'Agent', initials: initials(name), bg: '#EEF5FF', fg: '#1B84FF' };
}
