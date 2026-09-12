/* AL BAIK menu - transcribed from the "final Version Menu" PDF of 2026-09-11.
   To change a price, edit the number here. Nothing else needs to change. */
window.ALBAIK_MENU = [
  {
    id: "fried-chicken",
    name: "Crispy Fried Chicken",
    note: "Regular or Nashville Hot. Side options: Fries or Coleslaw",
    items: [
      { id: "fc1", name: "4pcs Chicken with 1 side", price: 12.99, options: [{ name: "Style", choices: ["Regular", "Nashville Hot"] }, { name: "Side", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc2", name: "8pcs Chicken Bucket with 1 side", price: 24.99, options: [{ name: "Style", choices: ["Regular", "Nashville Hot"] }, { name: "Side", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc3", name: "12pcs Chicken Bucket with 1 side", price: 29.99, options: [{ name: "Style", choices: ["Regular", "Nashville Hot"] }, { name: "Side", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc4", name: "20pcs Chicken Bucket with 2 sides", price: 45.99, options: [{ name: "Style", choices: ["Regular", "Nashville Hot"] }, { name: "Side 1", choices: ["Fries", "Coleslaw"] }, { name: "Side 2", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc5", name: "3pcs Chicken Tenders with 1 side", price: 9.99, options: [{ name: "Style", choices: ["Regular", "Nashville Hot"] }, { name: "Side", choices: ["Fries", "Coleslaw"] }] }
    ]
  },
  {
    id: "wings",
    name: "Chicken Wings",
    note: "Flavors: BBQ, Buffalo, Haryali, Hot Honey Garlic, Lemon Pepper - comes with your choice of dipping sauce",
    items: [
      { id: "w1", name: "6pcs Wings", price: 9.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] },
      { id: "w2", name: "12pcs Wings", price: 14.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] },
      { id: "w3", name: "14pcs Wings", price: 16.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] },
      { id: "w4", name: "20pcs Wings", price: 22.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] }
    ]
  },
  {
    id: "kids-meal",
    name: "Kids Meal",
    note: "Comes with fries",
    items: [
      { id: "km1", name: "2 pcs Chicken Tenders with Fries", price: 7.99 },
      { id: "km2", name: "Cheez Burger with Fries", price: 7.99 },
      { id: "km3", name: "1 pc Drumstick with Fries", price: 6.99 }
    ]
  },
  {
    id: "pizza",
    name: "Pizza",
    note: "Every pizza comes in four sizes",
    sizes: [
      { label: "10\" Small", price: 12.99 },
      { label: "12\" Medium", price: 19.99 },
      { label: "14\" Large", price: 23.99 },
      { label: "16\" Extra Large", price: 29.99 }
    ],
    items: [
      { id: "p1", name: "Beef Supreme", desc: "Tomato sauce, mozzarella cheese, beef pepperoni, mushrooms, onions, peppers, Italian sausage." },
      { id: "p2", name: "Beef Pepperoni", desc: "Tomato sauce, mozzarella cheese, beef pepperoni." },
      { id: "p5", name: "Meat Lovers", desc: "Tomato sauce, mozzarella cheese, beef pepperoni, ground beef, beef bacon." },
      { id: "p6", name: "Beef Combination", desc: "Tomato sauce, mozzarella cheese, beef pepperoni, Italian sausage, mushrooms, onions, olives, bell peppers." },
      { id: "p7", name: "Hawaiian", desc: "Tomato sauce, mozzarella cheese, beef bacon, pineapple." },
      { id: "p8", name: "Veggie Lovers", desc: "Tomato sauce, mozzarella cheese, fresh mushrooms, sliced red onions, peppers, olives, tomatoes, pickles." },
      { id: "p9", name: "Gyro Lamb", desc: "White sauce, mozzarella cheese, gyro lamb, onions, jalapeno, pineapple, garlic, cilantro." },
      { id: "p11", name: "Chicken Supreme", desc: "Tomato sauce, mozzarella cheese, mushrooms, onions, peppers, grilled chicken." },
      { id: "p12", name: "BBQ Chicken", desc: "BBQ sauce, mozzarella cheese, onions, tomatoes, BBQ chicken, beef bacon." },
      { id: "p13", name: "Buffalo Chicken", desc: "Garlic sauce, mozzarella cheese, onions, jalapenos, buffalo chicken.", spicy: true },
      { id: "p14", name: "Triple Chicken", desc: "Garlic sauce, mozzarella cheese, BBQ chicken, buffalo chicken, spicy chicken.", spicy: true },
      { id: "p15", name: "Achari Chicken", desc: "Garlic sauce, mozzarella cheese, onions, jalapenos, achari chicken.", spicy: true },
      { id: "p17", name: "Tikka Chicken", desc: "Tikka masala sauce, tandoori chicken, mozzarella cheese, mushrooms, onions, bell peppers, garlic, garnished with cilantro." },
      { id: "p18", name: "Butter Chicken", desc: "Butter sauce, mozzarella cheese, onions, tomatoes, garlic, butter chicken, garnished with cilantro." }
    ]
  },
  {
    id: "cheezy-pizza",
    name: "Cheezy Pizza",
    sizes: [
      { label: "10\" Small", price: 9.99 },
      { label: "12\" Medium", price: 14.99 },
      { label: "14\" Large", price: 17.99 },
      { label: "16\" Extra Large", price: 21.99 }
    ],
    items: [
      { id: "cp1", name: "Cheezy Pizza", desc: "Loaded mozzarella, baked golden." }
    ]
  },
  {
    id: "byo-pizza",
    name: "Build Your Own Pizza",
    info: "Regular or thin crust. Mozzarella cheese $2.50. Sauces $1.50 each: tomato, garlic, tandoori, tikka, burger. Protein toppings $2.50 each: beef pepperoni, gyro lamb, beef salami, beef bacon bits, garlic chicken, grilled chicken, crispy fried chicken bites, chicken tandoori, chicken tikka. Veggie toppings $1.50 each: red onion, white onion, bell peppers, olives, green onion, pineapple bits, tomatoes, jalapenos, green chillies, red chilli flakes, dill pickles, sumac onion. Order at the counter.",
    items: []
  },
  {
    id: "breadsticks",
    name: "Breadsticks",
    items: [
      { id: "b1", name: "Chicken Breadsticks", price: 10.99 },
      { id: "b2", name: "Garlic Cheezy Breadsticks", price: 10.99 },
      { id: "b3", name: "Gyro Lamb Breadsticks", price: 10.99 },
      { id: "b4", name: "Beef Breadsticks", price: 10.99 }
    ]
  },
  {
    id: "burgers",
    name: "Burgers",
    note: "Comes with fries",
    items: [
      { id: "bg1", name: "Chicken Zinger Burger", price: 9.99 },
      { id: "bg2", name: "Nashville Hot Zinger Burger", price: 9.99, spicy: true },
      { id: "bg3", name: "Beef Burger", price: 9.99 },
      { id: "bg4", name: "Double Patty Beef Burger", price: 12.99 }
    ]
  },
  {
    id: "fries",
    name: "Fries",
    note: "Original, Peri peri or Lemon Pepper",
    items: [
      { id: "f1", name: "Small Fries", price: 2.99, options: [{ name: "Flavor", choices: ["Original", "Peri peri", "Lemon Pepper"] }] },
      { id: "f2", name: "Medium Fries", price: 3.99, options: [{ name: "Flavor", choices: ["Original", "Peri peri", "Lemon Pepper"] }] },
      { id: "f3", name: "Large Fries", price: 4.99, options: [{ name: "Flavor", choices: ["Original", "Peri peri", "Lemon Pepper"] }] }
    ]
  },
  {
    id: "salads",
    name: "Salads",
    items: [
      { id: "sl1", name: "Coleslaw Regular", price: 3.99 },
      { id: "sl2", name: "Coleslaw Medium", price: 5.99 },
      { id: "sl4", name: "Chicken Caesar Salad", price: 8.99 }
    ]
  },
  {
    id: "kabob",
    name: "Kabab",
    note: "1 stick",
    items: [
      { id: "k10", name: "Chicken Seekh Kabab", price: 9.99 },
      { id: "k11", name: "Beef Seekh Kabab", price: 9.99 }
    ]
  },
  {
    id: "wraps",
    name: "Wraps",
    items: [
      { id: "wr1", name: "Beef Kabob Wrap", price: 9.99 },
      { id: "wr2", name: "Chicken Tandoori Kabob Wrap", price: 9.99 },
      { id: "wr3", name: "Chicken Tikka Kabob Wrap", price: 9.99 },
      { id: "wr4", name: "Gyro & Lamb Wrap", price: 9.99 },
      { id: "wr5", name: "Haryali Chicken Kabob Wrap", price: 9.99 }
    ]
  },
  {
    id: "roast",
    name: "Roast Chicken",
    soon: true,
    items: [
      { id: "r1", name: "Roast Chicken", price: 25.99, desc: "Includes sauces." },
      { id: "r2", name: "Roast Chicken with 1/2 Sheet tray Rice plate", price: 35.99, desc: "Includes coleslaw, chutney and yogurt raita." }
    ]
  },
  {
    id: "bbq",
    name: "BBQ",
    soon: true,
    items: []
  }
];
