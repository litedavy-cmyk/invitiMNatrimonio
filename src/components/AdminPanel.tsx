/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, UserCheck, UserX, Cake, Sliders, Calendar, 
  MapPin, Settings, ScrollText, CheckCircle, Trash2, HeartHandshake,
  Download, Search, Filter, AlertTriangle, Clock, Activity, FileText,
  Upload, ShieldCheck, RotateCcw
} from 'lucide-react';
import { RSVPGuest, WeddingConfig, HistoryEvent, GuestListEntry } from '../types';

interface AdminPanelProps {
  rsvps: RSVPGuest[];
  onClearRSVPs: () => void;
  onAddSampleRSVPs: () => void;
  onDeleteRSVP: (id: string) => void;
  config: WeddingConfig;
  onUpdateConfig: (newConfig: WeddingConfig) => void;
  historyList: HistoryEvent[];
  onClearHistory: () => void;
  guestList: GuestListEntry[];
  onUploadGuestList: (guests: any[], fileName?: string) => Promise<any>;
  onTriggerSystemReset: () => Promise<boolean>;
}

export default function AdminPanel({
  rsvps,
  onClearRSVPs,
  onAddSampleRSVPs,
  onDeleteRSVP,
  config,
  onUpdateConfig,
  historyList = [],
  onClearHistory,
  guestList = [],
  onUploadGuestList,
  onTriggerSystemReset,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'guests' | 'settings' | 'history'>('analytics');
  
  // Custom states for search + filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'yes' | 'no' | 'maybe'>('all');

  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [isUploadingXls, setIsUploadingXls] = useState(false);

  // Elegant in-app confirmation modal states (safe from iframe blocks)
  const [activeModal, setActiveModal] = useState<'system_reset' | 'clear_rsvps' | 'delete_rsvp' | 'clear_history' | null>(null);
  const [selectedRsvpToDelete, setSelectedRsvpToDelete] = useState<string | null>(null);
  const [resetInputConfirmation, setResetInputConfirmation] = useState('');
  const [modalStatus, setModalStatus] = useState<{ type: 'idle' | 'executing' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const handleXlsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingXls(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rawJson.length === 0) {
          alert("Errore: Il file caricato è vuoto.");
          setIsUploadingXls(false);
          return;
        }

        // Parse list and map keys to nome, cognome, cell, email (case-insensitive keys)
        const parsed = rawJson.map((row: any) => {
          const keys = Object.keys(row);
          const findKeyVal = (validNames: string[]) => {
            const foundKey = keys.find(k => validNames.includes(k.trim().toUpperCase()));
            return foundKey ? String(row[foundKey] || '').trim() : '';
          };

          return {
            nome: findKeyVal(['NOME', 'NAME', 'NOME INVITATO', 'FIRST_NAME', 'FIRSTNAME']),
            cognome: findKeyVal(['COGNOME', 'SURNAME', 'LAST_NAME', 'LASTNAME', 'COGNOME INVITATO']),
            cell: findKeyVal(['CELL', 'CELLULARE', 'PHONE', 'TELEFONO', 'NUMERO', 'MOBILE']),
            email: findKeyVal(['EMAIL', 'E-MAIL', 'MAIL', 'IND_EMAIL'])
          };
        });

        // "La lista non può essere nulla" - verify that at least some rows map successfully
        const validList = parsed.filter(r => r.nome !== '' || r.cognome !== '');
        if (validList.length === 0) {
          alert("Nessun invitato valido (con Nome o Cognome) trovato. Verifica che le colonne del file si chiamino NOME, COGNOME, CELL, EMAIL.");
          setIsUploadingXls(false);
          return;
        }

        const result = await onUploadGuestList(validList, file.name);
        if (result && result.success) {
          const s = result.summary;
          if (s.isOverwritten) {
            alert(`Sostituzione completa completata!\n\n` +
                  `Rilevato file differente ("${file.name}" rispetto a "${s.previousFilename || 'nessuno'}").\n` +
                  `La lista precedente è stata completamente sovrascritta, caricando solo gli invitati di questo nuovo file.\n\n` +
                  `• Invitati totali importati: ${s.total}\n` +
                  `• Precedenti rimossi: ${s.deleted}`);
          } else {
            alert(`Sincronizzazione completata con successo!\n\n` +
                  `Rilevato lo stesso file ("${file.name}"). Eseguita riconciliazione intelligente (nessun doppione):\n\n` +
                  `• Invitati totali salvati: ${s.total}\n` +
                  `• Nuovi aggiunti rispetto a prima: ${s.added}\n` +
                  `• Rimossi (non più presenti nel file): ${s.deleted}\n` +
                  `• Informazioni contatti aggiornate: ${s.updated}\n` +
                  `• Invariati: ${s.kept}`);
          }
        }
      } catch (err: any) {
        console.error(err);
        alert("Errore durante l'interpretazione del file Excel: " + err.message);
      } finally {
        setIsUploadingXls(false);
        if (e.target) e.target.value = ''; // Reset input element
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteSystemReset = async () => {
    if (resetInputConfirmation.trim().toUpperCase() !== 'RESET') {
      setModalStatus({ type: 'error', message: 'Assicurati di scrivere la parola "RESET" esattamente in maiuscolo.' });
      return;
    }
    setModalStatus({ type: 'executing' });
    try {
      const success = await onTriggerSystemReset();
      if (success) {
        setModalStatus({ type: 'success', message: 'Sistema ripristinato di fabbrica con successo! Tutte le informazioni, i log storici e le risposte sono stati rimossi.' });
        setTimeout(() => {
          setActiveModal(null);
          setResetInputConfirmation('');
          window.location.reload();
        }, 1800);
      } else {
        setModalStatus({ type: 'error', message: 'Errore generico del database durante il rispristino di sistema.' });
      }
    } catch (err: any) {
      setModalStatus({ type: 'error', message: err.message || 'La comunicazione col server è fallita o offline.' });
    }
  };

  const handleExecuteClearRsvps = async () => {
    setModalStatus({ type: 'executing' });
    try {
      await onClearRSVPs();
      setModalStatus({ type: 'success', message: 'Tutte le risposte RSVP sono state cancellate con successo!' });
      setTimeout(() => {
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      setModalStatus({ type: 'error', message: err.message || 'Errore durante la pulizia.' });
    }
  };

  const handleExecuteClearHistory = async () => {
    setModalStatus({ type: 'executing' });
    try {
      await onClearHistory();
      setModalStatus({ type: 'success', message: 'Registro cronologico dei log svuotato correttamente!' });
      setTimeout(() => {
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      setModalStatus({ type: 'error', message: err.message || 'Errore durante l\'azzeramento del registro.' });
    }
  };

  const handleExecuteDeleteRsvp = async () => {
    if (!selectedRsvpToDelete) return;
    setModalStatus({ type: 'executing' });
    try {
      await onDeleteRSVP(selectedRsvpToDelete);
      setModalStatus({ type: 'success', message: 'Risposta cancellata correttamente!' });
      setTimeout(() => {
        setActiveModal(null);
        setSelectedRsvpToDelete(null);
      }, 1200);
    } catch (err: any) {
      setModalStatus({ type: 'error', message: err.message || 'Impossibile completare la cancellazione.' });
    }
  };


  // Local states for updating the live wedding config
  const [sposo, setSposo] = useState(config.sposoName);
  const [sposa, setSposa] = useState(config.sposaName);
  const [wDate, setWDate] = useState(config.weddingDate);
  const [cName, setCName] = useState(config.venueCeremony.name);
  const [cAddress, setCAddress] = useState(config.venueCeremony.address);
  const [cTime, setCTime] = useState(config.venueCeremony.time);
  const [cLat, setCLat] = useState(config.venueCeremony.latitude);
  const [cLng, setCLng] = useState(config.venueCeremony.longitude);
  const [cDesc, setCDesc] = useState(config.venueCeremony.description);

  const [rName, setRName] = useState(config.venueReception.name);
  const [rAddress, setRAddress] = useState(config.venueReception.address);
  const [rTime, setRTime] = useState(config.venueReception.time);
  const [rLat, setRLat] = useState(config.venueReception.latitude);
  const [rLng, setRLng] = useState(config.venueReception.longitude);
  const [rDesc, setRDesc] = useState(config.venueReception.description);

  const [welcomeText, setWelcomeText] = useState(config.welcomeMessage);
  const [storyText, setStoryText] = useState(config.ourStory);

  // Compute precise analytics
  const totalRSVPEntries = rsvps.length;
  const attendingList = rsvps.filter(g => g.attending === 'yes');
  const maybeAttendingList = rsvps.filter(g => g.attending === 'maybe');
  const nonAttendingList = rsvps.filter(g => g.attending === 'no');

  let totalGuestsCount = 0; // Primary guests + companions
  let menusBreakdown: Record<string, number> = {};
  let dietaryAlerts: Array<{ guestName: string; requirement: string }> = [];

  // Loop through RSVPs to parse companions and menus
  rsvps.forEach(g => {
    if (g.attending === 'no') return; // Not coming, skip counting

    // Primary guest count
    totalGuestsCount += 1;
    
    // Primary guest menu
    const pMenu = g.menuPreference || 'Standard';
    menusBreakdown[pMenu] = (menusBreakdown[pMenu] || 0) + 1;

    // Primary guest dietary
    if (g.dietaryRequirements) {
      dietaryAlerts.push({ guestName: g.name, requirement: g.dietaryRequirements });
    }

    // Companions counts and preferences inside
    if (g.companions && g.companions.length > 0) {
      g.companions.forEach(comp => {
        totalGuestsCount += 1;
        const cMenu = comp.menuPreference || 'Standard';
        menusBreakdown[cMenu] = (menusBreakdown[cMenu] || 0) + 1;

        if (comp.dietaryRequirements) {
          dietaryAlerts.push({ guestName: `${comp.name} (acc. di ${g.name})`, requirement: comp.dietaryRequirements });
        }
      });
    }
  });

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WeddingConfig = {
      sposoName: sposo.trim(),
      sposaName: sposa.trim(),
      weddingDate: wDateHtmlToIso(wDate),
      welcomeMessage: welcomeText.trim(),
      ourStory: storyText.trim(),
      venueCeremony: {
        name: cName.trim(),
        address: cAddress.trim(),
        time: cTime,
        latitude: Number(cLat),
        longitude: Number(cLng),
        description: cDesc.trim(),
      },
      venueReception: {
        name: rName.trim(),
        address: rAddress.trim(),
        time: rTime,
        latitude: Number(rLat),
        longitude: Number(rLng),
        description: rDesc.trim(),
      }
    };
    onUpdateConfig(updated);
    alert('Configurazione dell\'invito aggiornata con successo in tempo reale! ✦');
  };

  const isoToHtmlDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const wDateHtmlToIso = (htmlStr: string) => {
    try {
      return new Date(htmlStr).toISOString();
    } catch {
      return htmlStr;
    }
  };

  // Export CSV download function for caterings
  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      alert('Nessun dato presente da esportare.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Clear CSV Headers
    csvContent += 'ID;Invitato Principale;Stato Presenza;Menu Principal;Diete e Intolleranze;Timestamp;Accompagnatori Nomi e Menu\n';

    rsvps.forEach(g => {
      // Format companion names and individual preferences
      const companionDetails = (g.companions || []).map(c => `${c.name} (${c.menuPreference}${c.dietaryRequirements ? ' - ' + c.dietaryRequirements : ''})`).join(' | ');

      const row = [
        g.id,
        g.name.replace(/;/g, ','),
        g.attending.toUpperCase(),
        g.menuPreference || 'Standard',
        (g.dietaryRequirements || '').replace(/;/g, ','),
        g.timestamp,
        companionDetails.replace(/;/g, ',')
      ].join(';');

      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CATERING_WEDDING_GUESTS_${config.sposoName}_${config.sposaName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter list of guests dynamically
  const filteredRSVPs = rsvps.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (guest.companions || []).some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'all') return matchesSearch;
    return guest.attending === filterStatus && matchesSearch;
  });

  return (
    <div id="admin-module" className="bg-[#0D2C1E] rounded-none p-6 sm:p-10 border border-[#CEB381] max-w-5xl mx-auto my-8">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row items-center justify-between border-b border-[#CEB381] pb-6 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#FF4B55] rounded-full flex items-center justify-center text-[#FF4B55]">
            <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-normal text-[#FFFFFF] tracking-wide">Pannello di Controllo Sposi</h2>
            <p className="text-[10px] font-sans uppercase tracking-[0.22em] text-[#FF4B55] font-bold">CONFIGURAZIONE LANDING & REPORT CATERING</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#13442D] p-1 rounded-none border border-[#CEB381] w-full lg:w-auto overflow-x-auto">
          {[
            { id: 'analytics', label: 'Monitoraggio', icon: Users },
            { id: 'guests', label: 'Gestione Invitati', icon: ScrollText },
            { id: 'settings', label: 'Modifica Pagine', icon: Sliders },
            { id: 'history', label: 'Registro Modifiche', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-3.5 rounded-none text-[10.5px] font-bold uppercase tracking-[0.12em] transition-all cursor-pointer flex-1 justify-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#FFFFFF] text-[#0D2C1E] border border-white/30 font-extrabold'
                    : 'text-[#FFFFFF] hover:bg-[#CEB381] hover:text-[#0D2C1E]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Realtime KPI Widget Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            
            <div className="bg-[#13442D] p-4 rounded-none border border-[#CEB381] text-center">
              <span className="text-[10px] font-bold tracking-widest text-[#FF4B55] uppercase">Rispettate</span>
              <p className="font-serif text-3xl font-semibold text-[#FFFFFF] mt-1 select-all">{totalRSVPEntries}</p>
              <span className="text-[10.5px] text-zinc-300 block mt-1 font-mono">Buste risposte</span>
            </div>
            
            <div className="bg-[#13442D] p-4 rounded-none border border-[#CEB381] text-center">
              <span className="text-[10px] font-bold tracking-widest text-[#CEB381] uppercase">Confermati</span>
              <p className="font-serif text-3xl font-semibold text-[#FFFFFF] mt-1 select-all">{attendingList.length}</p>
              <span className="text-[10.5px] text-emerald-300 block mt-1 font-mono">Presenti (Sì)</span>
            </div>

            <div className="bg-[#13442D] p-4 rounded-none border border-[#CEB381] text-center">
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">In forse</span>
              <p className="font-serif text-3xl font-semibold text-[#FFFFFF] mt-1 select-all">{maybeAttendingList.length}</p>
              <span className="text-[10.5px] text-amber-300 block mt-1 font-mono">Da sollecitare</span>
            </div>

            <div className="bg-[#13442D] p-4 rounded-none border border-[#CEB381] text-center">
              <span className="text-[10px] font-bold tracking-widest text-rose-450 text-rose-300 uppercase">Non Partecipano</span>
              <p className="font-serif text-3xl font-semibold text-[#FFFFFF] mt-1 select-all">{nonAttendingList.length}</p>
              <span className="text-[10.5px] text-rose-300 block mt-1 font-mono">Con affetto</span>
            </div>

            <div className="bg-[#CEB381] p-4 rounded-none border border-[#C8BCAB] text-center col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold tracking-widest text-[#0D2C1E] uppercase">Coperti Totali</span>
              <p className="font-serif text-3xl font-bold text-[#0D2C1E] mt-1 select-all">{totalGuestsCount}</p>
              <span className="text-[10.5px] text-[#0D2C1E] font-bold block mt-1 font-mono">Inclusi acc.</span>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Realtime Menu breakdowns for catering */}
            <div className="bg-transparent p-6 rounded-none border border-[#CEB381]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-lg font-normal text-[#FFFFFF] flex items-center gap-1.5">
                  <Cake className="w-5 h-5 text-[#FF4B55]" /> Richiesta Menù Catering
                </h3>
                <button
                  onClick={handleExportCSV}
                  className="bg-[#FFFFFF] text-[#0D2C1E] hover:bg-[#FF4B55] hover:text-[#FFFFFF] text-white p-1 px-2.5 text-[9px] uppercase tracking-wider font-bold rounded-none flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Esporta CSV
                </button>
              </div>

              {totalGuestsCount === 0 ? (
                <p className="text-xs italic text-[#FFFFFF]/50 py-10 text-center">Nessuna preferenza registrata</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(menusBreakdown).map(([menuName, count]) => {
                    const pct = Math.round((count / totalGuestsCount) * 100);
                    return (
                      <div key={menuName} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-[#FFFFFF]">
                          <span className="uppercase tracking-wider font-mono text-[10px]">{menuName}</span>
                          <span className="font-mono text-[10.5px]">{count} su {totalGuestsCount} coperti ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-[#13442D] rounded-none overflow-hidden border border-[#CEB381]">
                          <div 
                            className="h-full bg-[#FF4B55] rounded-none" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Intolerance & Dietary Alerts dashboard */}
            <div className="bg-transparent p-6 rounded-none border border-[#CEB381] space-y-4">
              <h3 className="font-serif text-lg font-normal text-[#FFFFFF] flex items-center gap-1.5 border-b border-[#CEB381] pb-3">
                <AlertTriangle className="w-5 h-5 text-[#FF4B55]" /> Allergie / Segnalazioni Alimentari
              </h3>

              {dietaryAlerts.length === 0 ? (
                <p className="text-xs italic text-[#FFFFFF]/50 py-8 text-center">Nessun'allergia inserita dagli invitati o accompagnatori.</p>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-2">
                  {dietaryAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-amber-50/40 p-3 rounded-none border border-amber-100 text-xs flex gap-2">
                      <span className="text-amber-600 font-bold select-none text-[11px]">⚠️</span>
                      <div>
                        <span className="font-semibold block text-[#FFFFFF]">{alert.guestName}</span>
                        <span className="text-amber-800 text-[11px] font-medium italic block mt-0.5">{alert.requirement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Suite Manutenzione */}
          <div className="bg-[#13442D] p-6 border border-[#CEB381] flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-sans font-bold tracking-widest text-[#FF4B55] block uppercase">SUITE MANUTENZIONE SOFTWARE</span>
              <p className="text-xs text-zinc-200 mt-1 leading-relaxed max-w-xl">
                Usa i pulsanti per ripulire le risposte d'invito o ripristinare interamente il sistema alle condizioni di fabbrica originali.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('clear_rsvps');
                  setModalStatus({ type: 'idle' });
                }}
                className="py-2.5 px-4 bg-transparent border border-white/40 text-white hover:bg-white hover:text-[#0D2C1E] text-xs font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer flex-grow md:flex-none text-center"
              >
                Resetta Dati RSVP
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal('system_reset');
                  setResetInputConfirmation('');
                  setModalStatus({ type: 'idle' });
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer flex-grow md:flex-none text-center flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset Totale Software
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: INVITATI - FILTERABLE SEARCHABLE DATA TABLE */}
      {activeTab === 'guests' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Sezione Caricamento Excel Prominente */}
          <div className="bg-[#FAF7F2] border-2 border-[#FF4B55]/20 p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF4B55]" />
            <div className="space-y-1.5">
              <h4 className="font-serif text-[15px] font-bold text-[#0D2C1E] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF4B55]" /> CONFIGURAZIONE LISTA DI INGRESSO (VERIFICATORE EXCEL)
              </h4>
              <p className="text-xs text-[#0D2C1E]/85 font-sans leading-relaxed max-w-4xl font-medium">
                Carica qui il file in formato Excel o CSV contenente la lista ufficiale degli invitati. Chi compila l'RSVP pubblico verrà cercato in questo elenco e autorizzato solo in caso di corrispondenza esatta di Nome e Cognome.
                Assicurati che le colonne del foglio di calcolo siano intestate con: <strong className="text-[#FF4B55] font-extrabold">NOME, COGNOME, CELL, EMAIL</strong>. La lista non può essere nulla.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs font-sans text-[#FF4B55] font-bold">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>STATO DI CONTROLLO: {guestList.length} invitati abilitati attualmente impostati e persistiti in memoria.</span>
              </div>
            </div>

            <div className="shrink-0 w-full lg:w-auto">
              <label className="relative cursor-pointer bg-[#0D2C1E] text-[#FFFFFF] hover:bg-[#FF4B55] py-3.5 px-6 text-xs font-bold uppercase tracking-widest rounded-none transition-all text-center block w-full lg:inline-block border border-[#0D2C1E]">
                {isUploadingXls ? 'Elaborazione file...' : 'Carica File .xlsx / .xls'}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleXlsUpload}
                  disabled={isUploadingXls}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Tabella 1: Le Risposte Ricevute (RSVP) */}
          <div className="bg-[#13442D] border border-[#CEB381] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#CEB381] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#FFFFFF] flex items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-[#FF4B55]" /> Le Risposte Ricevute (RSVP - {filteredRSVPs.length})
                </h3>
                <p className="text-xs text-zinc-300 font-sans">Le risposte compilate online dagli invitati per confermare presenza, preferenze e messaggi.</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="py-2.5 px-4 bg-[#FFFFFF] border border-white/30 text-[#0D2C1E] hover:bg-[#FF4B55] hover:text-[#FFFFFF] text-xs font-bold uppercase tracking-widest rounded-none flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Esporta CSV</span>
              </button>
            </div>

            {/* Ricerca e Filtri per RSVPs */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF4B55]" />
                <input
                  type="text"
                  placeholder="Cerca per invitato o accompagnatore..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D2C1E]/60 border border-[#CEB381] text-sm font-sans rounded-none focus:outline-hidden text-[#FFFFFF] placeholder:text-zinc-400"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#0D2C1E]/60 px-3.5 border border-[#CEB381]">
                <Filter className="w-3.5 h-3.5 text-[#FF4B55]" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-transparent text-xs uppercase font-bold tracking-wider text-[#FFFFFF] focus:outline-hidden border-none cursor-pointer py-2.5 font-sans"
                >
                  <option value="all" className="bg-[#0D2C1E] text-white">TUTTI GLI STATI</option>
                  <option value="yes" className="bg-[#0D2C1E] text-white">CONFERMATI (SÌ)</option>
                  <option value="maybe" className="bg-[#0D2C1E] text-white">IN FORSE</option>
                  <option value="no" className="bg-[#0D2C1E] text-white">NON PARTECIPANO</option>
                </select>
              </div>
            </div>

            {filteredRSVPs.length === 0 ? (
              <div className="text-center py-10 bg-[#13442D]/50 border border-dashed border-[#CEB381]">
                <p className="text-sm italic text-[#FFFFFF]/50">Nessuna risposta compilata corrisponde alla ricerca corrente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#CEB381]">
                <table className="min-w-full divide-y divide-[#CEB381] text-left text-xs bg-[#13442D] text-[#FFFFFF]">
                  <thead className="bg-[#0D2C1E] text-[11px] uppercase font-bold tracking-wider text-[#CEB381]">
                    <tr>
                      <th className="px-4 py-3">Invitato Principale</th>
                      <th className="px-4 py-3">Presenza</th>
                      <th className="px-4 py-3">Menu</th>
                      <th className="px-4 py-3">Accompagnatori</th>
                      <th className="px-4 py-3">Intolleranze</th>
                      <th className="px-4 py-3">Messaggio per Nozze</th>
                      <th className="px-4 py-3 text-right">Rimuovi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CEB381] font-sans">
                    {filteredRSVPs.map((guest) => (
                      <tr key={guest.id} className="hover:bg-amber-50/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-sm text-[#FFFFFF]">{guest.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {guest.attending === 'yes' && (
                            <span className="inline-flex text-[9px] font-bold bg-emerald-600 text-white py-0.5 px-2.5 uppercase tracking-wide border border-emerald-500">Presente (Sì)</span>
                          )}
                          {guest.attending === 'maybe' && (
                            <span className="inline-flex text-[9px] font-bold bg-amber-600 text-white py-0.5 px-2.5 uppercase tracking-wide border border-amber-500 font-sans">In Forse</span>
                          )}
                          {guest.attending === 'no' && (
                            <span className="inline-flex text-[9px] font-bold bg-rose-600 text-white py-0.5 px-2.5 uppercase tracking-wide border border-rose-500">Assente (No)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{guest.attending !== 'no' ? guest.menuPreference : '-'}</td>
                        <td className="px-4 py-3">
                          {guest.attending !== 'no' && guest.companions && guest.companions.length > 0 ? (
                            <div className="space-y-2 max-w-xs">
                              {guest.companions.map((comp) => (
                                <div key={comp.id} className="text-xs leading-relaxed border-l-2 border-[#FF4B55] pl-2 bg-black/10 p-1.5">
                                  <span className="font-bold text-white block">{comp.name}</span>
                                  <span className="text-zinc-300 font-mono text-[10px] uppercase tracking-wide block mt-0.5">
                                    Menu: <span className="text-[#CEB381] font-semibold">{comp.menuPreference}</span>
                                  </span>
                                  {comp.dietaryRequirements && (
                                    <span className="text-amber-300 font-mono text-[9px] tracking-wider block font-bold uppercase mt-0.5">
                                      ⚠️ Diet: {comp.dietaryRequirements}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs font-sans text-xs">
                          {guest.dietaryRequirements ? (
                            <span className="inline-block px-2.5 py-1 bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 text-xs">
                              {guest.dietaryRequirements}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic text-xs">Nessuna</span>
                          )}
                        </td>
                        <td className="px-4 py-3 italic text-xs text-[#FFFFFF]/90 max-w-xs truncate" title={guest.weddingMessage}>{guest.weddingMessage || <span className="text-[#FFFFFF]/30 italic text-xs">Vuoto</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRsvpToDelete(guest.id);
                              setActiveModal('delete_rsvp');
                              setModalStatus({ type: 'idle' });
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-500 transition-colors rounded-none cursor-pointer"
                            title="Cancella RSVP"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabella 2: Invitati Certificati Caricati da Excel */}
          <div className="bg-[#13442D] border border-[#CEB381] p-6 space-y-4">
            <div className="border-b border-[#CEB381] pb-3">
              <h3 className="font-serif text-base font-bold text-[#FFFFFF] flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-[#FF4B55]" /> Database Invitati Autorizzati da Excel ({guestList.length})
              </h3>
              <p className="text-xs text-zinc-300 font-sans mt-0.5">Elenco completo dei nominativi pre-caricati abilitati a registrare la presenza sul portale.</p>
            </div>

            {/* Ricerca per Lista Excel */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF4B55]" />
              <input
                type="text"
                placeholder="Filtra la lista autorizzata Excel..."
                value={guestSearchTerm}
                onChange={(e) => setGuestSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0D2C1E]/60 border border-[#CEB381] text-sm font-sans rounded-none focus:outline-hidden text-[#FFFFFF] placeholder:text-zinc-400"
              />
            </div>

            {guestList.filter(g => `${g.nome} ${g.cognome} ${g.email} ${g.cell}`.toLowerCase().includes(guestSearchTerm.toLowerCase())).length === 0 ? (
              <div className="text-center py-10 bg-[#13442D]/50 border border-dashed border-[#CEB381]">
                <p className="text-sm italic text-[#FFFFFF]/50">Nessun invitato autorizzato corrisponde ai filtri di ricerca.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#CEB381]">
                <table className="min-w-full divide-y divide-[#CEB381] text-left text-xs bg-[#13442D] text-[#FFFFFF]">
                  <thead className="bg-[#0D2C1E] text-[11px] uppercase font-bold tracking-wider text-[#CEB381]">
                    <tr>
                      <th className="px-4 py-3">ID Ospite</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Cognome</th>
                      <th className="px-4 py-3">Cellulare</th>
                      <th className="px-4 py-3">E-Mail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CEB381] font-sans text-xs">
                    {guestList.filter(g => `${g.nome} ${g.cognome} ${g.email} ${g.cell}`.toLowerCase().includes(guestSearchTerm.toLowerCase())).map((g) => (
                      <tr key={g.id} className="hover:bg-amber-50/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-[10.5px] text-[#CEB381] font-bold">{g.id}</td>
                        <td className="px-4 py-3 font-bold text-[#FFFFFF] text-sm">{g.nome}</td>
                        <td className="px-4 py-3 font-bold text-[#FFFFFF] text-sm">{g.cognome}</td>
                        <td className="px-4 py-3 font-mono text-xs text-white">{g.cell || <span className="text-zinc-400 italic">Non caricato</span>}</td>
                        <td className="px-4 py-3 text-white font-mono text-xs">{g.email || <span className="text-zinc-400 italic">Non caricata</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: CONFIGURATION SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleConfigSave} className="space-y-6">
          <h3 className="font-serif text-lg font-bold text-[#FFFFFF] pb-3 border-b border-[#CEB381] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#FF4B55] animate-spin" style={{ animationDuration: '10s' }} /> Modifica Informazioni Nozze Live
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col animate-fadeIn">
              <label className="text-xs font-bold tracking-wider text-[#CEB381] uppercase mb-1.5">Nome Sposo</label>
              <input
                type="text"
                required
                value={sposo}
                onChange={(e) => setSposo(e.target.value)}
                className="px-3 py-2.5 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] focus:border-white/40 focus:bg-[#13442D] outline-hidden font-medium"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs font-bold tracking-wider text-[#CEB381] uppercase mb-1.5">Nome Sposa</label>
              <input
                type="text"
                required
                value={sposa}
                onChange={(e) => setSposa(e.target.value)}
                className="px-3 py-2.5 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] focus:border-white/40 focus:bg-[#13442D] outline-hidden font-medium"
              />
            </div>

            <div className="flex flex-col sm:col-span-2">
              <label className="text-xs font-bold tracking-wider text-[#CEB381] uppercase mb-1.5">DATA E ORA CELEBRAZIONE</label>
              <input
                type="datetime-local"
                required
                value={isoToHtmlDate(wDate)}
                onChange={(e) => setWDate(e.target.value)}
                className="px-3 py-3 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] focus:border-white/40 focus:bg-[#13442D] outline-hidden font-mono"
              />
              <span className="text-xs text-zinc-300 font-medium mt-1.5 block">
                La modifica di questa data ricalcola istantaneamente il countdown e lo Scratch per l'invitato!
              </span>
            </div>
          </div>

          {/* Logistics & Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Cerimonia */}
            <div className="p-5 bg-[#13442D] rounded-none border border-[#CEB381] space-y-3.5">
              <span className="text-xs font-sans font-bold tracking-widest text-[#FFFFFF] block border-b border-[#CEB381] pb-2 uppercase text-center font-bold">
                ⛪ SESTIER CERIMONIA
              </span>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Luogo</label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-medium"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Lat GPS</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={cLat}
                    onChange={(e) => setCLat(e.target.value)}
                    className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Long GPS</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={cLng}
                    onChange={(e) => setCLng(e.target.value)}
                    className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Orario inizio</label>
                <input
                  type="text"
                  value={cTime}
                  onChange={(e) => setCTime(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF]"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Nota</label>
                <textarea
                  value={cDesc}
                  rows={2}
                  onChange={(e) => setCDesc(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] resize-none font-medium"
                />
              </div>
            </div>

            {/* Ricevimento */}
            <div className="p-5 bg-[#13442D] rounded-none border border-[#CEB381] space-y-3.5">
              <span className="text-xs font-sans font-bold tracking-widest text-[#FFFFFF] block border-b border-[#CEB381] pb-2 uppercase text-center font-bold">
                慶 CELEBRAZIONE / RICEVIMENTO
              </span>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Luogo</label>
                <input
                  type="text"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-medium"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={rAddress}
                  onChange={(e) => setRAddress(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Lat GPS</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={rLat}
                    onChange={(e) => setRLat(e.target.value)}
                    className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Long GPS</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={rLng}
                    onChange={(e) => setRLng(e.target.value)}
                    className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Orario inizio</label>
                <input
                  type="text"
                  value={rTime}
                  onChange={(e) => setRTime(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF]"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#CEB381] uppercase mb-1">Nota</label>
                <textarea
                  value={rDesc}
                  rows={2}
                  onChange={(e) => setRDesc(e.target.value)}
                  className="px-2.5 py-2 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] resize-none font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="flex flex-col">
              <label className="text-xs font-bold tracking-wider text-[#CEB381] uppercase mb-1">Messaggio di Benvenuto</label>
              <textarea
                value={welcomeText}
                rows={2}
                onChange={(e) => setWelcomeText(e.target.value)}
                className="px-3 py-2.5 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-medium"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs font-bold tracking-wider text-[#CEB381] uppercase mb-1">La Nostra Storia</label>
              <textarea
                value={storyText}
                rows={3}
                onChange={(e) => setStoryText(e.target.value)}
                className="px-3 py-2.5 border border-[#CEB381] bg-[#0D2C1E] rounded-none text-sm text-[#FFFFFF] font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#FFFFFF] text-[#0D2C1E] border border-white/30 font-bold uppercase tracking-[0.22em] text-[10px] rounded-none hover:bg-[#FF4B55] hover:border-[#FF4B55] transition-colors cursor-pointer"
          >
            Salva Configurazione Live ➔
          </button>
        </form>
      )}

      {/* TAB 4: MODIFICATION HISTORY TIMELINE LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#CEB381] pb-4 gap-3">
            <div>
              <h3 className="font-serif text-lg font-normal text-[#FFFFFF] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF4B55]" /> Registro Attività del Sito
              </h3>
              <p className="text-[10px] text-gray-400 font-sans uppercase tracking-wider block mt-0.5">
                TRACCIAMENTO DELLE MODIFICHE IN TEMPO REALE (JSON & LOG CORRENTI)
              </p>
            </div>
            
            <div className="flex gap-2">
              <a
                href="/api/history/log"
                download="modifications_history.log"
                className="py-2.5 px-3.5 bg-[#13442D] border border-white/30 text-[#FFFFFF] hover:bg-[#13442D] text-[9px] font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer flex items-center gap-1.5 text-center justify-center"
              >
                <FileText className="w-3.5 h-3.5" />
                Scarica File .LOG
              </a>
              <button
                type="button"
                onClick={() => {
                  setActiveModal('clear_history');
                  setModalStatus({ type: 'idle' });
                }}
                className="py-2.5 px-3.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[9px] font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer flex items-center gap-1.5 text-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Svuota Registro
              </button>
            </div>
          </div>

          {historyList.length === 0 ? (
            <div className="text-center py-14 bg-[#13442D] rounded-none border border-dashed border-[#CEB381]">
              <p className="text-xs italic text-[#FFFFFF]/50">Nessuna modifica o attività registrata finora.</p>
              <p className="text-[10px] text-[#FFFFFF]/40 mt-1">Le azioni degli utenti (es. inserimento RSVP, caricamento foto o salvataggio impostazioni) appariranno qui.</p>
            </div>
          ) : (
            <div className="relative border-l border-[#FF4B55]/20 ml-4 pl-6 space-y-6 pt-2">
              {historyList.map((event) => {
                // Determine icon and colors based on event type
                let IconComp = Activity;
                let colorClass = 'bg-[#13442D] text-[#FF4B55] border-[#CEB381]';
                let typeLabel = 'Attività';

                switch (event.type) {
                  case 'RSVP_CREATED':
                    IconComp = CheckCircle;
                    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    typeLabel = 'Conferma Ricevuta';
                    break;
                  case 'RSVP_UPDATED':
                    IconComp = Sliders;
                    colorClass = 'bg-amber-50 text-amber-850 border-amber-200';
                    typeLabel = 'RSVP Modificato';
                    break;
                  case 'RSVP_DELETED':
                    IconComp = UserX;
                    colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
                    typeLabel = 'Ospite Eliminato';
                    break;
                  case 'RSVP_CLEARED':
                    IconComp = Trash2;
                    colorClass = 'bg-rose-900/10 text-rose-800 border-rose-900/10';
                    typeLabel = 'Lista Svuotata';
                    break;
                  case 'CONFIG_UPDATED':
                    IconComp = Settings;
                    colorClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                    typeLabel = 'Configurazione Nozze';
                    break;
                  case 'PHOTO_ADDED':
                    IconComp = FileText;
                    colorClass = 'bg-teal-50 text-teal-800 border-teal-200';
                    typeLabel = 'Nuovo Ricordo Foto';
                    break;
                  case 'PHOTO_DELETED':
                    IconComp = Trash2;
                    colorClass = 'bg-rose-55 text-rose-700 border-rose-100';
                    typeLabel = 'Foto Rimossa';
                    break;
                  case 'ADMIN_ACCESS':
                    IconComp = Clock;
                    colorClass = 'bg-slate-50 text-slate-800 border-slate-200';
                    typeLabel = 'Accesso Sposi';
                    break;
                }

                return (
                  <div key={event.id} className="relative group animate-fadeIn">
                    {/* Circle Node on Timeline line */}
                    <div className="absolute -left-[35px] top-1.5 w-[18px] h-[18px] bg-[#0D2C1E] rounded-full border-2 border-[#FF4B55] flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 bg-[#FF4B55] rounded-full mx-auto" style={{ marginTop: '0px' }} />
                    </div>

                    <div className="bg-[#13442D] border border-[#CEB381] p-4 rounded-none space-y-2 hover:shadow-xs transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-wider py-0.5 px-2 border ${colorClass}`}>
                            <IconComp className="w-3 h-3" />
                            {typeLabel}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500 font-mono">
                            ID #{event.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(event.timestamp).toLocaleString('it-IT')}
                        </span>
                      </div>

                      <p className="text-xs text-[#FFFFFF] font-medium leading-relaxed">
                        {event.description}
                      </p>

                      {event.details && (
                        <div className="bg-[#0D2C1E]/50 border border-[#CEB381]/40 border-dashed p-3 font-mono text-[11px] text-zinc-100 overflow-x-auto rounded-none max-w-full leading-relaxed">
                          <div className="font-bold uppercase tracking-wider mb-1 text-[10px] text-[#CEB381]">Dati Tecnici Ricevuti:</div>
                          {JSON.stringify(event.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL OVERLAY PER CONFERME DI SISTEMA      */}
      {/* ========================================== */}
      {activeModal && (
        <div className="fixed inset-0 bg-[#0D2C1E]/85 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#13442D] max-w-md w-full border-t-4 border-[#FF4B55] p-6 shadow-2xl relative space-y-5 animate-scaleIn">
            
            {/* Modal close icon */}
            {modalStatus.type !== 'executing' && (
              <button
                onClick={() => setActiveModal(null)}
                type="button"
                className="absolute top-4 right-4 text-zinc-300 hover:text-white transition-colors cursor-pointer text-lg font-sans"
              >
                ✕
              </button>
            )}

            {/* Modal Title depending on activeModal */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF4B55] block font-sans">
                {activeModal === 'system_reset' && '⚠️ INIZIALIZZAZIONE OPERATIVA'}
                {activeModal === 'clear_rsvps' && '🧹 AZZERAMENTO RISPOSTE'}
                {activeModal === 'clear_history' && '📜 CANCELLAZIONE AUDIT LOG'}
                {activeModal === 'delete_rsvp' && '❌ ELIMINA PARTECIPANTE'}
              </span>
              
              <h3 className="font-serif text-xl font-bold text-[#FFFFFF] tracking-tight">
                {activeModal === 'system_reset' && 'Reset di Fabbrica Completo'}
                {activeModal === 'clear_rsvps' && 'Rimuovere tutte le risposte?'}
                {activeModal === 'clear_history' && 'Ripulire il registro modifiche?'}
                {activeModal === 'delete_rsvp' && 'Conferma eliminazione ospite'}
              </h3>
            </div>

            {/* Modal Descriptive Body */}
            <div className="text-xs text-[#FFFFFF]/90 font-sans leading-relaxed space-y-2">
              {activeModal === 'system_reset' && (
                <div className="space-y-3">
                  <p className="text-zinc-200">
                    Stai per effettuare il <strong className="text-white">ripristino totale del software</strong>. Questa operazione eliminerà definitivamente:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-rose-300 font-semibold font-sans text-xs">
                    <li>Tutte le risposte RSVP compilate online dagli invitati</li>
                    <li>La lista di controllo degli invitati caricata da Excel</li>
                    <li>L'intera cronologia delle attività e dei log delle variazioni</li>
                    <li>Tutte le informazioni sul matrimonio (nomi degli sposi, location, indirizzi) ripristinandole ai valori iniziali.</li>
                  </ul>
                  <p className="text-rose-400 font-bold mt-2">
                    Per confermare l'operazione digita esattamente la parola "RESET" in maiuscolo:
                  </p>
                  <input
                    type="text"
                    placeholder="RESET"
                    value={resetInputConfirmation}
                    onChange={(e) => setResetInputConfirmation(e.target.value)}
                    className="w-full p-3 bg-[#0D2C1E] border border-[#CEB381] font-mono text-center text-sm focus:outline-hidden focus:border-[#FF4B55] tracking-widest text-[#FF4B55] font-extrabold placeholder-zinc-300 rounded-none mt-1"
                    disabled={modalStatus.type === 'executing' || modalStatus.type === 'success'}
                  />
                </div>
              )}

              {activeModal === 'clear_rsvps' && (
                <p className="text-zinc-200">
                  Sei sicuro di voler cancellare irrevocabilmente tutte le risposte d'invito della lista RSVP? L'elenco degli invitati certificati caricato tramite Excel non subirà modifiche.
                </p>
              )}

              {activeModal === 'clear_history' && (
                <p className="text-zinc-200">
                  Sei sicuro di voler ripulire definitivamente tutta la cronologia e i log? Questo libererà spazio visivo ma non cancellerà né le risposte RSVP né l'elenco invitati da Excel.
                </p>
              )}

              {activeModal === 'delete_rsvp' && (
                <p className="text-zinc-200">
                  Sei sicuro di voler cancellare definitivamente la risposta selezionata? I dati dell'invitato e dei suoi accompagnatori non potranno essere recuperati.
                </p>
              )}
            </div>

            {/* Success or error message box */}
            {modalStatus.message && (
              <div className={`p-3 text-xs font-sans font-semibold uppercase tracking-wide flex items-start gap-2 ${
                modalStatus.type === 'success' 
                  ? 'bg-emerald-600 text-white border-l-4 border-emerald-400' 
                  : 'bg-rose-600 text-white border-l-4 border-rose-400'
              }`}>
                <span className="shrink-0">{modalStatus.type === 'success' ? '✦' : '⚠️'}</span>
                <span>{modalStatus.message}</span>
              </div>
            )}

            {/* Custom Modal Actions buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-[#CEB381]/30 pt-4">
              {modalStatus.type !== 'executing' && modalStatus.type !== 'success' && (
                <>
                  <button
                    onClick={() => setActiveModal(null)}
                    type="button"
                    className="py-2.5 px-4 bg-transparent hover:bg-white hover:text-[#0D2C1E] text-white font-bold uppercase tracking-widest text-xs font-sans transition-all cursor-pointer rounded-none border border-white/20"
                  >
                    Annulla
                  </button>

                  {activeModal === 'system_reset' && (
                    <button
                      onClick={handleExecuteSystemReset}
                      type="button"
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-xs font-sans transition-all cursor-pointer rounded-none border border-rose-700"
                    >
                      Esegui Reset Globale
                    </button>
                  )}

                  {activeModal === 'clear_rsvps' && (
                    <button
                      onClick={handleExecuteClearRsvps}
                      type="button"
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-xs font-sans transition-all cursor-pointer rounded-none border border-rose-700"
                    >
                      Conferma Cancella
                    </button>
                  )}

                  {activeModal === 'clear_history' && (
                    <button
                      onClick={handleExecuteClearHistory}
                      type="button"
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-xs font-sans transition-all cursor-pointer rounded-none border border-rose-700"
                    >
                      Conferma Svuota
                    </button>
                  )}

                  {activeModal === 'delete_rsvp' && (
                    <button
                      onClick={handleExecuteDeleteRsvp}
                      type="button"
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-xs font-sans transition-all cursor-pointer rounded-none border border-rose-700"
                    >
                      Conferma Elimina
                    </button>
                  )}
                </>
              )}

              {modalStatus.type === 'executing' && (
                <div className="flex items-center gap-2 text-xs text-zinc-300 uppercase tracking-widest font-bold font-sans">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#FF4B55] border-t-transparent rounded-full animate-spin" />
                  <span>Esecuzione in corso...</span>
                </div>
              )}

              {modalStatus.type === 'success' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 uppercase tracking-widest font-bold font-sans">
                  <span>✓</span>
                  <span>Operazione completata</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
