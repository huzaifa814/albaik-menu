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

  // Toast online ordering link. Once Toast is live, find it in Toast Web under
  // Takeout & delivery -> Toast order sources -> Restaurant info. Paste it here and
  // an "Order & Pay" bar appears on the menu; leave it empty and nothing shows,
  // which is the right state while the waiter still takes every order.
  orderUrl: "",

  // Optional address line shown on the review page.
  address: "6680 Stockton Blvd Ste 4, Sacramento, CA 95823",

  // Shows the "100% Halal" badge in the header. Set to false to hide it.
  halal: true,

  // Opening hours. 24-hour clock, ["open", "close"] per day, or null for a day
  // you are closed. The site works out "Open now" or "Closed" from these and
  // shows it in the header - so keep them right, and set them here only once.
  // A close time before the open time means you shut after midnight,
  // e.g. ["17:00", "01:00"] is 5pm until 1am.
  timezone: "America/Los_Angeles",
  hours: {
    mon: ["11:00", "22:00"],
    tue: ["11:00", "22:00"],
    wed: ["11:00", "22:00"],
    thu: ["11:00", "22:00"],
    fri: ["11:00", "22:00"],
    sat: ["11:00", "22:00"],
    sun: ["11:00", "22:00"]
  },

  // Deals shown at the top of the menu. Empty array = no deals block at all.
  //   name  - what the deal is called
  //   items - what the customer gets, plain words
  //   was   - the price of the same items bought separately (optional, shown struck through)
  //   price - what the deal costs
  // e.g. { name: "Family Feast", items: "12pc chicken bucket + 14\" large pizza + large fries",
  //        was: 57.97, price: 49.99 }
  deals: []
};
