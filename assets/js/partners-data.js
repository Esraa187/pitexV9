/* =========================================================================
   PITEX — partners-data.js
   Single source of truth for "Success Partners" logos, shared by the
   Success Partners page (success-partners.js) and the "Trusted by
   Industry Leaders" marquee on the Home / About / Leadership pages
   (trusted-marquee.js).

   HOW TO ADD A REAL PARTNER LOGO
   -------------------------------
   1. Drop the real logo file (PNG, SVG, or WEBP -- SVG preferred) into:
        assets/images/partners/
   2. Add one entry below with the matching `logo` path.
   3. That's it -- both the Success Partners grid and the marquees pick
      it up automatically, no other code changes needed.

   `name` exists for the `alt` attribute only -- per the design spec it is
   never rendered as visible text next to/under the logo.
   ========================================================================= */

window.PITEX_PARTNERS = [
  { name: 'Schneider Electric', logo: 'assets/images/partners/schneider-electric.png' },
  { name: 'Volta', logo: 'assets/images/partners/volta.png' },
  { name: 'Padana Cleanroom', logo: 'assets/images/partners/padana-cleanroom.png' },
  { name: 'Gutmann', logo: 'assets/images/partners/gutmann.png' },
  { name: 'Ezzsteel', logo: 'assets/images/partners/ezzsteel.png' },
  { name: 'Hörmann', logo: 'assets/images/partners/hormann.png' },
  { name: 'Ceramica Ranito', logo: 'assets/images/partners/ceramica-ranito.png' },
  { name: 'Atlas Copco', logo: 'assets/images/partners/atlas-copco.png' },
];
