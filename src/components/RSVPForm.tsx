/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MailCheck, Users, MessageSquare, Plus, Trash2, HelpCircle } from 'lucide-react';
import { RSVPGuest, Companion } from '../types';

interface RSVPFormProps {
  onRSVPSubmit: (guest: RSVPGuest) => void;
  savedGuest?: RSVPGuest;
}

export default function RSVPForm({ onRSVPSubmit, savedGuest }: RSVPFormProps) {
  const [firstName, setFirstName] = useState(savedGuest?.firstName || (savedGuest?.name ? savedGuest.name.split(' ')[0] : ''));
  const [lastName, setLastName] = useState(savedGuest?.lastName || (savedGuest?.name ? savedGuest.name.split(' ').slice(1).join(' ') : ''));
  const [attending, setAttending] = useState<'yes' | 'no' | 'maybe'>(savedGuest?.attending || 'yes');
  
  // Companions local state
  const [companions, setCompanions] = useState<Companion[]>(savedGuest?.companions || []);
  
  // Principal guest food settings
  const [dietaryRequirements, setDietaryRequirements] = useState(savedGuest?.dietaryRequirements || '');
  const [weddingMessage, setWeddingMessage] = useState(savedGuest?.weddingMessage || '');
  
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddCompanion = () => {
    const newCompanion: Companion = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      dietaryRequirements: ''
    };
    setCompanions([...companions, newCompanion]);
  };

  const handleRemoveCompanion = (id: string) => {
    setCompanions(companions.filter(c => c.id !== id));
  };

  const handleCompanionChange = (id: string, field: keyof Companion, value: string) => {
    setCompanions(companions.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || isSending) return;

    setIsSending(true);
    setFeedback(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Filters out companions with empty names
    const filteredCompanions = attending === 'no' 
      ? [] 
      : companions.filter(c => c.name.trim() !== '');

    const rsvp: RSVPGuest = {
      id: savedGuest?.id || Math.random().toString(36).substr(2, 9),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      attending,
      dietaryRequirements: attending !== 'no' ? dietaryRequirements.trim() : '',
      companions: filteredCompanions,
      weddingMessage: weddingMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Try to save to the server database
      let res: Response;
      try {
        res = await fetch('/api/rsvp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rsvp)
        });
      } catch (networkErr: any) {
        // This is a authentic network failure (offline, DNS/network down)
        console.warn('Real network failure detected during RSVP submit:', networkErr);
        onRSVPSubmit(rsvp);
        setSubmitted(true);
        setFeedback('La risposta è stata registrata e salvata nella memoria del browser, ma si è verificato un errore di rete temporaneo durante l\'invio al server.');
        return;
      }

      if (!res.ok) {
        // Parse validation/error information returned by the server
        let errorMsg = '';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errData.details || '';
        } catch {
          // ignore parsing error
        }

        if (!errorMsg) {
          errorMsg = `Impossibile completare la richiesta. Server ha risposto con codice di stato HTTP ${res.status}.`;
        }
        
        // This is a server-side rejection (e.g. name is not on the Excel guest list). Keep form open!
        setFeedback(errorMsg);
        return;
      }

      // Success
      setFeedback('Grazie! La tua risposta è stata salvata con successo. Abbiamo aggiornato la lista invitati per gli sposi.');
      onRSVPSubmit(rsvp);
      setSubmitted(true);

      // Reset success status after some time
      setTimeout(() => {
        setSubmitted(false);
        setFeedback(null);
      }, 9000);

    } catch (err: any) {
      console.error('Unexpected RSVP submission error:', err);
      setFeedback('Si è verificato un errore imprevisto durante l\'invio dell\'invito. Per favore riprova o contatta gli sposi.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="rsvp-module" className="bg-[#13442D] rounded-none p-6 sm:p-10 border border-[#CEB381] max-w-xl mx-auto my-8">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl font-normal text-[#FFFFFF] tracking-widest uppercase">
          Conferma la Tua Presenza
        </h2>
        <div className="w-12 h-[1px] bg-[#FF4B55]/40 mx-auto my-4" />
        <p className="font-serif italic text-sm text-[#FFFFFF]/80 max-w-sm mx-auto leading-relaxed">
          Ti preghiamo di compilare le informazioni per aiutarci ad organizzare al meglio la presenza ed eventuali intolleranze.
        </p>
      </div>

      {submitted ? (
        <div id="rsvp-success" className="text-center py-12 px-6 bg-[#0D2C1E] rounded-none border border-[#CEB381] space-y-4">
          <div className="w-14 h-14 border border-[#FF4B55] rounded-full flex items-center justify-center mx-auto mb-4 text-[#FF4B55]">
            <MailCheck className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="font-serif text-2xl font-normal text-[#FFFFFF] tracking-wide">
            {attending === 'yes' && 'Presenza Confermata con Successo! ✦'}
            {attending === 'maybe' && 'Risposta "In Forse" Salvata! ✦'}
            {attending === 'no' && 'Grazie per la risposta.'}
          </h3>
          <p className="font-sans text-sm text-[#FFFFFF]/80 mt-3 leading-relaxed max-w-sm mx-auto">
            I dettagli della tua risposta sono stati aggiornati istantaneamente nel nostro pannello organizzativo.
          </p>
          {feedback && (
            <div className="p-3 bg-amber-50/50 border border-amber-100 text-[12px] font-sans italic text-amber-800 leading-relaxed max-w-md mx-auto">
              {feedback}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Guest Name & Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-sans font-bold tracking-[0.2em] text-[#CEB381] uppercase mb-2">
                Nome *
              </label>
              <input
                type="text"
                required
                placeholder="es. Maria Concetta"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-3 bg-[#0D2C1E] border border-[#CEB381] text-sm focus:outline-hidden focus:border-white/30 rounded-none transition-all text-[#FFFFFF] placeholder:opacity-50"
              />
              <span className="text-[10px] text-[#CEB381]/70 font-sans mt-1">Puoi inserire anche nomi composti (es. Maria Concetta)</span>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-sans font-bold tracking-[0.2em] text-[#CEB381] uppercase mb-2">
                Cognome *
              </label>
              <input
                type="text"
                required
                placeholder="es. De Angelis"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-3 bg-[#0D2C1E] border border-[#CEB381] text-sm focus:outline-hidden focus:border-white/30 rounded-none transition-all text-[#FFFFFF] placeholder:opacity-50"
              />
            </div>
          </div>

          {/* Attendance Selection */}
          <div className="flex flex-col">
            <label className="text-xs font-sans font-bold tracking-[0.2em] text-[#CEB381] uppercase mb-2">
              Stato Presenza *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAttending('yes')}
                className={`py-3 px-2 text-xs font-sans font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1 cursor-pointer rounded-none border ${
                  attending === 'yes'
                    ? 'bg-[#FFFFFF] text-[#0D2C1E] border-white/30'
                    : 'bg-[#0D2C1E] text-[#FFFFFF] border-[#CEB381] hover:bg-[#0D2C1E]/50'
                }`}
              >
                <span>Sì, Partecipo</span>
              </button>
              
              <button
                type="button"
                onClick={() => setAttending('maybe')}
                className={`py-3 px-2 text-xs font-sans font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1 cursor-pointer rounded-none border ${
                  attending === 'maybe'
                    ? 'bg-[#FF4B55] text-[#FAF6F0] border-[#FF4B55]'
                    : 'bg-[#0D2C1E] text-[#FFFFFF] border-[#CEB381] hover:bg-[#0D2C1E]/50'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>In forse</span>
              </button>

              <button
                type="button"
                onClick={() => setAttending('no')}
                className={`py-3 px-2 text-xs font-sans font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1 cursor-pointer rounded-none border ${
                  attending === 'no'
                    ? 'bg-[#CEB381] text-[#FFFFFF] border-[#C8BCAB]'
                    : 'bg-[#0D2C1E] text-[#FFFFFF] border-[#CEB381] hover:bg-[#0D2C1E]/50'
                }`}
              >
                <span>Non posso</span>
              </button>
            </div>
          </div>

          {/* If Attending, render Guest counts and details */}
          {attending !== 'no' && (
            <div className="p-4 sm:p-6 bg-[#0D2C1E] rounded-none border border-[#CEB381] space-y-6">
              
              <div className="border-b border-[#CEB381] pb-3">
                <span className="text-xs font-sans font-bold tracking-[0.2em] text-[#FFFFFF] block uppercase">
                  🍳 Note e Segnalazioni dell'Ospite Principale
                </span>
              </div>

              {/* Dietary requirements & Intolerances */}
              <div className="flex flex-col">
                <label className="text-[11px] font-sans font-bold tracking-[0.2em] text-[#CEB381] uppercase mb-1.5">
                  Allergie o Intolleranze alimentari rilevanti
                </label>
                <input
                  type="text"
                  placeholder="Es. No frumento, allergico alle noci..."
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  className="px-3 py-2 bg-[#13442D] border border-[#CEB381] text-sm focus:outline-hidden focus:border-white/30 rounded-none text-[#FFFFFF] placeholder:opacity-50"
                />
              </div>

              {/* DYNAMIC ACCOMPANISTS / COMPANIONS SECTION */}
              <div className="border-t border-[#CEB381] pt-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-sans font-bold tracking-[0.2em] text-[#FFFFFF] uppercase flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#FF4B55]" /> Accompagnatori / Familiari
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCompanion}
                    className="p-1.5 px-3 bg-[#CEB381] hover:bg-[#FF4B55] hover:text-[#FFFFFF] transition-all text-[10px] font-bold uppercase tracking-[0.1em] text-[#13442D] flex items-center gap-1 rounded-none cursor-pointer border border-[#C8BCAB] hover:border-[#FF4B55]"
                  >
                    <Plus className="w-3" /> Aggiungi
                  </button>
                </div>

                {companions.length === 0 ? (
                  <p className="text-xs italic text-[#FFFFFF]/50 py-3 text-center bg-[#13442D]/50 border border-dashed border-[#CEB381]">
                    Nessun accompagnatore aggiunto al momento. Premi il tasto sopra per aggiungerne di nuovi.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {companions.map((comp, idx) => (
                      <div key={comp.id} className="p-4 bg-[#13442D] rounded-none border border-[#CEB381] space-y-3 relative">
                         <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-[#FF4B55] uppercase tracking-wider font-mono">
                            Accompagnatore #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompanion(comp.id)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-none transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Name Input */}
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold uppercase text-[#CEB381] tracking-wider mb-1">
                            Nome & Cognome *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Es. Marco Rossi"
                            value={comp.name}
                            onChange={(e) => handleCompanionChange(comp.id, 'name', e.target.value)}
                            className="px-2.5 py-1.5 bg-[#0D2C1E] border border-[#CEB381] text-sm focus:outline-hidden text-[#FFFFFF]"
                          />
                        </div>

                        {/* Intolerances */}
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold uppercase text-[#CEB381] tracking-wider mb-1">
                            Esigenze alimentari
                          </label>
                          <input
                            type="text"
                            placeholder="Es. Nessuna, celiaco..."
                            value={comp.dietaryRequirements}
                            onChange={(e) => handleCompanionChange(comp.id, 'dietaryRequirements', e.target.value)}
                            className="px-2.5 py-1.5 bg-[#0D2C1E] border border-[#CEB381] text-sm focus:outline-hidden text-[#FFFFFF]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Message Dedication for the couple */}
          <div className="flex flex-col">
            <label className="text-xs font-sans font-bold tracking-[0.2em] text-[#CEB381] uppercase mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Dedica / Messaggio d'auguri per gli sposi
            </label>
            <textarea
              rows={3}
              placeholder="Es. Che possiate camminare sempre felici e colmi d'amore. Vi vogliamo un mondo di bene!"
              value={weddingMessage}
              onChange={(e) => setWeddingMessage(e.target.value)}
              className="px-4 py-3 bg-[#0D2C1E] border border-[#CEB381] text-sm focus:outline-hidden focus:border-white/30 rounded-none text-[#FFFFFF] placeholder:opacity-50 resize-y"
            />
          </div>

          {feedback && !submitted && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-[12px] font-sans text-rose-800 leading-relaxed max-w-md mx-auto">
              <span className="font-bold block uppercase tracking-wider text-[10px] text-rose-700 mb-1">⚠️ Errore di convalida</span>
              {feedback}
            </div>
          )}

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-4 bg-[#FFFFFF] text-[#0D2C1E] border border-white/30 font-sans tracking-[0.22em] text-xs font-bold rounded-none uppercase hover:bg-[#FF4B55] hover:text-[#FFFFFF] hover:border-[#FF4B55] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                Invio in corso...
              </span>
            ) : (
              <span>Invia la Risposta Integrata ➔</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
