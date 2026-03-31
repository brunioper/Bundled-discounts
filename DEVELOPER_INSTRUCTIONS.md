# Bundle Discount — Developer Handoff
## "Any 4 items from collection = $299"

---

## What this does
- Customer adds **any products from a specific Shopify collection** to cart (from any page)
- Every group of 4 earns a discount so their combined total = **$299**
- 3 items → full price | 5 items → $299 + 5th at full price | 8 items → $598
- Fully automatic — no coupon code needed from the customer

## Tech approach
**Shopify Function (Order Discount)** — runs server-side at Shopify's infrastructure.
No app server needed. Works on Basic/Shopify/Advanced plans.

---

## Prerequisites
- Node.js 18+ installed
- Shopify CLI v3: `npm install -g @shopify/cli`
- A **Shopify Partner account** (free): https://partners.shopify.com
- The store connected to that Partner account (ask store owner to add you as collaborator)

---

## Step 1 — Create a Shopify Partner account
1. Go to https://partners.shopify.com → Create account (free)
2. In Partners dashboard → Apps → Create app → "Create app manually"
3. Name it anything e.g. "Bundle Discount"
4. Note down the **Client ID** and **Client Secret**

## Step 2 — scaffold the project
```bash
# Create a new Shopify app
shopify app init --name bundle-discount

# Choose: No framework (vanilla)
# Choose: JavaScript (not TypeScript, not Rust)

cd bundle-discount

# Generate the Function extension
shopify app generate extension \
  --name bundle-discount \
  --template order_discounts \
  --language js
```

## Step 3 — replace generated files
Copy the 3 provided files into:
```
extensions/bundle-discount/src/index.js     ← REPLACE
extensions/bundle-discount/input.graphql    ← REPLACE
extensions/bundle-discount/shopify.extension.toml  ← REPLACE
```

## Step 4 — set the Collection ID
Open `extensions/bundle-discount/src/index.js` line 8:
```js
const COLLECTION_ID = "gid://shopify/Collection/YOUR_COLLECTION_ID_HERE";
```

**How to find the Collection ID:**
1. Shopify Admin → Products → Collections
2. Click the target collection
3. Look at the URL: `.../collections/123456789`
4. Replace with: `gid://shopify/Collection/123456789`

## Step 5 — deploy
```bash
# Connect to the store
shopify app dev --store YOUR_STORE.myshopify.com

# Deploy the function
shopify app deploy
```

## Step 6 — activate the discount in Shopify Admin
1. Shopify Admin → Discounts → Create discount
2. Select **"[your app name] - Bundle Discount"** from the list
3. Set it to **Automatic discount** (no code needed)
4. Title it e.g. "4 for $299 Bundle"
5. Save & Enable

## Step 7 — test
Add 3 items from the collection → no discount ✓
Add 4 items → discount applied, total = $299 ✓
Add 5 items → $299 + 5th item full price ✓
Add 8 items → $598 ✓

---

## Files provided
| File | Purpose |
|------|---------|
| `index.js` | Core discount logic — edit COLLECTION_ID and BUNDLE_PRICE here |
| `input.graphql` | Cart data query — do not edit |
| `shopify.extension.toml` | Extension config — do not edit |

## Questions?
- Shopify Functions docs: https://shopify.dev/docs/apps/build/functions
- Shopify CLI docs: https://shopify.dev/docs/apps/tools/cli
