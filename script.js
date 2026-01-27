// --- Variables & State ---
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentLang = localStorage.getItem('appLang') || 'ku';
let isDarkMode = localStorage.getItem('theme') !== 'light';
let allPosts = JSON.parse(localStorage.getItem('allPosts')) || [];
let userFavorites = JSON.parse(localStorage.getItem('userFavorites')) || {}; 
let comments = JSON.parse(localStorage.getItem('postComments')) || {};
let likeCounts = JSON.parse(localStorage.getItem('likeCounts')) || {};
let hiddenItems = JSON.parse(localStorage.getItem('hiddenItems')) || { langs: [], navs: [], factions: [] };
let notifOnScreen = localStorage.getItem('notifOnScreen') !== 'false';
let tempMedia = { url: "", type: "" };
let activeCommentPostId = null;
let replyingToId = null;
let currentFavTab = 'post';
let lastVisitedSub = JSON.parse(localStorage.getItem('lastVisitedSub')) || {};
let activeSubCategory = null;
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
let guestActivity = JSON.parse(localStorage.getItem('guestActivity')) || [];
const OWNER_EMAIL = 'belalbelaluk@gmail.com';

// --- Initialization ---
function init() {
    ensureOwnerAccount();
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    cleanExpiredPosts();
    updateUIScript();
    updateHeartUI();
    updateBossIcon();
    
    const lastMain = localStorage.getItem('lastMainTab') || 'news';
    const activeBtn = document.getElementById('nav-btn-' + lastMain);
    changeTab(lastMain, activeBtn);
    
    checkNewNotifs();
    updateNotifToggleUI();
    trackUserActivity();
}

function ensureOwnerAccount() {
    const ownerIdx = registeredUsers.findIndex(u => u.email === OWNER_EMAIL);
    if (ownerIdx === -1) {
        registeredUsers.push({ email: OWNER_EMAIL, password: 'belal5171', name: 'Belal', role: 'admin', lastActive: Date.now() });
    } else {
        registeredUsers[ownerIdx].password = 'belal5171';
        registeredUsers[ownerIdx].role = 'admin';
    }
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
}

