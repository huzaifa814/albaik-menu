/* AL BAIK — site configuration.
   Everything the restaurant needs to change lives in this one file. */
window.ALBAIK_CONFIG = {
  brand: "AL BAIK",
  tagline: "CHICKEN N PIZZA",

  // Currency shown next to every price.
  currency: "$",

  // Phone number the "Send order" button messages on WhatsApp.
  // International format, digits only, no + and no spaces.  e.g. Pakistan 03123456789 -> "923123456789"
  whatsapp: "923123456789",

  // Phone number shown on the page / tap-to-call.
  phoneDisplay: "0312 345 6789",

  // Google review link.  Two ways to set it:
  //   1) paste the short link Google gives you (Business Profile -> Ask for reviews), or
  //   2) put the Place ID below and leave reviewUrl empty.
  reviewUrl: "",
  placeId: "",

  // Address line shown on the review page (optional).
  address: "",

  // Table numbers to print QR codes for.
  tables: 20
};
