/* =========================================================================
   PITEX — quote-whatsapp.js
   Builds the "Request a Quote" WhatsApp message and the wa.me link. Kept
   separate from quote-modal.js so the message format/company number can
   be updated in one place without touching modal/dialog behaviour.
   ========================================================================= */
(function () {
  'use strict';

  // PITEX contact number (see contact.html), digits-only for wa.me.
  const COMPANY_PHONE = '390551234567';

  function t(key, vars) {
    if (window.I18N && typeof window.I18N.t === 'function') return window.I18N.t(key, vars);
    return key;
  }

  /**
   * @param {{productName:string, quantity:string, country:string,
   *          company:string, fullName:string, email:string,
   *          phone:string}} data
   * @returns {string} plain-text WhatsApp message, in the language active
   *          at submit time (dynamic content — not just the static page).
   */
  function buildMessage(data) {
    const m = 'common.quoteModal.message.';
    const lines = [
      t(m + 'greeting'),
      '',
      t(m + 'intro'),
      '',
      t(m + 'productLabel'),
      data.productName || '-',
      '',
      t(m + 'quantityLabel'),
      data.quantity || '-',
      '',
      t(m + 'countryLabel'),
      data.country || '-',
      '',
      t(m + 'companyLabel'),
      data.company || '-',
      '',
      t(m + 'nameLabel'),
      data.fullName || '-',
      '',
      t(m + 'emailLabel'),
      data.email || '-',
      '',
      t(m + 'phoneLabel'),
      data.phone || '-',
      '',
      t(m + 'thanks'),
    ];
    return lines.join('\n');
  }

  /**
   * @param {object} data same shape as buildMessage()
   * @returns {string} full https://wa.me/... URL, message correctly encoded
   */
  function buildWhatsAppUrl(data) {
    const message = buildMessage(data);
    return 'https://wa.me/' + COMPANY_PHONE + '?text=' + encodeURIComponent(message);
  }

  window.PitexQuoteWhatsApp = {
    COMPANY_PHONE,
    buildMessage,
    buildWhatsAppUrl,
  };
})();
