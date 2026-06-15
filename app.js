// ==========================================================================
// KEBAB TIME - JEMBER - JAVASCRIPT LOGIC
// ==========================================================================

// Shop Metadata
const WHATSAPP_NUMBER = "6285158922938"; // WhatsApp number of owner

const MENU_ITEMS = {
    "reg-single": { name: "Regular Single Beef", price: 9000 },
    "reg-double": { name: "Regular Double Beef", price: 12000 },
    "reg-special": { name: "Regular Special (Telor)", price: 15000 },
    "reg-premium": { name: "Regular Premium", price: 15000 },
    "black-single": { name: "Black Single Beef", price: 11000 },
    "black-double": { name: "Black Double Beef", price: 14000 },
    "black-special": { name: "Black Special (Telor)", price: 17000 },
    "black-premium": { name: "Black Premium", price: 17000 }
};

// Global Order State
let currentOrder = {
    items: {}, // key: itemId, value: quantity
    toppings: [],
    branch: "Taman Gading",
    method: "Delivery",
    address: "",
    notes: "",
    name: ""
};

// Testimonial Slider State
let currentSlideIndex = 0;
let slideInterval;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Mobile Menu Drawer Toggle
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const closeMobileNav = document.getElementById("closeMobileNav");
    const mobileNav = document.getElementById("mobileNav");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileNav.classList.add("active");
        });
    }

    if (closeMobileNav && mobileNav) {
        closeMobileNav.addEventListener("click", () => {
            mobileNav.classList.remove("active");
        });
    }

    mobileLinks.forEach(link => {
        link.addEventListener("click", () => {
            mobileNav.classList.remove("active");
        });
    });

    // Close modal when clicking backdrop
    const orderModal = document.getElementById("orderModal");
    if (orderModal) {
        orderModal.addEventListener("click", (e) => {
            if (e.target === orderModal) {
                closeOrderModal();
            }
        });
    }

    // Initialize Testimonial Slider Dots & Auto Scroll
    initSlider();

    // SPA Router for Clean SEO URLs
    const isLocalFile = window.location.protocol === "file:";
    
    // Intercept clicks on links starting with "/"
    document.querySelectorAll('a[href^="/"]').forEach(link => {
        const path = link.getAttribute("href");
        
        // If local file, rewrite href to use hash so it works locally without a server
        if (isLocalFile) {
            if (path === "/") {
                link.setAttribute("href", "#");
            } else {
                link.setAttribute("href", "#" + path.substring(1));
            }
            return;
        }

        // For HTTP/HTTPS, use clean URL router
        link.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Push to history
            history.pushState(null, null, path);
            
            // Scroll to element
            navigateToPath(path);
        });
    });

    // Handle initial load on HTTP/HTTPS
    if (!isLocalFile) {
        const currentPath = window.location.pathname;
        if (currentPath !== "/" && currentPath !== "") {
            // Wait for elements to render
            setTimeout(() => {
                navigateToPath(currentPath, false);
            }, 300);
        }
    }

    // Handle history back/forward navigation
    window.addEventListener("popstate", () => {
        if (!isLocalFile) {
            navigateToPath(window.location.pathname);
        }
    });

    function navigateToPath(path, smooth = true) {
        const targetId = (path === "/" || path === "") ? "hero" : path.substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            const headerOffset = 80;
            const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: smooth ? "smooth" : "auto"
            });
        }
    }
});

// 2. Menu Tab Switcher (Regular vs Black Kebab)
function switchMenu(type) {
    const tabRegular = document.getElementById("tabRegular");
    const tabBlack = document.getElementById("tabBlack");
    const menuRegular = document.getElementById("menuRegular");
    const menuBlack = document.getElementById("menuBlack");

    if (type === "regular") {
        tabRegular.classList.add("active");
        tabBlack.classList.remove("active");
        menuRegular.classList.add("active");
        menuBlack.classList.remove("active");
    } else if (type === "black") {
        tabRegular.classList.remove("active");
        tabBlack.classList.add("active");
        menuRegular.classList.remove("active");
        menuBlack.classList.add("active");
    }
}

