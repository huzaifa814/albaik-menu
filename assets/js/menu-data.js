/* AL BAIK menu - transcribed from the printed menu board.
   To change a price, edit the number here. Nothing else needs to change. */
window.ALBAIK_MENU = [
  {
    id: "fried-chicken",
    name: "Crispy Fried Chicken",
    note: "Side options: Fries or Coleslaw",
    items: [
      { id: "fc1", name: "4pcs Chicken with 1 side", price: 12.99, options: [{ name: "Side", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc2", name: "8pcs Chicken Bucket with 1 side", price: 24.99, options: [{ name: "Side", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc3", name: "12pcs Chicken Bucket with 1 side", price: 29.99, options: [{ name: "Side", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc4", name: "20pcs Chicken Bucket with 2 sides", price: 45.99, options: [{ name: "Side 1", choices: ["Fries", "Coleslaw"] }, { name: "Side 2", choices: ["Fries", "Coleslaw"] }] },
      { id: "fc5", name: "3pcs Chicken Tenders with 1 side", price: 9.99, options: [{ name: "Side", choices: ["Fries", "Coleslaw"] }] }
    ]
  },
  {
    id: "wings",
    name: "Chicken Wings",
    note: "Flavors: BBQ, Buffalo, Haryali, Hot Honey Garlic, Lemon Pepper - comes with your choice of dipping sauce",
    items: [
      { id: "w1", name: "6pcs Wings", price: 9.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] },
      { id: "w2", name: "12pcs Wings", price: 14.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] },
      { id: "w3", name: "14pcs Wings", price: 15.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] },
      { id: "w4", name: "20pcs Wings", price: 22.99, options: [{ name: "Flavor", choices: ["BBQ", "Buffalo", "Haryali", "Hot Honey Garlic", "Lemon Pepper"] }] }
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
      { id: "p1", name: "Beef Supreme", desc: "Beef pepperoni, mushrooms, onions, peppers & Italian sausage." },
      { id: "p2", name: "Beef Pepperoni", desc: "Red sauce, mozzarella cheese, sliced beef pepperoni." },
      { id: "p4", name: "Beef Pizza", desc: "Red sauce, mozzarella cheese, ground beef, peppers & onions." },
      { id: "p5", name: "Meat Lovers", desc: "Red sauce, mozzarella cheese, beef pepperoni, ground beef, beef salami & beef bacon." },
      { id: "p6", name: "Beef Combination", desc: "Red sauce, mozzarella cheese, beef pepperoni, Italian sausage, mushrooms, red onion, black olive & bell peppers." },
      { id: "p7", name: "Hawaiian", desc: "Red sauce, mozzarella cheese, crunchy beef bacon & pineapple." },
      { id: "p8", name: "Veggie Lovers", desc: "Red sauce, fresh mozzarella cheese, fresh mushrooms, sliced red onions, fresh peppers, sliced black olives, juicy tomatoes." },
      { id: "p9", name: "Gyro Lamb & Beef", desc: "White sauce, mozzarella cheese, gyro lamb & beef, red onion, jalapeno, pineapple, garlic & cilantro." },
      { id: "p10", name: "Shrimp", desc: "White sauce, mozzarella cheese, spinach, red onion, garlic, shrimp & green onion." },
      { id: "p11", name: "Chicken Supreme", desc: "Red sauce, mozzarella cheese, mushrooms, onions, peppers & grilled chicken." },
      { id: "p12", name: "BBQ Chicken", desc: "BBQ sauce, mozzarella cheese, red onions, tomatoes & BBQ chicken breast." },
      { id: "p13", name: "Buffalo Chicken", desc: "Garlic sauce, mozzarella cheese, red onion, jalapenos & buffalo chicken.", spicy: true },
      { id: "p14", name: "Triple Chicken", desc: "Garlic sauce, mozzarella cheese, BBQ chicken, buffalo chicken & mango habanero chicken, drizzled with garlic sauce." },
      { id: "p15", name: "Achari Chicken", desc: "Garlic sauce, mozzarella cheese, red onions, achari jalapenos, achari chicken, garnished with green onions.", spicy: true },
      { id: "p16", name: "Tandoori Chicken", desc: "Tandoori sauce, tandoori chicken, mozzarella cheese, mushrooms, red onions, garlic, garnished with cilantro." },
      { id: "p17", name: "Tikka Chicken", desc: "Tikka masala sauce, tikka masala chicken, mozzarella cheese, mushrooms, red onions, bell peppers, garlic, garnished with cilantro." },
      { id: "p18", name: "Butter Chicken", desc: "Butter sauce, mozzarella cheese, red onions, tomatoes, garlic and butter chicken, garnished with cilantro." }
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
    id: "breadsticks",
    name: "Breadsticks",
    items: [
      { id: "b1", name: "Chicken Breadsticks", price: 10.99 },
      { id: "b2", name: "Garlic Cheezy Breadsticks", price: 10.99 },
      { id: "b3", name: "Gyro Beef & Lamb Breadsticks", price: 10.99 },
      { id: "b4", name: "Beef Breadsticks", price: 10.99 }
    ]
  },
  {
    id: "burgers",
    name: "Burgers",
    note: "Comes with fries",
    items: [
      { id: "bg1", name: "Chicken Zinger Burger", price: 9.99 },
      { id: "bg2", name: "Nashville Hot Chicken Zinger", price: 9.99, spicy: true },
      { id: "bg3", name: "Beef Burger", price: 9.99 },
      { id: "bg4", name: "Double Patty Beef Burger", price: 12.99 }
    ]
  },
  {
    id: "kabob",
    name: "Kabob",
    items: [
      { id: "k1", name: "Beef Skewers", price: 6.99 },
      { id: "k2", name: "Chicken Tandoori Skewers", price: 9.99 },
      { id: "k3", name: "Chicken Tikka Skewers", price: 9.99 },
      { id: "k4", name: "Chicken Tandoori Kabob Leg Plate", price: 11.99 },
      { id: "k5", name: "Chicken Tandoori Skewers Kabob Plate", price: 11.99 },
      { id: "k6", name: "Chicken Tikka Skewers Kabob Plate", price: 11.99 },
      { id: "k7", name: "Beef Skewers Kabob Plate", price: 9.99 },
      { id: "k8", name: "Gyro Beef & Lamb Plate", price: 9.99 },
      { id: "k9", name: "Shawarma Plate", price: 9.99 }
    ]
  },
  {
    id: "wraps",
    name: "Wraps",
    items: [
      { id: "wr1", name: "Beef Kabob Wrap", price: 9.99 },
      { id: "wr2", name: "Chicken Tandoori Kabob Wrap", price: 9.99 },
      { id: "wr3", name: "Chicken Tikka Kabob Wrap", price: 9.99 },
      { id: "wr4", name: "Gyro Beef & Lamb Wrap", price: 9.99 },
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
    id: "noodles",
    name: "Noodles",
    items: [
      { id: "n1", name: "Regular Noodles", price: 35.00 },
      { id: "n2", name: "Chicken Noodles", price: 45.00 },
      { id: "n3", name: "Beef Noodles", price: 45.00 },
      { id: "n4", name: "Special Noodles", price: 65.00 }
    ]
  },
  {
    id: "spaghetti",
    name: "Spaghetti",
    items: [
      { id: "s1", name: "Regular Spaghetti", price: 35.00 },
      { id: "s2", name: "Chicken Spaghetti", price: 45.00 },
      { id: "s3", name: "Beef Spaghetti", price: 45.00 },
      { id: "s4", name: "Special Spaghetti", price: 65.00 }
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
      { id: "sl1", name: "Coleslaw 8oz", price: 3.99 },
      { id: "sl2", name: "Coleslaw 16oz", price: 5.99 },
      { id: "sl3", name: "Garden Salad", price: 6.99 },
      { id: "sl4", name: "Chicken Caesar Salad", price: 6.99 }
    ]
  }
];
