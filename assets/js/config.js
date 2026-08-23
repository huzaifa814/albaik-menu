/* AL BAIK - site settings. This is the only file the restaurant needs to touch. */
window.ALBAIK_CONFIG = {
  brand: "AL BAIK",
  tagline: "CHICKEN N PIZZA",

  // Symbol shown next to every price.
  currency: "$",

  // Number shown on the "Call us" button (tap to dial).
  phoneDisplay: "(916) 680-6803",

  // Optional: WhatsApp number for the "Message us" button on the review page.
  // International format, digits only, no + and no spaces. Leave empty to hide the button.
  whatsapp: "",

  // Google review link. Either paste the link from your Google Business Profile
  // (Read reviews -> Get more reviews -> Share review form), or set placeId instead.
  reviewUrl: "",
  placeId: "",

  // Optional address line shown on the review page.
  address: "6680 Stockton Blvd, Sacramento, CA",

  // Shows the "100% Halal" badge in the header. Set to false to hide it.
  halal: true,

  // Deals shown at the top of the menu. Empty array = no deals block at all.
  //   name  - what the deal is called
  //   items - what the customer gets, plain words
  //   was   - the price of the same items bought separately (optional, shown struck through)
  //   price - what the deal costs
  // e.g. { name: "Family Feast", items: "12pc chicken bucket + 14\" large pizza + large fries",
  //        was: 57.97, price: 49.99 }
  deals: []
};
