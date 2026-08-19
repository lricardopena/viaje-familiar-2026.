/*!
 * auth.js — capa temporal de autenticación para el sitio del viaje familiar.
 *
 * Objetivo: evitar acceso casual al enlace público de GitHub Pages durante
 * el viaje. NO es seguridad fuerte (sitio 100% estático, sin backend): solo
 * eleva el costo de un vistazo casual, no de un ataque dirigido.
 *
 * Cómo funciona:
 *  - Verifica credenciales con PBKDF2-SHA256 (Web Crypto API) contra un
 *    "verifier" público derivado de usuario+"\0"+contraseña. Ni el usuario
 *    ni la contraseña originales se guardan nunca — solo salt/iterations/
 *    verifier, que son seguros de publicar.
 *  - Guarda solo el ESTADO de sesión en localStorage (autenticado + fecha
 *    de expiración), bajo AUTH_CONFIG.storageKey. Compartido entre
 *    index.html y storyland.html porque ambos cargan este mismo archivo.
 *  - Antes de decidir si hay sesión válida, auth.css oculta todo lo
 *    marcado como "protected-content" — así se evita el flash del
 *    itinerario mientras este script arranca.
 *
 * Cómo retirarlo después del viaje (dos opciones, ver CLAUDE.md/handover):
 *   Opción A (reversible):  cambia AUTH_CONFIG.enabled a false más abajo.
 *   Opción B (definitiva):  borra <script src="auth.js"> y
 *     <link ... href="auth.css"> de cada página protegida. El resto de la
 *     app (itinerario, Story Land, mapas, checklist) no depende de este
 *     archivo en absoluto.
 *
 * Cómo regenerar las credenciales: usa tools/generate-auth-verifier.html
 * (herramienta local, no se ejecuta en producción) para producir un nuevo
 * salt/verifier y reemplaza los valores de AUTH_CONFIG abajo. Nunca
 * codifiques el usuario o la contraseña originales aquí.
 */
