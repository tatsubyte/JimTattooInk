// ============================================================================
// CONFIGURACIÓN DE FIREBASE (Reemplaza con tus credenciales de Firebase Console)
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "jimtattoo-ink.firebaseapp.com",
  projectId: "jimtattoo-ink",
  storageBucket: "jimtattoo-ink.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000"
};

let db = null;
const firebaseReady = firebaseConfig.apiKey !== "TU_API_KEY";
if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// ============================================================================
// 1. VERIFICACIÓN DE EDAD (+18)
// ============================================================================
const ageGate = document.getElementById("age-gate");
const btnEnter = document.getElementById("btn-enter");

if (ageGate && btnEnter) {
  if (sessionStorage.getItem("jimtattoo_adult") === "true") {
    ageGate.classList.add("hidden");
  }
  btnEnter.addEventListener("click", () => {
    sessionStorage.setItem("jimtattoo_adult", "true");
    ageGate.classList.add("hidden");
  });
}

// ============================================================================
// 2. SISTEMA DE RESEÑAS (3 BURBUJAS VISIBLES + FIREBASE / RESPALDO LOCAL)
// ============================================================================
const defaultReviews = [
  { name: "Marc V.", rating: 5, text: "Increíble trabajo en mi brazo Blackwork. Higiene impecable y trato de 10 en Barcelona." },
  { name: "Laura G.", rating: 5, text: "Me hice el microdermal y el septum con Jim. Cero dolor y curación perfecta siguiendo su guía." },
  { name: "Dani R.", rating: 5, text: "Diseño 100% personalizado. Captó mi idea al instante y el resultado superó lo que imaginaba." },
  { name: "Carla M.", rating: 5, text: "Estudio súper limpio, materiales estériles abiertos frente a ti. Total confianza." }
];

let reviewsList = JSON.parse(localStorage.getItem("jimtattoo_reviews")) || defaultReviews;
let currentReviewIndex = 0;

const reviewsContainer = document.getElementById("reviews-container");
const btnPrev = document.getElementById("prev-review");
const btnNext = document.getElementById("next-review");
const btnToggleForm = document.getElementById("toggle-review-form");
const reviewForm = document.getElementById("review-form");

function renderReviews() {
  if (!reviewsContainer) return;
  reviewsContainer.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const item = reviewsList[(currentReviewIndex + i) % reviewsList.length];
    const stars = "⭐".repeat(Number(item.rating) || 5);
    const bubble = document.createElement("article");
    bubble.className = "review-bubble";
    bubble.innerHTML = `
      <h4>${item.name}</h4>
      <div class="review-stars">${stars}</div>
      <p>"${item.text}"</p>
    `;
    reviewsContainer.appendChild(bubble);
  }
}

async function loadFirebaseReviews() {
  if (!firebaseReady || !db) return;
  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const remote = [];
      snapshot.forEach((doc) => remote.push(doc.data()));
      reviewsList = [...remote, ...defaultReviews];
      renderReviews();
    }
  } catch (err) {
    console.warn("Usando reseñas locales mientras se configura Firebase:", err);
  }
}

if (reviewsContainer) {
  renderReviews();
  loadFirebaseReviews();

  btnPrev?.addEventListener("click", () => {
    currentReviewIndex = (currentReviewIndex - 1 + reviewsList.length) % reviewsList.length;
    renderReviews();
  });

  btnNext?.addEventListener("click", () => {
    currentReviewIndex = (currentReviewIndex + 1) % reviewsList.length;
    renderReviews();
  });

  btnToggleForm?.addEventListener("click", () => {
    reviewForm.classList.toggle("hidden");
  });

  reviewForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newReview = {
      name: document.getElementById("review-name").value.trim(),
      rating: Number(document.getElementById("review-rating").value),
      text: document.getElementById("review-text").value.trim(),
      createdAt: Date.now()
    };

    reviewsList.unshift(newReview);
    localStorage.setItem("jimtattoo_reviews", JSON.stringify(reviewsList));
    currentReviewIndex = 0;
    renderReviews();
    reviewForm.reset();
    reviewForm.classList.add("hidden");

    if (firebaseReady && db) {
      try {
        await addDoc(collection(db, "reviews"), newReview);
      } catch (err) {
        console.error("Error al guardar en Firebase:", err);
      }
    }
  });
}
const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItems = document.querySelectorAll(".gallery-item");

if (filterButtons.length > 0 && galleryItems.length > 0) {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      const filterValue = btn.getAttribute("data-filter");
      galleryItems.forEach((item) => {
        const category = item.getAttribute("data-category");
        if (filterValue === "all" || category === filterValue) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });
}

// 4. REPARACIÓN ACTIVA DE IMÁGENES Y DIAGNÓSTICO POR CONSOLA
function verificarYRepararImagenes() {
  const extensiones = [".jpg", ".png", ".jpeg", ".webp", ".AVIF", ".JPG", ".PNG"];

  document.querySelectorAll("img").forEach((img) => {
    let intento = 0;
    const rutaOriginal = img.getAttribute("src");
    if (!rutaOriginal) return;

    const rutaBase = rutaOriginal.replace(/\.(avif|jpg|png|jpeg|webp)$/i, "");

    const probarSiguiente = () => {
      if (intento < extensiones.length) {
        const nuevaRuta = rutaBase + extensiones[intento];
        console.log(`Probando formato alternativo para imagen: ${nuevaRuta}`);
        intento++;
        img.src = nuevaRuta;
      } else {
        console.warn(`No se encontró el archivo de imagen en: ${rutaBase}`);
      }
    };

    img.addEventListener("error", probarSiguiente);

    // Si la imagen ya falló antes de que cargara el módulo JS, lanza el reemplazo
    if (img.complete && img.naturalWidth === 0) {
      probarSiguiente();
    }
  });
}

verificarYRepararImagenes();
// ============================================================================
// 5. MOTOR DEL QUIZ INTERACTIVO -> RESERVA SIN FRICCIÓN EN WHATSAPP
// ============================================================================
const quizGroups = document.querySelectorAll(".quiz-options");
const btnQuizWhatsapp = document.getElementById("btn-quiz-whatsapp");

if (quizGroups.length > 0 && btnQuizWhatsapp) {
  quizGroups.forEach((group) => {
    const chips = group.querySelectorAll(".quiz-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("selected"));
        chip.classList.add("selected");
      });
    });
  });

  btnQuizWhatsapp.addEventListener("click", () => {
    const estilo = document.querySelector('[data-quiz-group="estilo"] .selected')?.dataset.value || "Blackwork";
    const zona = document.querySelector('[data-quiz-group="zona"] .selected')?.dataset.value || "Brazo";
    const tamano = document.querySelector('[data-quiz-group="tamano"] .selected')?.dataset.value || "Mediano";

    const mensaje = `¡Hola Jim! Vengo de jimtattoo.ink 🔥 Quiero cotizar una idea:\n• Estilo: ${estilo}\n• Zona: ${zona}\n• Tamaño: ${tamano}\n¿Qué disponibilidad tienes?`;
    const url = `https://wa.me/34615796188?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}