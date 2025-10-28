export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Condizioni base per servizi generici',
    content: `CONDIZIONI DI PAGAMENTO:
• Acconto del 30% alla firma del contratto
• Saldo alla consegna del progetto/servizio
• Pagamenti tramite bonifico bancario entro [GIORNI] giorni dalla data fattura

VALIDITÀ DELL'OFFERTA:
• La presente offerta ha validità di [GIORNI] giorni dalla data di emissione

TERMINI DI CONSEGNA:
• Il completamento del progetto è previsto entro [TEMPO] dalla firma del contratto
• Eventuali ritardi dovuti a cause di forza maggiore non sono imputabili al fornitore

GARANZIA:
• [MESI] mesi di garanzia su difetti di fabbricazione o malfunzionamenti
• La garanzia non copre danni derivanti da uso improprio o modifiche non autorizzate

RECESSO:
• Il cliente può recedere dal contratto con un preavviso scritto di [GIORNI] giorni
• In caso di recesso, l'acconto versato non sarà rimborsabile

PROPRIETÀ INTELLETTUALE:
• Tutti i materiali prodotti restano di proprietà del fornitore fino al saldo completo
• Dopo il pagamento, la proprietà viene trasferita al cliente


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  },
  {
    id: 'it-sviluppo',
    name: 'IT / Sviluppo Software',
    description: 'Per progetti di sviluppo software e IT',
    content: `MODALITÀ DI PAGAMENTO:
• 30% acconto alla firma
• 30% al completamento dello sviluppo
• 40% alla messa in produzione
• Termini di pagamento: [GIORNI] giorni data fattura

TEMPISTICHE DI PROGETTO:
• Durata stimata: [TEMPO]
• Milestone di progetto come da planning allegato
• Eventuali ritardi saranno comunicati tempestivamente

SUPPORTO E MANUTENZIONE:
• [MESI] mesi di supporto tecnico gratuito post-rilascio
• Bug fixing incluso nel periodo di garanzia
• Manutenzione ordinaria e straordinaria quotabile separatamente

PROPRIETÀ DEL CODICE:
• Il codice sorgente diventa di proprietà del cliente al saldo finale
• Librerie e framework di terze parti mantengono le rispettive licenze
• Documentazione tecnica fornita al termine del progetto

HOSTING E INFRASTRUTTURA:
• Costi di hosting non inclusi salvo diversa indicazione
• Il cliente è responsabile della fornitura di credenziali e accessi necessari

MODIFICHE E VARIAZIONI:
• Modifiche sostanziali ai requisiti saranno oggetto di preventivo integrativo
• Change request minori incluse fino a [ORE] ore di sviluppo