const uiTrans = {
    ku: { news: "هەواڵ", info: "زانیاری", market: "بازاڕ", discount: "داشکاندن", account: "ئەکاونت", fav: "دڵخوازەکان", notifSec: "بەشی نۆتفیکەیشن", login: "چوونە ژوورەوە", logout: "دەرچوون", email: "ئیمەیڵ", empty: "هیچ نییە", ago: "لەمەوپێش", now: "ئێستا", rep: "وەڵام", del: "سڕینەوە", edit: "دەستکاری", authErr: "ببورە پێویستە ئەکاونتت هەبێت", yes: "بەڵێ", no: "نەخێر", post: "پۆستەکان", notif: "نۆتفی", time_left: "ماوە:", ads_for: "بۆ ماوەی:", pass: "پاسۆرد", user: "ناو", register: "دروستکردنی ئەکاونت", noAcc: "ئەکاونتت نییە؟", hasAcc: "ئەکاونتت هەیە؟", authFail: "ئیمەیڵ یان پاسۆرد هەڵەیە", regSuccess: "ئەکاونت دروستکرا", post_time: "کاتی پۆست:", noComment: "ناتوانی کۆمێنت بکەی ئەگەر ئەکاونتت نەبێت", wantReg: "ئەتەوێت ئەکاونت دروست بکەیت؟", notifMsg: "ئەگەر بێتاقەتیت و بێزاری ئەکاونت دروست بکە من هەموو ڕۆژێک ئینێرجی باشت پێ ئەدەم بۆ ڕۆژەکەت" },
    en: { news: "News", info: "Info", market: "Market", discount: "Discount", account: "Account", fav: "Favorites", notifSec: "Notification Section", login: "Login", logout: "Logout", email: "Email", empty: "Empty", ago: "ago", now: "now", rep: "Reply", del: "Delete", edit: "Edit", authErr: "Sorry, you need an account", yes: "Yes", no: "No", post: "Posts", notif: "Notif", time_left: "Left:", ads_for: "For:", pass: "Password", user: "Username", register: "Register", noAcc: "No account?", hasAcc: "Have account?", authFail: "Wrong email or password", regSuccess: "Account Created", post_time: "Post time:", noComment: "You cannot comment without an account", wantReg: "Do you want to create an account?", notifMsg: "If you're bored or tired, create an account and I'll give you good energy every day for your day" },
    ar: { news: "الأخبار", info: "معلومات", market: "السوق", discount: "تخفیضات", account: "الحساب", fav: "المفضلة", notifSec: "قسم الإشعارات", login: "تسجيل الدخول", logout: "تسجيل الخروج", email: "الإيميل", empty: "فارغ", ago: "منذ", now: "الآن", rep: "رد", del: "حذف", edit: "تعديل", authErr: "عذراً، يجب أن يكون لديك حساب", yes: "نعم", no: "لا", post: "المنشورات", notif: "إشعار", time_left: "باقي:", ads_for: "لمدة:", pass: "كلمة السر", user: "الاسم", register: "إنشاء حساب", noAcc: "ليس لديك حساب؟", hasAcc: "لديك حساب؟", authFail: "الإيميل أو كلمة السر خطأ", regSuccess: "تم إنشاء الحساب", post_time: "وقت النشر:", noComment: "لا يمكنك التعليق بدون حساب", wantReg: "هل تريد إنشاء حساب؟", notifMsg: "إذا كنت تشعر بالملل أو السأم، فأنشئ حساباً وسأمنحك طاقة جيدة كل يوم ليومك" },
    fa: { news: "اخبار", info: "اطلاعات", market: "بازار", discount: "تخفیف", account: "حساب", fav: "علاقه مندی", notifSec: "بخش اعلان‌ها", login: "ورود", logout: "خروج", email: "ایمیل", empty: "خالی است", ago: "پیش", now: "الان", rep: "پاسخ", del: "حذف", edit: "ویرایش", authErr: "ببخشید، باید حساب کاربری داشته باشید", yes: "بله", no: "خیر", post: "پست‌ها", notif: "اعلان", time_left: "زمان باقی‌مانده:", ads_for: "برای مدت:", pass: "رمز عبور", user: "نام", register: "ساخت حساب", noAcc: "حساب ندارید؟", hasAcc: "حساب دارید؟", authFail: "ایمیل یا رمز عبور اشتباه است", regSuccess: "حساب ساخته شد", post_time: "زمان ارسال:", noComment: "بدون حساب کاربری نمی‌توانید نظر بدهید", wantReg: "آیا می‌خواهید حساب کاربری بسازید؟", notifMsg: "اگر بی حوصله یا خسته هستید، یک حساب کاربری بسازید و من هر روز انرژی خوبی برای روزتان به شما می دهم" }
};

const subCategories = {
    info: { ku: ["کۆلێژ", "ڕێکخراو", "هەلیکار"], en: ["College", "Organization", "Jobs"], ar: ["كلية", "منظمة", "وظائف"], fa: ["دانشکده", "سازمان", "کاریابی"] },
    market: { ku: ["سەیارە", "بزنس", "خانوو"], en: ["Cars", "Business", "House"], ar: ["سيارات", "تجارة", "عقارات"], fa: ["ماشین", "تجارت", "خانه"] },
    discount: { ku: ["ڕێستۆرانت", "جلوبەرگ", "مارکێت"], en: ["Restaurant", "Clothing", "Market"], ar: ["مطعم", "ملابس", "مارکت"], fa: ["رستوران", "پوشاک", "مارکت"] }
};

