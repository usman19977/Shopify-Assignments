
document.addEventListener("DOMContentLoaded", async function () {

    const checkoutBtn = document.getElementById("CartDrawer-Checkout");
   const checkoutBtnMain = document.getElementById("checkout");
   
   if (!checkoutBtn || !window.cartUpsellQueue) return;
 
   checkoutBtn.addEventListener("click", async function (e) {
     e.preventDefault(); // stop default redirect
 
     const queue = buildUpsellQueue(window.cartUpsellQueue);
     if (!queue.length) {
       // No upsells to show, proceed directly
       window.location.href = '/checkout';
       return;
     }
 
     await processUpsellQueue(queue);
     window.location.href = '/checkout';
   });
   if(checkoutBtnMain){
       checkoutBtnMain.addEventListener("click", async function (e) {
     e.preventDefault(); // stop default redirect
 
     const queue = buildUpsellQueue(window.cartUpsellQueue);
     if (!queue.length) {
       // No upsells to show, proceed directly
       window.location.href = '/checkout';
       return;
     }
 
     await processUpsellQueue(queue);
     window.location.href = '/checkout';
   });
   }
 
 });
 
 function buildUpsellQueue(cartItems) {
   const queue = [];
   const cartHandles = cartItems.map(i => i.product_handle);
 
   for (const item of cartItems) {
     if (!item.upsellHandles.length) continue;
 
     const storageKey = `upsell_shown_${item.productId}`;
  
     if (sessionStorage.getItem(storageKey)) continue;
     const filteredUpsells = item.upsellHandles.filter(h => !cartHandles.includes(h));
     if (!filteredUpsells.length) continue;
 
     // sessionStorage.setItem(storageKey, "true");
     queue.push({
       key: item.key,
       productId: item.productId,
       title: item.product_title,
       upsellHandles: filteredUpsells
     });
   }
 
   return queue;
 }
 
 async function processUpsellQueue(queue) {
   console.log('processUpsellQueue', queue)
   for (const item of queue) {
     for (const upsellHandle of item.upsellHandles) {
       const accepted = await showUpsellModal(item.title, upsellHandle);
       trackUpsell(item.title, upsellHandle, accepted);
 
       if (accepted) {
         await applyUpsell(item.key, upsellHandle);
         break;
       }
     }
   }
 }
 
 function showUpsellModal(baseTitle, upsellHandle) {
   return new Promise(async (resolve) => {
     const product = await fetch(`/products/${upsellHandle}.js`).then(res => res.json());
 
     const modal = document.createElement('div');
     modal.innerHTML = `
       <div class="upsell-modal" style="position: fixed; top: 25%; left: 50%; transform: translateX(-50%); z-index: 9999; background: white; border: 1px solid #ccc; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); text-align: center;">
         <p>Upgrade <strong>${baseTitle}</strong> to <strong>${product.title}</strong>?</p>
         <button id="upsell-yes" style="margin-right: 10px;">Yes, upgrade</button>
         <button id="upsell-no">No, continue</button>
       </div>
     `;
     document.body.appendChild(modal);
 
     document.getElementById("upsell-yes").onclick = () => {
       modal.remove();
       resolve(true);
     };
     document.getElementById("upsell-no").onclick = () => {
       modal.remove();
       resolve(false);
     };
   });
 }
 
 async function applyUpsell(oldKey, upsellHandle) {
   const product = await fetch(`/products/${upsellHandle}.js`).then(res => res.json());
 
   await fetch('/cart/change.js', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: oldKey, quantity: 0 })
   });
 
   return fetch('/cart/add.js', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: product.variants[0].id, quantity: 1 })
   });
 }
 
 function trackUpsell(fromProduct, toProduct, accepted) {
   console.log(`[Upsell ${accepted ? 'ACCEPTED' : 'DECLINED'}] ${fromProduct} → ${toProduct}`);
 }
 
 