TESTING E COLLAUDO:
• Fase di testing inclusa nel progetto
• User Acceptance Test (UAT) a cura del cliente
• Rilascio in produzione previo collaudo positivo


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  },
  {
    id: 'consulenza',
    name: 'Consulenza',
    description: 'Per servizi di consulenza professionale',
    content: `COMPENSO E MODALITÀ DI PAGAMENTO:
• Tariffazione: [TIPO - oraria/giornaliera/forfait]
• Pagamento mensile posticipato
• Fatturazione entro il [GIORNO] di ogni mese
• Termini di pagamento: [GIORNI] giorni data fattura

DURATA DELL'INCARICO:
• Decorrenza: [DATA INIZIO]
• Durata: [MESI] mesi rinnovabili tacitamente
• Preavviso per recesso: [GIORNI] giorni

MODALITÀ DI SVOLGIMENTO:
• [N] giornate/ore al mese presso il cliente
• Possibilità di lavoro da remoto previo accordo
• Disponibilità per call e meeting come da calendario condiviso

SPESE E RIMBORSI:
• Spese di trasferta a carico del cliente
• Rimborsi su presentazione di documenti fiscali validi
• Anticipazione spese concordata separatamente

DELIVERABLE:
• Report periodici sullo stato di avanzamento
• Documentazione delle attività svolte
• Presentazioni e materiali secondo pianificazione

RISERVATEZZA:
• Obbligo di riservatezza su informazioni confidenziali
• Non disclosure agreement (NDA) come da accordo separato
• Divieto di utilizzo di informazioni per scopi personali

RISOLUZIONE:
• Ciascuna parte può recedere con [GIORNI] giorni di preavviso
• In caso di inadempienza, risoluzione immediata con diritto al compenso maturato


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  },
  {
    id: 'creativo',
    name: 'Servizi Creativi',
    description: 'Per design, marketing, creatività',
    content: `PAGAMENTI:
• 50% acconto alla firma
• 50% all'approvazione finale e consegna
• Metodo: bonifico bancario entro [GIORNI] giorni

FASI DI LAVORO:
• Brief iniziale e ricerca
• Presentazione concept ([N] proposte)
• Revisioni: fino a [N] round di modifiche incluse
• Consegna file finali

REVISIONI E MODIFICHE:
• [N] revisioni incluse nel preventivo
• Modifiche sostanziali oltre le revisioni incluse: [COSTO]/ora
• Richiesta di revisioni via email con feedback dettagliato

PROPRIETÀ E UTILIZZO:
• Copyright trasferito al cliente al saldo finale
• Diritto del fornitore di utilizzare il lavoro nel proprio portfolio
• Utilizzo consentito: [SPECIFICARE AMBITI]

MATERIALI FORNITI:
• File sorgenti editabili (AI, PSD, etc.)
• File export per stampa e web
• Linee guida per l'utilizzo (se applicabile)

MATERIALI DEL CLIENTE:
• Il cliente fornirà testi, immagini e materiali necessari entro [GIORNI] giorni
• Ritardi nella fornitura dei materiali possono impattare le tempistiche

STAMPA E PRODUZIONE:
• Costi di stampa/produzione non inclusi salvo diversa indicazione
• Supervisione della produzione quotabile separatamente
• Approvazione finale prima della stampa a cura del cliente

VALIDITÀ:
• Preventivo valido [GIORNI] giorni
• Prezzi soggetti a variazioni oltre tale periodo


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  },
  {
    id: 'formazione',
    name: 'Formazione',
    description: 'Per corsi e attività formative',
    content: `MODALITÀ DI PAGAMENTO:
• 100% entro [GIORNI] giorni prima dell'inizio del corso
• Oppure: 50% alla conferma + 50% al primo giorno di corso
• Pagamento tramite bonifico bancario

ORGANIZZAZIONE DEL CORSO:
• Durata: [ORE/GIORNI]
• Date: [PERIODO/DATE]
• Orario: [ORARIO]
• Modalità: [PRESENZA/ONLINE/IBRIDO]
• Sede: [PRESSO CLIENTE/NOSTRA SEDE/ONLINE]

MATERIALE DIDATTICO:
• Dispense e materiali forniti in formato digitale
• Certificato di partecipazione al termine
• Accesso a piattaforma online (se applicabile)

NUMERO PARTECIPANTI:
• Minimo: [N] partecipanti
• Massimo: [N] partecipanti
• Il corso si intende confermato al raggiungimento del numero minimo

CANCELLAZIONE E RINVIO:
• Cancellazione oltre [GIORNI] giorni: rimborso 100%
• Cancellazione tra [GIORNI] e [GIORNI] giorni: rimborso 50%
• Cancellazione entro [GIORNI] giorni: nessun rimborso
• Il fornitore si riserva il diritto di rinviare per cause di forza maggiore

ATTREZZATURE E REQUISITI:
• Aula e attrezzature tecniche a carico del [CLIENTE/FORNITORE]
• Requisiti tecnici comunicati [GIORNI] giorni prima
• Ogni partecipante deve disporre di [SPECIFICHE]

ASSISTENZA POST-CORSO:
• [ORE/GIORNI] di supporto via email
• Follow-up session dopo [TEMPO] (se previsto)
• Materiali aggiuntivi disponibili su richiesta


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  },
  {
    id: 'abbonamento',
    name: 'Abbonamento/Ricorrente',
    description: 'Per servizi in abbonamento o ricorrenti',
    content: `TIPOLOGIA ABBONAMENTO:
• Piano: [NOME PIANO]
• Durata: [MENSILE/TRIMESTRALE/ANNUALE]
• Costo: [IMPORTO] + IVA per periodo

FATTURAZIONE E PAGAMENTO:
• Fatturazione anticipata all'inizio di ogni periodo
• Pagamento entro [GIORNI] giorni dall'emissione fattura
• Metodo: addebito automatico SEPA / bonifico bancario

SERVIZI INCLUSI:
• [ELENCO SERVIZI/PRESTAZIONI INCLUSE]
• [QUANTITÀ] ore/unità di servizio per periodo
• Supporto: [EMAIL/TELEFONO/TICKET] in orario [ORARIO]

RINNOVO E DISDETTA:
• Rinnovo automatico alla scadenza
• Disdetta con preavviso di [GIORNI] giorni via PEC/raccomandata
• Nessun rimborso per periodi già fatturati

VARIAZIONI DI PIANO:
• Upgrade possibile in qualsiasi momento
• Downgrade al termine del periodo corrente
• Differenze di prezzo regolate pro-rata

SERVICE LEVEL AGREEMENT (SLA):
• Disponibilità garantita: [PERCENTUALE]%
• Tempo di risposta: [ORE] ore lavorative
• Risoluzione issue critiche: [ORE/GIORNI] lavorativi

SOSPENSIONE DEL SERVIZIO:
• Sospensione automatica in caso di mancato pagamento oltre [GIORNI] giorni
• Riattivazione previo saldo arretrati + [EVENTUALE PENALE]
• Dati conservati per [GIORNI] dalla sospensione

AGGIORNAMENTI E MANUTENZIONE:
• Manutenzione programmata comunicata con [GIORNI] giorni di anticipo
• Aggiornamenti inclusi nel canone
• Nuove funzionalità secondo roadmap


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  },
  {
    id: 'essenziale',
    name: 'Essenziale',
    description: 'Condizioni minime indispensabili',
    content: `PAGAMENTO:
• [MODALITÀ DI PAGAMENTO]
• Termini: [GIORNI] giorni

VALIDITÀ OFFERTA:
• [GIORNI] giorni dalla data di emissione

CONSEGNA:
• Entro [TEMPO] dalla conferma

GARANZIA:
• [MESI] mesi su difetti

NOTE:
• [EVENTUALI NOTE AGGIUNTIVE]


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`
  }
];

export function getContractTemplate(id: string): ContractTemplate | undefined {
  return contractTemplates.find(t => t.id === id);
}

export const defaultContractTemplate = contractTemplates[0]; // Standard come default