// 3. Multi-Item Order Modal Controls
function openOrderModal(itemId) {
    // Reset all item quantities to 0
    for (let id in MENU_ITEMS) {
        currentOrder.items[id] = 0;
        const qtyEl = document.getElementById(`qty_${id}`);
        if (qtyEl) qtyEl.innerText = "0";
        
        const row = document.querySelector(`.modal-menu-item[data-id="${id}"]`);
        if (row) row.classList.remove("selected");
    }

    // If opened from a specific card, set that item quantity to 1
    if (itemId && MENU_ITEMS[itemId]) {
        currentOrder.items[itemId] = 1;
        const qtyEl = document.getElementById(`qty_${itemId}`);
        if (qtyEl) qtyEl.innerText = "1";
        
        const row = document.querySelector(`.modal-menu-item[data-id="${itemId}"]`);
        if (row) row.classList.add("selected");
    }

    // Uncheck all toppings
    const checkboxes = document.querySelectorAll(".topping-cb");
    checkboxes.forEach(cb => cb.checked = false);

    // Reset fields to default
    document.querySelector('input[name="orderBranch"][value="Taman Gading"]').checked = true;
    document.querySelector('input[name="orderMethod"][value="Delivery"]').checked = true;
    
    const nameInput = document.getElementById("orderName");
    const addressInput = document.getElementById("orderAddress");
    
    if (nameInput) {
        nameInput.value = "";
        nameInput.classList.remove("input-error");
    }
    if (addressInput) {
        addressInput.value = "";
        addressInput.classList.remove("input-error");
    }
    document.getElementById("orderNotes").value = "";
    
    toggleAddressField();
    calculateTotal();

    // Show modal
    const modal = document.getElementById("orderModal");
    modal.classList.add("active");
}

function closeOrderModal() {
    const modal = document.getElementById("orderModal");
    modal.classList.remove("active");
}

function adjustItemQty(itemId, val) {
    if (!currentOrder.items[itemId]) {
        currentOrder.items[itemId] = 0;
    }
    currentOrder.items[itemId] += val;
    if (currentOrder.items[itemId] < 0) {
        currentOrder.items[itemId] = 0;
    }
    
    // Update display quantity
    const qtyEl = document.getElementById(`qty_${itemId}`);
    if (qtyEl) qtyEl.innerText = currentOrder.items[itemId];
    
    // Add/remove selected styling
    const row = document.querySelector(`.modal-menu-item[data-id="${itemId}"]`);
    if (row) {
        if (currentOrder.items[itemId] > 0) {
            row.classList.add("selected");
        } else {
            row.classList.remove("selected");
        }
    }
    
    calculateTotal();
}

function calculateTotal() {
    let itemsTotal = 0;
    for (let id in MENU_ITEMS) {
        const qty = currentOrder.items[id] || 0;
        itemsTotal += MENU_ITEMS[id].price * qty;
    }

    let toppingTotal = 0;
    const checkboxes = document.querySelectorAll(".topping-cb");
    checkboxes.forEach(cb => {
        if (cb.checked) {
            toppingTotal += parseInt(cb.getAttribute("data-price"));
        }
    });

    const total = itemsTotal + toppingTotal;
    document.getElementById("modalTotalVal").innerText = formatIDR(total);
}

function toggleAddressField() {
    const method = document.querySelector('input[name="orderMethod"]:checked').value;
    const addressGroup = document.getElementById("addressGroup");
    
    if (method === "Delivery") {
        addressGroup.style.display = "block";
    } else {
        addressGroup.style.display = "none";
    }
}

function openQuickOrder() {
    openOrderModal(null);
}

