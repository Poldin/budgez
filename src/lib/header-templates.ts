export interface HeaderTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const headerTemplates: HeaderTemplate[] = [
  {
    id: 'completo',
    name: 'Completo',
    description: 'Intestazione completa con tutti i dettagli',
    content: `Spett.le
[NOME AZIENDA/ENTE]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])
CF/P.IVA: [CODICE FISCALE]

Alla cortese attenzione di [NOME REFERENTE]`
  },
  {
    id: 'formale',
    name: 'Formale',
    description: 'Intestazione formale standard',
    content: `Spett.le [NOME AZIENDA]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])

Att.ne [NOME REFERENTE]`
  },
  {
    id: 'breve',
    name: 'Breve',
    description: 'Intestazione essenziale',
    content: `Spett.le [NOME AZIENDA]
[CITTÀ]

Att.ne [NOME REFERENTE]`
  },
  {
    id: 'gentile',
    name: 'Gentile',
    description: 'Tono più cordiale',
    content: `Gentile [NOME REFERENTE]
[NOME AZIENDA]
[INDIRIZZO]
[CAP] [CITTÀ]`
  },
  {
    id: 'ente-pubblico',
    name: 'Ente Pubblico',
    description: 'Per amministrazioni e enti pubblici',
    content: `Spett.le
[NOME ENTE/AMMINISTRAZIONE]
[UFFICIO/DIPARTIMENTO]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])
PEC: [INDIRIZZO PEC]`
  },
  {
    id: 'con-riferimento',
    name: 'Con Riferimento',
    description: 'Include riferimento pratica',
    content: `Spett.le [NOME AZIENDA]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])

Att.ne [NOME REFERENTE]
Rif.: [NUMERO PRATICA/RDO]`
  },
  {
    id: 'professionale',
    name: 'Professionale',
    description: 'Per professionisti e studi',
    content: `Egregio/a [TITOLO] [NOME COGNOME]
[NOME STUDIO/SOCIETÀ]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])`
  },
  {
    id: 'essenziale',
    name: 'Essenziale',
    description: 'Minimo indispensabile',
    content: `[NOME AZIENDA]
Att.ne [NOME REFERENTE]
[CITTÀ]`
  }
];

export function getHeaderTemplate(id: string): HeaderTemplate | undefined {
  return headerTemplates.find(t => t.id === id);
}

export const defaultHeaderTemplate = headerTemplates[0]; // Professionale come default

