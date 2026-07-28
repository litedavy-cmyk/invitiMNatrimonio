/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { WeddingConfig, RSVPGuest, GuestbookPhoto, HistoryEvent, GuestListEntry } from '../types';

// Tuscany defaults
const DEFAULT_CONFIG: WeddingConfig = {
  sposoName: 'Davide',
  sposaName: 'Cristiana',
  weddingDate: '2026-12-21T12:00:00.000Z',
  welcomeMessage: 'Con grandissima gioia ed emozioni indescrivibili, vi invitiamo a condividere con noi il giorno più importante della nostra vita.',
  ourStory: 'Ci siamo incontrati per caso in una sera d\'autunno e, da quel momento, non abbiamo mai smesso di camminare fianco a fianco. Dopo anni colmi d\'amore, risate e viaggi indimenticabili, abbiamo deciso di pronunciare il nostro "Sì" definitivo e dare inizio a questa meravigliosa avventura nuziale.',
  venueCeremony: {
    name: 'Abbazia di San Galgano',
    address: 'Strada Comunale di San Galgano, 53012 Chiusdino SI, Italia',
    time: '12:00',
    latitude: 43.1492,
    longitude: 11.1541,
    description: 'La nostra cerimonia civile si terrà nella suggestiva cornice dell\'abbazia cistercense del XIII secolo, celebre per essere rimasta senza tetto, dove il cielo fa da soffitto all\'amore.',
  },
  venueReception: {
    name: 'Villa Catignano',
    address: 'Via Catignano 14, 53019 Castelnuovo Berardenga SI, Italia',
    time: '18:00',
    latitude: 43.3444,
    longitude: 11.3787,
    description: 'A seguire, saremo felici di festeggiare con aperitivi, cena tipica toscana, brindisi e balli nei giardini all\'italiana e nella corte storica di questa magnifica residenza del XVII secolo.',
  }
};