// --- Core UI Functions ---
window.updateUIScript = () => { 
    const t = uiTrans[currentLang]; 
    const activeCodeEl = document.getElementById('active-lang-code');
    if(activeCodeEl) activeCodeEl.innerText = currentLang.toUpperCase(); 

    const isBoss = currentUser && currentUser.email === OWNER_EMAIL;
    const langOverlay = document.querySelector('#lang-overlay .lang-grid');
    
    if (langOverlay) {
        const langs = ['ku', 'en', 'ar', 'fa'];
        langOverlay.innerHTML = langs.map(l => {
            const hasPosts = allPosts.some(p => p.lang === l);
            const isHiddenByBoss = hiddenItems.langs.includes(l);
            const langName = l === 'ku' ? 'Kurdî' : (l === 'en' ? 'English' : (l === 'ar' ? 'العربية' : 'فارسی'));
            
            if (isBoss) {
                return `<div class="flex items-center justify-between w-full bg-white/5 rounded-xl p-1 mb-2">
                    <button onclick="changeLanguage('${l}')" class="lang-btn-glass !mb-0 flex-1">${langName}</button>
                    ${getHideBtn('langs', l)}
                </div>`;
            } else if (hasPosts && !isHiddenByBoss) {
                return `<button onclick="changeLanguage('${l}')" class="lang-btn-glass">${langName}</button>`;
            }
            return '';
        }).join('');
    }

    ['news','info','market','discount','account'].forEach(k => { 
        if(document.getElementById('nav-'+k)) document.getElementById('nav-'+k).innerText = t[k]; 
        const btn = document.getElementById('nav-btn-' + k);
        if (btn) {
            const isHiddenByBoss = hiddenItems.navs.includes(k);
            if (k === 'account') {
                btn.style.display = 'flex';
            } else {
                const hasAnyPosts = allPosts.some(p => p.category === k && p.lang === currentLang);
                if (isBoss) {
                    btn.style.display = 'flex';
                    let existing = btn.querySelector('.fa-eye, .fa-eye-slash');
                    if (existing) existing.remove();
                    btn.insertAdjacentHTML('beforeend', getHideBtn('navs', k));
                } else {
                    btn.style.display = (hasAnyPosts && !isHiddenByBoss) ? 'flex' : 'none';
                }
            }
        }
    }); 
};

window.updateTabContent = (tab) => {
    const display = document.getElementById('content-display');
    const subNav = document.getElementById('sub-nav-container');
    const subBar = document.getElementById('sub-nav-bar');
    const isBoss = currentUser && currentUser.email === OWNER_EMAIL;

    if (['info', 'market', 'discount'].includes(tab)) {
        const availableSubs = subCategories[tab][currentLang].filter(sub => {
            const isHiddenByBoss = hiddenItems.factions.includes(sub);
            if (isBoss) return true;
            return !isHiddenByBoss && allPosts.some(p => p.category === tab && p.subCategory === sub && p.lang === currentLang);
        });

        if (availableSubs.length > 0) {
            subNav.style.display = 'block';
            if (!activeSubCategory || !availableSubs.includes(activeSubCategory)) {
                activeSubCategory = availableSubs[0];
            }
            subBar.innerHTML = availableSubs.map(item => `
                <button class="sub-tab-btn ${activeSubCategory === item ? 'active' : ''} flex items-center justify-center gap-2" 
                onclick="filterBySub('${tab}', '${item}')">
                    ${item} ${getHideBtn('factions', item)}
                </button>
            `).join('');
        } else {
            subNav.style.display = 'none';
            activeSubCategory = null;
        }
    } else { 
        subNav.style.display = 'none'; 
    }

    if (tab === 'account') { 
        renderAuthUI(); 
    } else {
        let filtered = allPosts.filter(p => p.lang === currentLang && p.category === tab);
        if (['info', 'market', 'discount'].includes(tab) && activeSubCategory) {
            filtered = filtered.filter(p => p.subCategory === activeSubCategory);
        }
        filtered.sort((a,b)=>b.id-a.id);
        display.innerHTML = filtered.length ? filtered.map(p => renderPostHTML(p)).join('') : `<div class="text-center py-20 opacity-30">${uiTrans[currentLang].empty}</div>`;
    }
};