function formatIDR(num) {
    return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// 4. Send Order via WhatsApp (Multi-item support with Notes)
function sendWhatsAppOrder() {
    const name = document.getElementById("orderName").value.trim();
    const branch = document.querySelector('input[name="orderBranch"]:checked').value;
    const method = document.querySelector('input[name="orderMethod"]:checked').value;
    const address = document.getElementById("orderAddress").value.trim();
    const notes = document.getElementById("orderNotes").value.trim();
    
    // Validate customer name
    const nameInput = document.getElementById("orderName");
    if (!name) {
        showToast("Silakan masukkan Nama Anda terlebih dahulu!", "warning");
        if (nameInput) {
            nameInput.classList.add("input-error");
            nameInput.focus();
            nameInput.addEventListener("input", function removeError() {
                nameInput.classList.remove("input-error");
                nameInput.removeEventListener("input", removeError);
            });
        }
        return;
    }

    // Build list of ordered items
    let orderedItems = [];
    let totalQty = 0;
    let itemsTotal = 0;
    
    for (let id in MENU_ITEMS) {
        const qty = currentOrder.items[id] || 0;
        if (qty > 0) {
            orderedItems.push({
                name: MENU_ITEMS[id].name,
                price: MENU_ITEMS[id].price,
                qty: qty,
                subtotal: MENU_ITEMS[id].price * qty
            });
            totalQty += qty;
            itemsTotal += MENU_ITEMS[id].price * qty;
        }
    }

    // Validate if at least one item is chosen
    if (orderedItems.length === 0) {
        showToast("Silakan pilih minimal 1 Kebab terlebih dahulu!", "warning");
        return;
    }

    // Validate delivery address
    const addressInput = document.getElementById("orderAddress");
    if (method === "Delivery" && !address) {
        showToast("Silakan masukkan Alamat Pengiriman Anda!", "warning");
        if (addressInput) {
            addressInput.classList.add("input-error");
            addressInput.focus();
            addressInput.addEventListener("input", function removeError() {
                addressInput.classList.remove("input-error");
                addressInput.removeEventListener("input", removeError);
            });
        }
        return;
    }

    // Gather extra toppings
    let toppingsList = [];
    let toppingsPrice = 0;
    const checkboxes = document.querySelectorAll(".topping-cb");
    checkboxes.forEach(cb => {
        if (cb.checked) {
            toppingsList.push(cb.value);
            toppingsPrice += parseInt(cb.getAttribute("data-price"));
        }
    });

    const grandTotal = itemsTotal + toppingsPrice;

    // Compose formatted WhatsApp text in Indonesian
    let message = `Halo Kebab Time 👋\n`;
    message += `Saya mau memesan Kebab dengan detail berikut:\n\n`;
    message += `*Daftar Pesanan:*\n`;
    orderedItems.forEach(item => {
        message += `- ${item.qty}x *${item.name}* (${formatIDR(item.price)}/pcs) = *${formatIDR(item.subtotal)}*\n`;
    });
    
    if (toppingsList.length > 0) {
        message += `- *Ekstra Topping:* ${toppingsList.join(", ")} (${formatIDR(toppingsPrice)})\n`;
    }
    
    message += `\n*Total Pembayaran:* *${formatIDR(grandTotal)}*\n\n`;
    
    if (notes) {
        message += `*Catatan:* "${notes}"\n\n`;
    }

    message += `*Data Pemesan:*\n`;
    message += `- *Nama:* ${name}\n`;
    message += `- *Cabang:* Kebab Time ${branch}\n`;
    message += `- *Metode:* ${method === "Delivery" ? "Antar ke Rumah (Delivery)" : "Ambil Sendiri (Takeaway)"}\n`;
    
    if (method === "Delivery") {
        message += `- *Alamat:* ${address}\n`;
        // Free delivery condition in Taman Gading
        if (branch === "Taman Gading" && totalQty >= 2) {
            message += `\n*Yay! Pesanan Anda memenuhi syarat GRATIS ONGKIR area Taman Gading!* 🎉\n`;
        }
    }

    message += `\nMohon segera diproses ya, terima kasih! 🙏`;

    // Open WhatsApp link in new window tab
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
    
    window.open(waUrl, "_blank");
    closeOrderModal();
}

// 5. Testimonial Slider JS logic
function initSlider() {
    const slides = document.querySelectorAll(".testimonial-slide");
    const dotsContainer = document.getElementById("sliderDots");
    
    if (slides.length === 0) return;
    
    // Clear existing dots
    dotsContainer.innerHTML = "";

    // Generate dots
    slides.forEach((_, idx) => {
        const dot = document.createElement("span");
        dot.classList.add("slider-dot");
        if (idx === 0) dot.classList.add("active");
        dot.addEventListener("click", () => {
            goToSlide(idx);
            resetSlideTimer();
        });
        dotsContainer.appendChild(dot);
    });

    // Start auto slide timer
    startSlideTimer();
}

function startSlideTimer() {
    slideInterval = setInterval(() => {
        moveSlide(1);
    }, 5000); // changes review every 5 seconds
}

function resetSlideTimer() {
    clearInterval(slideInterval);
    startSlideTimer();
}

function moveSlide(direction) {
    const slides = document.querySelectorAll(".testimonial-slide");
    if (slides.length === 0) return;
    
    let newIndex = currentSlideIndex + direction;
    if (newIndex >= slides.length) {
        newIndex = 0;
    } else if (newIndex < 0) {
        newIndex = slides.length - 1;
    }
    
    goToSlide(newIndex);
}

function goToSlide(index) {
    const slides = document.querySelectorAll(".testimonial-slide");
    const dots = document.querySelectorAll(".slider-dot");
    
    if (slides.length === 0) return;

    // Remove active class from current slide and dot
    slides[currentSlideIndex].classList.remove("active");
    if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.remove("active");

    // Set new index
    currentSlideIndex = index;

    // Add active class to new slide and dot
    slides[currentSlideIndex].classList.add("active");
    if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add("active");
}

// 6. Custom Toast Notification System
function showToast(message, type = "error") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconHtml = "";
    if (type === "error") {
        iconHtml = `<i class="fa-solid fa-circle-xmark toast-icon error"></i>`;
    } else if (type === "warning") {
        iconHtml = `<i class="fa-solid fa-circle-exclamation toast-icon warning"></i>`;
    } else if (type === "success") {
        iconHtml = `<i class="fa-solid fa-circle-check toast-icon success"></i>`;
    }

    toast.innerHTML = `
        ${iconHtml}
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Remove toast after animation finishes (3 seconds total)
    setTimeout(() => {
        toast.style.animation = "fadeOutToast 0.3s ease-in forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2700);
}
