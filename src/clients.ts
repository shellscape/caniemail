import micromatch from 'micromatch';

import type { SupportType } from './json.js';

export const clientNames = [
  'aol.android',
  'aol.desktop-webmail',
  'aol.ios',
  'apple-mail.ios',
  'apple-mail.macos',
  'fastmail.desktop-webmail',
  'free-fr.desktop-webmail',
  'gmail.android',
  'gmail.desktop-webmail',
  'gmail.ios',
  'gmail.mobile-webmail',
  'gmx.android',
  'gmx.desktop-webmail',
  'gmx.ios',
  'hey.desktop-webmail',
  'ionos-1and1.android',
  'ionos-1and1.desktop-webmail',
  'laposte.android',
  'laposte.desktop-webmail',
  'laposte.ios',
  'mail-ru.desktop-webmail',
  'orange.android',
  'orange.desktop-webmail',
  'orange.ios',
  'outlook.android',
  'outlook.ios',
  'outlook.macos',
  'outlook.outlook-com',
  'outlook.windows',
  'outlook.windows-mail',
  'protonmail.android',
  'protonmail.desktop-webmail',
  'protonmail.ios',
  'rainloop.desktop-webmail',
  'samsung-email.android',
  'sfr.android',
  'sfr.desktop-webmail',
  'sfr.ios',
  't-online-de.desktop-webmail',
  'thunderbird.macos',
  'thunderbird.windows',
  'web-de.android',
  'web-de.desktop-webmail',
  'web-de.ios',
  'wp-pl.desktop-webmail',
  'yahoo.android',
  'yahoo.desktop-webmail',
  'yahoo.ios'
] as const;

export type EmailClient = (typeof clientNames)[number];

type ClientSplit<S extends string> = S extends `${infer First}.${infer Second}`
  ? [First, Second]
  : never;
type ClientTuple = ClientSplit<(typeof clientNames)[number]>;
type Provider = ClientTuple[0];
type Platform = ClientTuple[1];

export type EmailClientGlobs = '*' | `${Provider}.${Platform}` | `*.${Platform}` | `${Provider}.*`;

export interface SupportTypeResult {
  noteNumbers: number[] | undefined;
  type: 'full' | 'partial' | 'none';
}

export const parseClients = (globs: EmailClientGlobs[]) =>
  Array.from(new Set<EmailClient>(micromatch(clientNames, globs) as any));

export function getSupportType(stats: Record<string, SupportType>): SupportTypeResult {
  const statKeys = Object.keys(stats).sort((k1, k2) => {
    if (k1 < k2) return -1;
    else if (k1 > k2) return 1;
    return 0;
  });

  // TODO: option to specify specific version, right now, it defaults to latest
  const latestEmailClient = statKeys[statKeys.length - 1];
  const supportStatus = stats[latestEmailClient];

  let noteNumbers: number[] | undefined = [...supportStatus.matchAll(/#(\d+)/g)]
    .map((matches) => matches[1])
    .map((noteNumber) => Number(noteNumber));

  if (noteNumbers.length === 0) noteNumbers = void 0;

  if (supportStatus.startsWith('y')) return { noteNumbers, type: 'full' };
  else if (supportStatus.startsWith('n')) return { noteNumbers, type: 'none' };

  return { noteNumbers, type: 'partial' };
}