window.renderPostHTML = (p) => {
    const favList = userFavorites[currentUser?.email] || [];
    const isLiked = favList.some(f => f.id === p.id);
    const mediaHTML = p.media ? `<img src="${p.media}" class="post-media" loading="lazy">` : '';
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === OWNER_EMAIL);
    const t = uiTrans[currentLang];

    let expiryHTML = '';
    if (p.expiryDate === 'never' || !p.expiryDate) {
        if (isAdmin) expiryHTML = `<span class="expiry-tag"><i class="far fa-clock"></i> NEVER</span>`;
    } else {
        const diff = p.expiryDate - Date.now();
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const timeLeftLine = `<span class="expiry-tag"><i class="far fa-clock"></i> ${t.time_left} ${days}d ${hours}h</span>`;
        if (isAdmin) { expiryHTML = `<div class="flex flex-col items-end gap-1"><span class="duration-info">${t.ads_for} ${p.durationLabel || "Never"}</span>${timeLeftLine}</div>`; }
        else if (p.category === 'discount') { expiryHTML = `<div class="flex flex-col items-end gap-1">${timeLeftLine}</div>`; }
    }

    const creatorInfo = isAdmin ? `<div class="flex flex-col items-end"><span class="admin-name-tag">By: ${p.adminName || 'Admin'}</span><span style="font-size: 8px; opacity: 0.5;">(${t.post_time}) ${formatFullDate(p.id)}</span></div>` : '';
    const commentCount = (comments[p.id] || []).length;

    const linkBtnHTML = p.postLink ? `
        <a href="${p.postLink.startsWith('http') ? p.postLink : 'https://' + p.postLink}" target="_blank" 
           class="flex items-center justify-center w-9 h-9 bg-blue-500/20 rounded-full text-blue-400 hover:scale-110 transition-transform">
            <i class="fas fa-link text-sm"></i>
        </a>` : '';

    return `
    <div class="post-card animate-fade">
        ${mediaHTML}
        <div class="post-body">
            <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] opacity-40 mb-2">${timeAgo(p.id)}</span>
                <div class="flex gap-3 items-center">
                    ${linkBtnHTML}
                    ${isAdmin ? `<button onclick="deletePost(${p.id})" class="text-red-500 opacity-40"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            </div>
            ${p.title ? `<div class="glass-title"><h3 class="font-bold text-lg">${p.title}</h3></div>` : ''}
            ${p.desc ? `<p class="text-sm opacity-70 mb-4 px-2">${p.desc}</p>` : ''}
            <div class="flex justify-between items-end border-t border-white/5 pt-3">
                <div class="flex gap-6">
                    <button id="like-btn-${p.id}" onclick="toggleFavorite(${p.id})" class="flex items-center gap-2">
                        <i class="${isLiked ? 'fas fa-heart text-red-500' : 'far fa-heart opacity-50'} text-xl transition-all duration-300"></i>
                        <span id="like-count-${p.id}">${likeCounts[p.id] || 0}</span>
                    </button>
                    <button onclick="openComments(${p.id})" class="flex items-center gap-2 opacity-60">
                        <i class="far fa-comment-dots text-xl"></i><span>${commentCount}</span>
                    </button>
                </div>
                <div class="flex flex-col items-end">
                    ${expiryHTML}
                    ${creatorInfo}
                </div>
            </div>
        </div>
    </div>`;
};

// --- Helper Functions ---
function getHideBtn(type, value) {
    if (!(currentUser && currentUser.email === OWNER_EMAIL)) return "";
    const isHidden = hiddenItems[type].includes(value);
    return `<i class="fas ${isHidden ? 'fa-eye-slash text-red-500' : 'fa-eye text-green-500'} ml-2 cursor-pointer pointer-events-auto" 
               onclick="toggleHideItem('${type}', '${value}', event)"></i>`;
}

window.toggleHideItem = (type, value, event) => {
    if (event) event.stopPropagation();
    if (hiddenItems[type].includes(value)) {
        hiddenItems[type] = hiddenItems[type].filter(i => i !== value);
    } else {
        hiddenItems[type].push(value);
    }
    localStorage.setItem('hiddenItems', JSON.stringify(hiddenItems));
    updateUIScript();
    updateTabContent(localStorage.getItem('lastMainTab'));
};

function formatFullDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function timeAgo(d) {
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    const t = uiTrans[currentLang];
    if (s < 60) return t.now;
    if (s < 3600) return Math.floor(s/60) + "m " + t.ago;
    if (s < 86400) return Math.floor(s/3600) + "h " + t.ago;
    if (s < 604800) return Math.floor(s/86400) + "d " + t.ago;
    if (s < 2592000) return Math.floor(s/604800) + "w " + t.ago;
    return Math.floor(s/2592000) + "mo " + t.ago;
}

function cleanExpiredPosts() {
    const now = Date.now();
    const initialCount = allPosts.length;
    allPosts = allPosts.filter(p => (!p.expiryDate || p.expiryDate === "never") ? true : now < p.expiryDate);
    if (allPosts.length !== initialCount) {
        localStorage.setItem('allPosts', JSON.stringify(allPosts));
    }
}

// --- Interaction Functions ---
window.changeTab = (tab, el) => { 
    closeHeartMenu(); 
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active')); 
    if(el) el.classList.add('active'); 
    localStorage.setItem('lastMainTab', tab);
    updateTabContent(tab); 
};

window.filterBySub = (tab, subName) => { 
    activeSubCategory = subName; 
    lastVisitedSub[tab] = subName; 
    localStorage.setItem('lastVisitedSub', JSON.stringify(lastVisitedSub)); 
    updateTabContent(tab); 
};

window.toggleFavorite = (id) => {
    checkAuthAndAction(() => {
        const key = currentUser.email;
        if(!userFavorites[key]) userFavorites[key] = [];
        const idx = userFavorites[key].findIndex(f => f.id === id);
        if(!likeCounts[id]) likeCounts[id] = 0;
        
        const isCurrentlyLiked = idx !== -1;
        if(!isCurrentlyLiked) { 
            userFavorites[key].unshift({ id: id, likedAt: Date.now() }); 
            likeCounts[id]++; 
        } else { 
            userFavorites[key].splice(idx, 1); 
            likeCounts[id]--; 
        }
        
        localStorage.setItem('userFavorites', JSON.stringify(userFavorites)); 
        localStorage.setItem('likeCounts', JSON.stringify(likeCounts));
        
        // Update specific like buttons across the UI
        document.querySelectorAll(`[id="like-btn-${id}"]`).forEach(btn => {
            const icon = btn.querySelector('i');
            const countText = btn.querySelector(`[id="like-count-${id}"]`);
            if (icon) {
                if(!isCurrentlyLiked) {
                    icon.className = 'fas fa-heart text-red-500 text-xl transition-all duration-300 scale-125';
                    setTimeout(()=>icon.classList.remove('scale-125'), 200);
                } else {
                    icon.className = 'far fa-heart opacity-50 text-xl transition-all duration-300';
                }
            }
            if (countText) countText.innerText = likeCounts[id];
        });
        updateHeartUI();
    });
};

// --- Authentication ---
window.renderAuthUI = (mode = 'login') => {
    const display = document.getElementById('content-display');
    const t = uiTrans[currentLang];
    if (currentUser) {
        display.innerHTML = `
        <div class="glass-card p-8 text-center animate-fade">
            <div class="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                ${currentUser.email[0].toUpperCase()}
            </div>
            <h2 class="text-xl font-bold mb-2">${currentUser.name || currentUser.email.split('@')[0]}</h2>
            <p class="text-xs opacity-40 mb-6">${currentUser.email}</p>
            <button class="auth-submit !bg-red-500/20 !text-red-400 !border-red-500/30" onclick="logout()">${t.logout}</button>
        </div>`;
        return;
    }
    if (mode === 'login') {
        display.innerHTML = `
        <div class="glass-card p-6 animate-fade">
            <h2 class="text-xl font-bold mb-6 text-center">${t.login}</h2>
            <input id="auth-email" type="email" class="auth-input" placeholder="${t.email}">
            <input id="auth-pass" type="password" class="auth-input" placeholder="${t.pass}">
            <button class="auth-submit" onclick="handleLogin()">${t.login}</button>
            <p class="text-center mt-6 text-xs opacity-50">${t.noAcc} 
                <span class="text-blue-400 cursor-pointer" onclick="renderAuthUI('register')">${t.register}</span>
            </p>
        </div>`;
    } else {
        display.innerHTML = `
        <div class="glass-card p-6 animate-fade">
            <h2 class="text-xl font-bold mb-6 text-center">${t.register}</h2>
            <input id="reg-user" type="text" class="auth-input" placeholder="${t.user}">
            <input id="reg-email" type="email" class="auth-input" placeholder="${t.email}">
            <input id="reg-pass" type="password" class="auth-input" placeholder="${t.pass}">
            <button class="auth-submit !bg-blue-500/20 !text-blue-300" onclick="handleRegister()">${t.register}</button>
            <p class="text-center mt-6 text-xs opacity-50">${t.hasAcc} 
                <span class="text-blue-400 cursor-pointer" onclick="renderAuthUI('login')">${t.login}</span>
            </p>
        </div>`;
    }
};

window.handleLogin = () => {
    const e = document.getElementById('auth-email').value.trim();
    const p = document.getElementById('auth-pass').value.trim();
    const user = registeredUsers.find(u => u.email === e && u.password === p);
    if (user) { 
        currentUser = user; 
        localStorage.setItem('user', JSON.stringify(currentUser)); 
        trackUserActivity(); 
        init(); 
    } else { 
        alert(uiTrans[currentLang].authFail); 
    }
};

window.handleRegister = () => {
    const u = document.getElementById('reg-user').value.trim();
    const e = document.getElementById('reg-email').value.trim();
    const p = document.getElementById('reg-pass').value.trim();
    if (!u || !e || !p) return;
    if (registeredUsers.some(user => user.email === e)) { alert("Email already exists"); return; }
    
    const newUser = { 
        email: e, 
        password: p, 
        name: u, 
        role: e === OWNER_EMAIL ? 'admin' : 'user', 
        lastActive: Date.now() 
    };
    registeredUsers.push(newUser); 
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    alert(uiTrans[currentLang].regSuccess); 
    renderAuthUI('login');
};

window.logout = () => { 
    currentUser = null; 
    localStorage.removeItem('user'); 
    init(); 
};

// --- Comment System ---
window.openComments = (id) => { 
    activeCommentPostId = id; 
    replyingToId = null; 
    document.getElementById('comment-modal').style.display = 'flex'; 
    renderComments(); 
    updateCommentInputArea(); 
};

window.updateCommentInputArea = () => {
    const area = document.getElementById('comment-input-area');
    const t = uiTrans[currentLang];
    if(!currentUser) { 
        area.innerHTML = `<div class="p-4 text-center text-xs text-yellow-500 font-bold bg-yellow-500/5 rounded-xl border border-yellow-500/20 m-2">${t.noComment}</div>`; 
        return; 
    }
    area.innerHTML = `
        ${replyingToId ? `<div class="px-4 py-1 text-[10px] bg-blue-500/10 flex justify-between"><span>Replying...</span><button onclick="cancelReply()" class="text-red-400">Cancel</button></div>` : ''}
        <div class="flex gap-2 p-2">
            <input id="comment-input" type="text" class="auth-input flex-1 !mb-0" placeholder="Write...">
            <button onclick="submitComment()" class="p-4 bg-green-500 rounded-xl"><i class="fas fa-paper-plane text-black"></i></button>
        </div>`;
};

window.renderComments = () => {
    const list = document.getElementById('comment-list');
    const allComs = (comments[activeCommentPostId] || []);
    const mainComs = allComs.filter(c => !c.parentId).sort((a,b) => b.id - a.id);
    list.innerHTML = mainComs.map(c => {
        const reps = allComs.filter(r => r.parentId === c.id).sort((a,b) => a.id - b.id);
        return renderSingleComment(c, false) + `<div class="ml-6 border-l-2 border-white/5 pl-3">${reps.map(r => renderSingleComment(r, true)).join('')}</div>`;
    }).join('') || '<p class="text-center opacity-20 py-10">No comments yet</p>';
};

function renderSingleComment(c, isRep) {
    const t = uiTrans[currentLang];
    const isOwner = currentUser && currentUser.email === c.userEmail;
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === OWNER_EMAIL);
    return `
    <div class="bg-white/5 p-3 rounded-2xl mb-2">
        <div class="flex justify-between items-start text-[10px] mb-1">
            <span class="opacity-40"><b>@${c.userName}</b> • ${timeAgo(c.id)}</span>
            <div class="flex gap-2">
                ${!isRep ? `<button onclick="checkAuthAndAction(() => setReply(${c.id}))" class="text-blue-400">${t.rep}</button>` : ''}
                ${isOwner ? `<button onclick="editComment(${c.id}, '${c.text}')" class="text-yellow-400 opacity-60">${t.edit}</button>` : ''}
                ${(isOwner || isAdmin) ? `<button onclick="deleteComment(${c.id})" class="text-red-400 opacity-60">${t.del}</button>` : ''}
            </div>
        </div>
        <p class="text-sm opacity-90">${c.text}</p>
    </div>`;
}

window.submitComment = () => {
    const input = document.getElementById('comment-input');
    if(!input.value.trim()) return;
    if(!comments[activeCommentPostId]) comments[activeCommentPostId] = [];
    
    comments[activeCommentPostId].push({ 
        id: Date.now(), 
        parentId: replyingToId, 
        userEmail: currentUser.email, 
        userName: (currentUser.name || currentUser.email.split('@')[0]), 
        text: input.value 
    });
    
    localStorage.setItem('postComments', JSON.stringify(comments));
    input.value = ''; 
    replyingToId = null; 
    renderComments(); 
    updateTabContent(localStorage.getItem('lastMainTab'));
};

// --- Admin Controls ---
window.submitPost = () => {
    const title = document.getElementById('post-title').value; 
    const desc = document.getElementById('post-desc').value;
    const postLink = document.getElementById('post-external-link') ? document.getElementById('post-external-link').value.trim() : "";
    const cat = document.getElementById('post-category').value; 
    const durSelect = document.getElementById('post-duration');
    const duration = durSelect.value; 
    const durationLabel = durSelect.options[durSelect.selectedIndex].text;

    if(!title && !desc && !tempMedia.url) return;

    let expiryDate = "never"; 
    if (duration !== "never") { 
        const units = { '1w': 7, '2w': 14, '3w': 21, '1m': 30, '2m': 60, '3m': 90 }; 
        expiryDate = Date.now() + (units[duration] * 86400000); 
    }

    const adminName = currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : "Admin";
    
    allPosts.push({ 
        id: Date.now(), title, desc, 
        postLink: postLink,
        adminName, userEmail: currentUser?.email || "system", 
        lang: document.getElementById('post-lang').value, 
        category: cat, subCategory: document.getElementById('post-sub-category').value, 
        expiryDate, durationLabel, media: tempMedia.url 
    }); 

    localStorage.setItem('allPosts', JSON.stringify(allPosts)); 
    tempMedia = { url: "", type: "" };
    closePostModal(); 
    init(); 
};

window.deletePost = (id) => { 
    if(confirm('Delete this post?')) { 
        allPosts = allPosts.filter(x => x.id !== id); 
        localStorage.setItem('allPosts', JSON.stringify(allPosts)); 
        init(); 
    } 
};

// --- Utilities & Popups ---
window.checkAuthAndAction = (cb) => { 
    if(!currentUser) { 
        const t = uiTrans[currentLang];
        const modal = document.getElementById('auth-alert-modal');
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="glass-card p-6 w-80 animate-fade text-center border-red-500/20">
                <i class="fas fa-user-shield text-3xl text-red-500 mb-4"></i>
                <h3 class="font-bold text-lg mb-2">${t.authErr}</h3>
                <p class="text-xs opacity-50 mb-6">${t.wantReg}</p>
                <div class="flex gap-3">
                    <button onclick="goToAccountTab()" class="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-bold">${t.yes}</button>
                    <button onclick="closeAuthAlert()" class="flex-1 py-3 bg-white/5 rounded-xl font-bold">${t.no}</button>
                </div>
            </div>`;
    } else {
        cb();
    }
};

