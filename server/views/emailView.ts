/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RSVPGuest } from '../../src/types';

export class EmailView {
  /**
   * Generates a fully responsive, highly stylish Italian HTML email template for RSVP notification.
   */
  static renderRSVPEmailHTML(rsvp: RSVPGuest): string {
    const attendingText = rsvp.attending === 'yes' ? 'Sì, Partecipo!' : rsvp.attending === 'maybe' ? 'In forse' : 'Non posso partecipare';
    const attendingColor = rsvp.attending === 'yes' ? '#2e7d32' : rsvp.attending === 'maybe' ? '#f57c00' : '#c62828';

    // Companion builder HTML snippet
    const companionsHtml = rsvp.companions && rsvp.companions.length > 0
      ? rsvp.companions.map((c, i) => `
        <div style="padding: 12px; margin-top: 8px; background-color: #f5f1eb; border-left: 3px solid #8d775f; font-family: sans-serif;">
          <strong style="color: #2d2a26; font-size: 12px; text-transform: uppercase;">Accompagnatore #${i + 1}:</strong> <span style="font-size: 13px; font-weight: bold;">${c.name}</span><br/>
          <span style="font-size: 12px; color: #555;"><strong>Menù scelto:</strong> ${c.menuPreference || 'Standard'}</span><br/>
          <span style="font-size: 12px; color: #8c2a1a;"><strong>Tolleranze/Allergie:</strong> ${c.dietaryRequirements || 'Nessuna'}</span>
        </div>
      `).join('')
      : '<p style="font-style: italic; color: #888; font-size: 12px;">Nessuno</p>';

    return `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e8e2d9; background-color: #fcfaf7; color: #2d2a26; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #8d775f; padding-bottom: 20px; margin-bottom: 25px;">
          <span style="font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #8d775f; font-weight: bold; font-family: sans-serif;">Notifica RSVP</span>
          <h2 style="font-weight: 300; margin: 8px 0 0 0; color: #2d2a26; font-size: 24px;">Matrimonio Alessandro & Beatrice</h2>
        </div>

        <!-- Body -->
        <div style="margin-bottom: 30px;">
          <p style="font-size: 14px; margin: 6px 0;"><strong>Nome dell'Ospite:</strong> <span style="font-size: 16px; font-weight: bold; color: #2d2a26;">${rsvp.name}</span></p>
          <p style="font-size: 14px; margin: 6px 0;"><strong>Stato conferma:</strong> <span style="color: ${attendingColor}; font-weight: bold; text-transform: uppercase; border: 1px solid ${attendingColor}; padding: 3px 8px; font-size: 11px; font-family: sans-serif; display: inline-block; margin-left: 5px;">${attendingText}</span></p>
          
          ${rsvp.attending !== 'no' ? `
            <p style="font-size: 14px; margin: 6px 0;"><strong>Menù Selezionato:</strong> <span style="font-weight: bold;">${rsvp.menuPreference || 'Standard'}</span></p>
            <p style="font-size: 14px; margin: 6px 0; color: #8c2a1a;"><strong>Esigenze Alimentari / Dietetiche:</strong> <span style="font-family: monospace;">${rsvp.dietaryRequirements || 'Nessuna'}</span></p>
          ` : ''}
        </div>

        <!-- Companions -->
        ${rsvp.attending !== 'no' ? `
          <div style="margin-bottom: 30px; border-top: 1px solid #e8e2d9; padding-top: 15px;">
            <h3 style="font-size: 11px; color: #8d775f; text-transform: uppercase; font-family: sans-serif; letter-spacing: 2px; margin-top: 0; margin-bottom: 12px; font-weight: bold;">Accompagnatori & Familiari</h3>
            ${companionsHtml}
          </div>
        ` : ''}

        <!-- Dedication Message -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: #fcfaf7; border: 1px dashed #8d775f; border-radius: 2px; font-style: italic;">
          <span style="margin: 0 0 8px 0; display: block; font-family: sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #8d775f; font-weight: bold; font-style: normal;">Dedica e Messaggio di Auguri per la Coppia:</span>
          <p style="margin: 0; font-size: 14px; color: #2d2a26; line-height: 1.5;">"${rsvp.weddingMessage || 'Nessun messaggio scritto'}"</p>
        </div>

        <!-- Footer -->
        <div style="text-align: right; border-top: 1px solid #e8e2d9; padding-top: 15px; font-size: 11px; color: #8d775f; font-family: monospace;">
          Inviato alle ore: ${new Date(rsvp.timestamp || Date.now()).toLocaleTimeString('it-IT')} del ${new Date(rsvp.timestamp || Date.now()).toLocaleDateString('it-IT')}
        </div>
      </div>
    `;
  }
}
