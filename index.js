// ================================================================
// FILE: extensions/bundle-discount/src/index.js
// ================================================================
// Bundle Discount: every 4 items from a collection = $299 total
// Items can be added from anywhere (collection page, search, homepage)
// Stacks automatically: 8 items = $598, 12 items = $897, etc.
// ================================================================

// ✏️  EDIT THESE TWO VALUES — nothing else needs to change
const COLLECTION_ID  = "gid://shopify/Collection/YOUR_COLLECTION_ID_HERE";
const BUNDLE_PRICE   = 299.00;   // target price per group of 4 (store currency)

// ----------------------------------------------------------------
const BUNDLE_SIZE = 4;

export function run(input) {
  const lines = input.cart.lines;

  // 1. Filter lines that belong to our collection
  const collectionLines = lines.filter((line) => {
    const collections = line.merchandise?.product?.inAnyCollection ?? [];
    return collections.some((c) => c.id === COLLECTION_ID);
  });

  if (collectionLines.length === 0) {
    return noDiscount();
  }

  // 2. Flatten into individual unit slots
  //    e.g. a line with qty=3 becomes 3 slots, each with its unit price
  const slots = [];
  for (const line of collectionLines) {
    const unitPrice = parseFloat(line.cost.amountPerQuantity.amount);
    for (let i = 0; i < line.quantity; i++) {
      slots.push({ lineId: line.id, unitPrice });
    }
  }

  const completeBundles = Math.floor(slots.length / BUNDLE_SIZE);

  if (completeBundles === 0) {
    return noDiscount(); // fewer than 4 items → no discount
  }

  // 3. Sort by price descending (discount most expensive items first)
  slots.sort((a, b) => b.unitPrice - a.unitPrice);

  // 4. Only work with the slots that form complete bundles
  //    Remainder slots (e.g. 5th item when qty=5) stay at full price
  const discountedSlots = slots.slice(0, completeBundles * BUNDLE_SIZE);

  // 5. For each bundle group of 4, calculate the discount needed
  //    so that the 4 items together cost exactly BUNDLE_PRICE.
  //    Distribute it proportionally across the 4 lines.
  const lineDiscounts = {}; // lineId → { totalDiscount, unitCount }

  for (let b = 0; b < completeBundles; b++) {
    const group = discountedSlots.slice(b * BUNDLE_SIZE, (b + 1) * BUNDLE_SIZE);
    const groupTotal = group.reduce((s, slot) => s + slot.unitPrice, 0);
    const discountNeeded = Math.max(0, groupTotal - BUNDLE_PRICE);

    if (discountNeeded === 0) continue; // group already ≤ $299

    for (const slot of group) {
      const proportion   = slot.unitPrice / groupTotal;
      const slotDiscount = discountNeeded * proportion;

      if (!lineDiscounts[slot.lineId]) {
        lineDiscounts[slot.lineId] = { totalDiscount: 0, unitCount: 0 };
      }
      lineDiscounts[slot.lineId].totalDiscount += slotDiscount;
      lineDiscounts[slot.lineId].unitCount     += 1;
    }
  }

  // 6. Build Shopify discount targets
  const discounts = Object.entries(lineDiscounts)
    .filter(([, d]) => d.totalDiscount > 0)
    .map(([lineId, d]) => {
      const perUnit = d.totalDiscount / d.unitCount;
      return {
        targets: [
          {
            cartLine: {
              id: lineId,
              quantity: d.unitCount,
            },
          },
        ],
        value: {
          fixedAmount: {
            amount: perUnit.toFixed(2),
            appliesToEachItem: true,
          },
        },
        message: `Bundle: any 4 for $${BUNDLE_PRICE}`,
      };
    });

  if (discounts.length === 0) {
    return noDiscount();
  }

  return {
    discounts,
    discountApplicationStrategy: "ALL",
  };
}

function noDiscount() {
  return { discounts: [], discountApplicationStrategy: "FIRST" };
}