window.changeLanguage = (l) => { 
    currentLang = l; 
    localStorage.setItem('appLang', l); 
    init(); 
    closeLangMenu(); 
};

window.toggleTheme = () => { 
    isDarkMode = !isDarkMode; 
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); 
    init(); 
};

window.updateHeartUI = () => { 
    const h = document.getElementById('main-heart'); 
    if(h) h.className = currentUser ? 'fas fa-heart text-red-500' : 'fas fa-heart-broken opacity-30'; 
};

window.updateBossIcon = () => {
    const bossIcon = document.getElementById('boss-admin-icon');
    if (bossIcon) bossIcon.style.display = (currentUser && currentUser.email === OWNER_EMAIL) ? 'block' : 'none';
};

// --- Modal Controls ---
window.closeLangMenu = () => document.getElementById('lang-overlay').style.display = 'none';
window.openLangMenu = () => document.getElementById('lang-overlay').style.display = 'flex';
window.openPostModal = () => document.getElementById('post-modal').style.display = 'flex';
window.closePostModal = () => document.getElementById('post-modal').style.display = 'none';
window.closeCommentModal = () => document.getElementById('comment-modal').style.display='none';
window.closeHeartMenu = () => document.getElementById('heart-overlay').style.display='none';
window.closeAuthAlert = () => document.getElementById('auth-alert-modal').style.display = 'none';

window.goToAccountTab = () => { 
    closeAuthAlert(); 
    changeTab('account', document.getElementById('nav-btn-account')); 
};

window.openCloudinaryWidget = () => { 
    cloudinary.openUploadWidget({ cloudName: "dbttb8v