(function () {
  'use strict';

  // ---- Configuración centralizada ----------------------------------------
  // salt / verifier son público-seguros: no permiten recuperar la
  // contraseña original, solo verificarla (con costo PBKDF2 alto si alguien
  // intenta forzarla offline). Generados con tools/generate-auth-verifier.html.
  const AUTH_CONFIG = {
    enabled: true, // kill switch: false = sitio abierto de inmediato, sin login
    iterations: 400000, // PBKDF2-SHA256
    salt: 'REEMPLAZA_CON_SALT_BASE64_DE_LA_HERRAMIENTA',
    verifier: 'REEMPLAZA_CON_VERIFIER_BASE64_DE_LA_HERRAMIENTA',
    sessionDurationHours: 24,
    storageKey: 'viaje2026_auth_session'
  };

  const root = document.documentElement;

  // Kill switch: con enabled=false no se ejecuta ninguna lógica de auth,
  // el sitio queda visible de inmediato y sin bloquear navegación.
  if (!AUTH_CONFIG.enabled) {
    root.classList.add('auth-ok');
    window.AuthModule = { logout: function () {} };
    return;
  }

  // ---- Sesión (solo estado, nunca credenciales) --------------------------
  function readSession() {
    let raw;
    try {
      raw = localStorage.getItem(AUTH_CONFIG.storageKey);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    let s;
    try {
      s = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    if (!s || s.authenticated !== true || typeof s.expiresAt !== 'number') return null;
    if (Date.now() >= s.expiresAt) {
      try { localStorage.removeItem(AUTH_CONFIG.storageKey); } catch (e) {}
      return null;
    }
    return s;
  }

  function writeSession() {
    const expiresAt = Date.now() + AUTH_CONFIG.sessionDurationHours * 3600 * 1000;
    try {
      localStorage.setItem(
        AUTH_CONFIG.storageKey,
        JSON.stringify({ authenticated: true, expiresAt: expiresAt })
      );
    } catch (e) {
      // localStorage no disponible (modo privado agresivo, cuota, etc.):
      // la sesión simplemente no persistirá entre recargas.
    }
  }

  function clearSession() {
    try { localStorage.removeItem(AUTH_CONFIG.storageKey); } catch (e) {}
  }

  // ---- Verificación de credenciales (PBKDF2-SHA256) -----------------------
  function base64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function bytesToBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async function deriveVerifier(username, password) {
    const enc = new TextEncoder();
    const salt = base64ToBytes(AUTH_CONFIG.salt);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(username + '\0' + password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: AUTH_CONFIG.iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  // Comparación de longitud fija (el verifier siempre mide lo mismo en
  // base64); no aporta seguridad extra frente a un atacante con acceso al
  // código fuente, pero evita comparaciones de string "obvias" gratis.
  function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  // ---- Arranque: decide visibilidad ANTES de pintar contenido ------------
  const initialSession = readSession();
  if (initialSession) {
    root.classList.add('auth-ok');
  }

  // ---- Pantalla de login (solo se construye si hace falta) ---------------
  function buildLoginScreen() {
    if (document.getElementById('authOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.className = 'auth-overlay';
    overlay.innerHTML =
      '<form class="auth-card" id="authForm" autocomplete="off">' +
        '<div class="auth-lock">🔐</div>' +
        '<h1>Viaje Familiar 2026</h1>' +
        '<p class="auth-sub">Sitio temporalmente privado durante el viaje</p>' +
        '<label class="auth-label" for="authUser">Usuario</label>' +
        '<input class="auth-input" id="authUser" name="username" type="text" ' +
          'autocomplete="username" autocapitalize="off" spellcheck="false" required>' +
        '<label class="auth-label" for="authPass">Contraseña</label>' +
        '<div class="auth-pwrow">' +
          '<input class="auth-input" id="authPass" name="password" type="password" ' +
            'autocomplete="current-password" required>' +
          '<button type="button" class="auth-eye" id="authEye" aria-label="Mostrar u ocultar contraseña">👁️</button>' +
        '</div>' +
        '<button type="submit" class="auth-submit" id="authSubmit">ENTRAR</button>' +
        '<p class="auth-error" id="authError" role="alert" aria-live="polite"></p>' +
        '<p class="auth-note">Esta protección se retirará después del viaje.</p>' +
      '</form>';
    document.body.appendChild(overlay);

    const form = overlay.querySelector('#authForm');
    const userInput = overlay.querySelector('#authUser');
    const passInput = overlay.querySelector('#authPass');
    const eyeBtn = overlay.querySelector('#authEye');
    const errorEl = overlay.querySelector('#authError');
    const submitBtn = overlay.querySelector('#authSubmit');

    eyeBtn.addEventListener('click', function () {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      errorEl.textContent = '';
      const username = userInput.value;
      const password = passInput.value;
      if (!username || !password) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando…';

      deriveVerifier(username, password)
        .then(function (candidate) {
          if (safeEqual(candidate, AUTH_CONFIG.verifier)) {
            writeSession();
            passInput.value = '';
            overlay.remove();
            root.classList.add('auth-ok');
            injectLogoutButton();
          } else {
            errorEl.textContent = 'Usuario o contraseña incorrectos';
            passInput.value = '';
            passInput.focus();
          }
        })
        .catch(function () {
          // Nunca se exponen detalles criptográficos ni se registra nada
          // sensible en consola — mensaje genérico también en caso de error.
          errorEl.textContent = 'Usuario o contraseña incorrectos';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ENTRAR';
        });
    });

    window.setTimeout(function () { userInput.focus(); }, 0);
  }

  // ---- Botón discreto de logout -------------------------------------------
  function injectLogoutButton() {
    if (document.getElementById('authLogoutBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'authLogoutBtn';
    btn.className = 'auth-logout-btn';
    btn.title = 'Cerrar sesión';
    btn.textContent = '🔒 Cerrar sesión';
    btn.addEventListener('click', function () {
      clearSession(); // solo borra viaje2026_auth_session; no toca Story Land ni checklist
      btn.remove();
      root.classList.remove('auth-ok');
      buildLoginScreen();
    });
    document.body.appendChild(btn);
  }

  function init() {
    if (initialSession) {
      injectLogoutButton();
    } else {
      buildLoginScreen();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Revalida expiración si la pestaña quedó abierta mucho tiempo -------
  function recheck() {
    if (root.classList.contains('auth-ok') && !readSession()) {
      location.reload();
    }
  }
  document.addEventListener('visibilitychange', recheck);
  window.addEventListener('focus', recheck);

  // API mínima expuesta por si alguna página quiere su propio control de
  // logout en vez del botón flotante inyectado arriba.
  window.AuthModule = { logout: function () { clearSession(); location.reload(); } };
})();