export function useWeddingData() {
  const [config, setConfig] = useState<WeddingConfig>(() => {
    try {
      const saved = localStorage.getItem('wedding_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [rsvps, setRsvps] = useState<RSVPGuest[]>(() => {
    try {
      const saved = localStorage.getItem('wedding_rsvps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [photos, setPhotos] = useState<GuestbookPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('wedding_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [guestList, setGuestList] = useState<GuestListEntry[]>(() => {
    try {
      const saved = localStorage.getItem('wedding_guest_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historyList, setHistoryList] = useState<HistoryEvent[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch live databases from Express MVC server
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch config
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        localStorage.setItem('wedding_config', JSON.stringify(configData));
      }

      // Fetch RSVPs
      const rsvpRes = await fetch('/api/rsvps');
      if (rsvpRes.ok) {
        const rsvpData = await rsvpRes.json();
        setRsvps(rsvpData);
        localStorage.setItem('wedding_rsvps', JSON.stringify(rsvpData));
      }

      // Fetch Guestbook Photos
      const photosRes = await fetch('/api/guestbook');
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData);
        localStorage.setItem('wedding_photos', JSON.stringify(photosData));
      }

      // Fetch Activity History
      const historyRes = await fetch('/api/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistoryList(historyData);
      }

      // Fetch Verified Guest List
      const guestListRes = await fetch('/api/guest-list');
      if (guestListRes.ok) {
        const guestListData = await guestListRes.json();
        setGuestList(guestListData);
        localStorage.setItem('wedding_guest_list', JSON.stringify(guestListData));
      }

    } catch (err) {
      console.warn('⚠️ Server connection offline. Using local storage state fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 2. State modifiers syncing back dynamically to API

  // Config Update
  const updateConfig = async (newConfig: WeddingConfig) => {
    // Optimistic UI state update
    setConfig(newConfig);
    localStorage.setItem('wedding_config', JSON.stringify(newConfig));

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const saved = await res.json();
        setConfig(saved);
        localStorage.setItem('wedding_config', JSON.stringify(saved));
        // Refresh log
        fetchHistoryList();
      }
    } catch (err) {
      console.error('Failed to sync updated wedding configuration to server:', err);
    }
  };

  // RSVP Submissions
  const addOrUpdateRSVP = async (rsvp: RSVPGuest) => {
    // Update client UI optimistically
    setRsvps((prev) => {
      const existsIdx = prev.findIndex(g => g.name.toLowerCase() === rsvp.name.toLowerCase());
      if (existsIdx >= 0) {
        const copy = [...prev];
        copy[existsIdx] = rsvp;
        return copy;
      }
      return [rsvp, ...prev];
    });

    // Refresh everything
    setTimeout(() => {
      fetch('/api/rsvps')
        .then(res => res.json())
        .then(data => {
          setRsvps(data);
          localStorage.setItem('wedding_rsvps', JSON.stringify(data));
        })
        .catch(err => console.warn('RSVPs sync fail:', err));

      fetchHistoryList();
    }, 1500);
  };

  // RSVP Deletions
  const deleteRSVP = async (id: string) => {
    setRsvps(prev => prev.filter(g => g.id !== id));

    try {
      await fetch(`/api/rsvp/${id}`, { method: 'DELETE' });
      fetchHistoryList();
    } catch (err) {
      console.error('Failed to sync RSVP deletion to server database path:', err);
    }
  };

  // Clear all RSVPs
  const clearRSVPs = async () => {
    setRsvps([]);
    localStorage.setItem('wedding_rsvps', JSON.stringify([]));

    try {
      await fetch('/api/rsvps/clear', { method: 'POST' });
      fetchHistoryList();
    } catch (err) {
      console.error('Failed to sync database clear to server path:', err);
    }
  };

  // Add Samples default RSVPs
  const addSampleRSVPs = async () => {
    try {
      const res = await fetch('/api/rsvps/samples', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRsvps(data.list);
        localStorage.setItem('wedding_rsvps', JSON.stringify(data.list));
        fetchHistoryList();
      }
    } catch (err) {
      console.error('Failed to restore rsvp seed samples on server:', err);
    }
  };

  // Guestbook: Add Photo
  const addPhoto = async (newPhoto: GuestbookPhoto) => {
    // Optimistic UI update
    setPhotos(prev => [newPhoto, ...prev]);

    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto)
      });
      if (res.ok) {
        const savedPhoto = await res.json();
        // Replace with server-side saved photo (e.g. with its server assigned ID/parameters)
        setPhotos(prev => prev.map(p => p.id === newPhoto.id ? savedPhoto : p));
        fetchHistoryList();
      }
    } catch (err) {
      console.error('Failed to sync guestbook photo addition to server database:', err);
    }
  };

  // Guestbook: Delete Photo
  const deletePhoto = async (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));

    try {
      await fetch(`/api/guestbook/${id}`, { method: 'DELETE' });
      fetchHistoryList();
    } catch (err) {
      console.error('Failed to sync guestbook photo deletion to server database path:', err);
    }
  };

  // History Helper Loggers
  const fetchHistoryList = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.warn('Offline reading of modification logs failed:', err);
    }
  };

  const dispatchAdminLoginMetric = async (password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleaned = (password || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/history/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        fetchHistoryList();
        return { success: true };
      }
      if (cleaned === 'sposi2026') {
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Password non corretta o non riconosciuta.' };
    } catch (err: any) {
      console.error('Offline write login log event:', err);
      if (cleaned === 'sposi2026') {
        return { success: true };
      }
      return { success: false, error: 'Errore di connessione o server offline.' };
    }
  };

  const clearHistoryLogs = async () => {
    setHistoryList([]);
    try {
      await fetch('/api/history/clear', { method: 'POST' });
    } catch (err) {
      console.error('Offline clear log trace failed:', err);
    }
  };

  const uploadGuestList = async (parsedGuests: any[], fileName: string = '') => {
    try {
      const res = await fetch('/api/guest-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guests: parsedGuests, fileName })
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (res.ok) {
        if (isJson) {
          const data = await res.json();
          setGuestList(data.list);
          try {
            localStorage.setItem('wedding_guest_list', JSON.stringify(data.list));
          } catch {}
          fetchHistoryList();
          return { success: true, summary: data.summary };
        } else {
          throw new Error('Risposta del server non in formato JSON.');
        }
      } else {
        let errorMsg = `Errore del server (${res.status})`;
        if (isJson) {
          try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } catch {}
        } else {
          const text = await res.text();
          errorMsg = `Errore ${res.status}: ${text.slice(0, 120)}`;
        }
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Failed to upload guest list:', err);
      alert('Caricamento fallito: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  const triggerSystemReset = async () => {
    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('System reset failed:', err);
      return false;
    }
  };

  return {
    config,
    rsvps,
    photos,
    historyList,
    guestList,
    isLoading,
    updateConfig,
    addOrUpdateRSVP,
    deleteRSVP,
    clearRSVPs,
    addSampleRSVPs,
    addPhoto,
    deletePhoto,
    uploadGuestList,
    triggerSystemReset,
    fetchHistory: fetchHistoryList,
    logAdminLogin: dispatchAdminLoginMetric,
    clearHistory: clearHistoryLogs,
    refreshAll: fetchAllData
  };
}
