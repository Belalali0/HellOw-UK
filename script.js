// --- Supabase Config ---
const supabaseUrl = 'https://yqjfdtrjngwaoeygeiqh.supabase.co';
const supabaseKey = 'sb_publishable_kR58sr2ch1wun_WmJqmetw_ailryRxc'; 
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- Variables & State ---
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentLang = localStorage.getItem('appLang') || 'ku';
let isDarkMode = localStorage.getItem('theme') !== 'light';
let allPosts = []; 
let userFavorites = JSON.parse(localStorage.getItem('userFavorites')) || {}; 
let comments = {}; 
let likeCounts = {}; 
let hiddenItems = JSON.parse(localStorage.getItem('hiddenItems')) || { langs: [], navs: [], factions: [] };
let notifOnScreen = localStorage.getItem('notifOnScreen') !== 'false';
let tempMedia = { url: "", type: "" };
let activeCommentPostId = null;
let replyingToId = null;
let currentFavTab = 'post';
let lastVisitedSub = JSON.parse(localStorage.getItem('lastVisitedSub')) || {};
let activeSubCategory = null;
let registeredUsers = []; 
const OWNER_EMAIL = 'belalbelaluk@gmail.com';
const OWNER_PASS = 'belal5171';

// --- Functions to Sync with Database ---
async function syncAllData() {
    try {
        const { data: postsData } = await _supabase.from('posts').select('*').order('id', { ascending: false });
        allPosts = postsData || [];

        const { data: comsData } = await _supabase.from('comments').select('*');
        comments = {};
        if (comsData) {
            comsData.forEach(c => {
                if (!comments[c.post_id]) comments[c.post_id] = [];
                comments[c.post_id].push(c);
            });
        }

        const { data: likesData } = await _supabase.from('likes').select('*');
        likeCounts = {};
        if (likesData) {
            likesData.forEach(l => {
                likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
            });
        }

        const { data: usersData } = await _supabase.from('users').select('*');
        registeredUsers = usersData || [];
        
        window.updateUIScript();
        window.updateTabContent(localStorage.getItem('lastMainTab') || 'news');
    } catch (e) { console.error("Sync Error:", e); }
}

const uiTrans = {
    ku: { news: "هەواڵ", info: "زانیاری", market: "بازاڕ", discount: "داشکاندن", account: "ئەکاونت", fav: "دڵخوازەکان", notifSec: "بەشی نۆتفیکەیشن", login: "چوونە ژوورەوە", logout: "دەرچوون", email: "ئیمەیڵ", empty: "هیچ نییە", ago: "لەمەوپێش", now: "ئێستا", rep: "وەڵام", del: "سڕینەوە", edit: "دەستکاری", authErr: "ببورە پێویستە ئەکاونتت هەبێت", yes: "بەڵێ", no: "نەخێر", post: "پۆستەکان", notif: "نۆتفی", time_left: "ماوە:", ads_for: "بۆ ماوەی:", pass: "پاسۆرد", user: "ناو", register: "دروستکردنی ئەکاونت", noAcc: "ئەکاونتت نییە؟", hasAcc: "ئەکاونتت هەیە؟", authFail: "ئیمەیڵ یان پاسۆرد هەڵەیە", regSuccess: "ئەکاونت دروستکرا", post_time: "کاتی پۆست:", noComment: "ببورە ناتوانی پێویستە ئەکاونت دروست بکەیت", wantReg: "ئەتەوێت ئەکاونت دروست بکەیت؟", notifMsg: "ئەگەر بێتاقەتیت و بێزاری ئەکاونت دروست بکە من هەموو ڕۆژێک ئینێرجی باشت پێ ئەدەم بۆ ڕۆژەکەت" },
    en: { news: "News", info: "Info", market: "Market", discount: "Discount", account: "Account", fav: "Favorites", notifSec: "Notification Section", login: "Login", logout: "Logout", email: "Email", empty: "Empty", ago: "ago", now: "now", rep: "Reply", del: "Delete", edit: "Edit", authErr: "Sorry, you need an account", yes: "Yes", no: "No", post: "Posts", notif: "Notif", time_left: "Left:", ads_for: "For:", pass: "Password", user: "Username", register: "Register", noAcc: "No account?", hasAcc: "Have account?", authFail: "Wrong email or password", regSuccess: "Account Created", post_time: "Post time:", noComment: "Sorry, you cannot. You need to create an account", wantReg: "Do you want to create an account?", notifMsg: "If you're bored or tired, create an account and I'll give you good energy every day for your day" },
    ar: { news: "الأخبار", info: "معلومات", market: "السوق", discount: "تخفیضات", account: "الحساب", fav: "المفضلة", notifSec: "قسم الإشعارات", login: "تسجيل الدخول", logout: "تسجيل الخروج", email: "الإيميل", empty: "فارغ", ago: "منذ", now: "الآن", rep: "رد", del: "حذف", edit: "تعديل", authErr: "عذراً، يجب أن يكون لديك حساب", yes: "نعم", no: "لا", post: "المنشورات", notif: "إشعار", time_left: "باقي:", ads_for: "لمدة:", pass: "كلمة السر", user: "الاسم", register: "إنشاء حساب", noAcc: "ليس لديك حساب؟", hasAcc: "لديك حساب؟", authFail: "الإيميل أو كلمة السر خطأ", regSuccess: "تم إنشاء الحساب", post_time: "وقت النشر:", noComment: "عذراً، لا يمكنك. يجب عليك إنشاء حساب", wantReg: "هل تريد إنشاء حساب؟", notifMsg: "إذا كنت تشعر بالملل أو السأم، فأنشئ حساباً وسأمنحك طاقة جيدة كل يوم ليومك" },
    fa: { news: "اخبار", info: "اطلاعات", market: "بازار", discount: "تخفیف", account: "حساب", fav: "علاقه مندی", notifSec: "بخش اعلان‌ها", login: "ورود", logout: "خروج", email: "ایمیل", empty: "خالی است", ago: "پیش", now: "الان", rep: "پاسخ", del: "حذف", edit: "ویرایش", authErr: "ببخشید، باید حساب کاربری داشته باشید", yes: "بله", no: "خیر", post: "پست‌ها", notif: "اعلان", time_left: "زمان باقی‌مانده:", ads_for: "برای مدت:", pass: "رمز عبور", user: "نام", register: "ساخت حساب", noAcc: "حساب ندارید؟", hasAcc: "حساب دارید؟", authFail: "ایمیل یا رمز عبور اشتباه است", regSuccess: "حساب ساخته شد", post_time: "زمان ارسال:", noComment: "ببخشید، نمی‌توانید. باید حساب کاربری بسازید", wantReg: "آیا می‌خواهید حساب کاربری بسازید؟", notifMsg: "اگر بی حوصله یا خسته هستید، یک حساب کاربری بسازید و من هر روز انرژی خوبی برای روزتان به شما می دهم" }
};

const subCategories = {
    info: { ku: ["کۆلێژ", "ڕێکخراو", "هەلیکار"], en: ["College", "Organization", "Jobs"], ar: ["كلية", "منظمة", "وظائف"], fa: ["دانشکده", "سازمان", "کاریابی"] },
    market: { ku: ["سەیارە", "بزنس", "خانوو"], en: ["Cars", "Business", "House"], ar: ["سيارات", "تجارة", "عقارات"], fa: ["ماشین", "تجارت", "خانه"] },
    discount: { ku: ["ڕێستۆرانت", "جلوبەرگ", "مارکێت"], en: ["Restaurant", "Clothing", "Market"], ar: ["مطعم", "ملابس", "مارکت"], fa: ["رستوران", "پوشاک", "مارکت"] }
};

// --- Header & Global Actions ---
window.toggleDarkMode = () => {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    if(icon) icon.className = isDarkMode ? 'fas fa-sun text-yellow-400' : 'fas fa-moon text-blue-400';
};

window.openLangMenu = () => {
    const el = document.getElementById('lang-overlay');
    if (el) el.style.display = 'flex';
};

window.closeLangMenu = () => {
    const el = document.getElementById('lang-overlay');
    if (el) el.style.display = 'none';
};

window.changeLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    window.closeLangMenu();
    window.updateUIScript();
    window.updateTabContent(localStorage.getItem('lastMainTab') || 'news');
};

window.toggleAdminBar = () => {
    const isBoss = currentUser && currentUser.email === OWNER_EMAIL;
    if (isBoss) {
        const bar = document.getElementById('admin-quick-bar');
        if (bar) bar.style.display = (bar.style.display === 'none' || bar.style.display === '') ? 'flex' : 'none';
    }
};

// --- Modal Controls ---
window.openPostModal = () => document.getElementById('post-modal').style.display = 'flex';
window.closePostModal = () => document.getElementById('post-modal').style.display = 'none';
window.openNotifModal = () => document.getElementById('notif-modal').style.display = 'flex';
window.closeNotifModal = () => document.getElementById('notif-modal').style.display = 'none';
window.closeAdminStats = () => document.getElementById('admin-stats-modal').style.display = 'none';
window.closeCommentModal = () => document.getElementById('comment-modal').style.display = 'none';

window.openHeartMenu = () => { 
    const el = document.getElementById('heart-overlay');
    if (el) {
        if(!currentUser) {
            window.showGuestAuthAlert();
        } else {
            el.style.display='block'; 
            document.getElementById('fav-title-main').innerText = uiTrans[currentLang].fav; 
            document.getElementById('fav-nav-tabs').style.display = 'flex'; 
            window.showFavorites('post'); 
        }
    }
};

window.closeHeartMenu = () => {
    const el = document.getElementById('heart-overlay');
    if (el) el.style.display = 'none';
};

window.showAllNotifs = () => {
    const t = uiTrans[currentLang];
    const el = document.getElementById('heart-overlay');
    if (el) {
        el.style.display='block'; 
        document.getElementById('fav-title-main').innerText = t.notifSec;
        document.getElementById('fav-nav-tabs').style.display = 'none'; 
        
        if (!currentUser) {
            window.showGuestAuthAlert();
        } else {
            const items = allPosts.filter(p => p.category === 'notif' && p.lang === currentLang);
            document.getElementById('fav-items-display').innerHTML = items.length ? items.map(p => window.renderPostHTML(p)).join('') : `<p class="text-center py-10 opacity-20">${t.empty}</p>`;
        }
    }
};

// --- Core UI Logic ---
window.changeTab = (tab, el) => { 
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active')); 
    if(el) el.classList.add('active'); 
    localStorage.setItem('lastMainTab', tab);
    window.updateTabContent(tab); 
};

window.updateUIScript = () => { 
    const t = uiTrans[currentLang]; 
    const activeCodeEl = document.getElementById('active-lang-code');
    if(activeCodeEl) activeCodeEl.innerText = currentLang.toUpperCase(); 

    const isBoss = currentUser && currentUser.email === OWNER_EMAIL;
    const langOverlayGrid = document.querySelector('#lang-overlay .lang-grid');
    if (langOverlayGrid) {
        const langs = ['ku', 'en', 'ar', 'fa'];
        langOverlayGrid.innerHTML = langs.map(l => {
            const hasPosts = allPosts.some(p => p.lang === l);
            const isHiddenByBoss = hiddenItems.langs.includes(l);
            const langName = l === 'ku' ? 'Kurdî' : (l === 'en' ? 'English' : (l === 'ar' ? 'العربية' : 'فارسی'));
            if (isBoss) {
                return `<div class="flex items-center justify-between w-full bg-white/5 rounded-xl p-1 mb-2">
                    <button onclick="window.changeLanguage('${l}')" class="lang-btn-glass !mb-0 flex-1">${langName}</button>
                    ${window.getHideBtn('langs', l)}
                </div>`;
            } else if (hasPosts && !isHiddenByBoss) {
                return `<button onclick="window.changeLanguage('${l}')" class="lang-btn-glass">${langName}</button>`;
            }
            return '';
        }).join('');
    }

    ['news','info','market','discount','account'].forEach(k => { 
        const navEl = document.getElementById('nav-'+k);
        if(navEl) navEl.innerText = t[k]; 
        
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
                    btn.insertAdjacentHTML('beforeend', window.getHideBtn('navs', k));
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
            return !isHiddenByBoss && allPosts.some(p => p.category === tab && p.sub_category === sub && p.lang === currentLang);
        });

        if (availableSubs.length > 0) {
            subNav.style.display = 'block';
            if (!activeSubCategory || !availableSubs.includes(activeSubCategory)) {
                activeSubCategory = availableSubs[0];
            }
            subBar.innerHTML = availableSubs.map(item => `
                <button class="sub-tab-btn ${activeSubCategory === item ? 'active' : ''} flex items-center justify-center gap-2" 
                onclick="window.filterBySub('${tab}', '${item}')">
                    ${item} ${window.getHideBtn('factions', item)}
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
        window.renderAuthUI(); 
    } else {
        let filtered = allPosts.filter(p => p.lang === currentLang && p.category === tab);
        if (['info', 'market', 'discount'].includes(tab) && activeSubCategory) {
            filtered = filtered.filter(p => p.sub_category === activeSubCategory);
        }
        filtered.sort((a,b)=>b.id-a.id);
        display.innerHTML = filtered.length ? filtered.map(p => window.renderPostHTML(p)).join('') : `<div class="text-center py-20 opacity-30">${uiTrans[currentLang].empty}</div>`;
    }
};

window.filterBySub = (tab, subName) => { 
    activeSubCategory = subName; 
    window.updateTabContent(tab); 
};

// --- Rendering & Components ---
window.renderPostHTML = (p) => {
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === OWNER_EMAIL);
    const t = uiTrans[currentLang];
    const isLiked = currentUser && userFavorites[currentUser.email]?.some(f => f.id === p.id);
    
    let expiryHTML = '';
    if (p.expiry_date && p.expiry_date !== 'never') {
        const diff = p.expiry_date - Date.now();
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        expiryHTML = `<span class="expiry-tag"><i class="far fa-clock"></i> ${t.time_left} ${days}d ${hours}h</span>`;
    }

    return `
    <div class="post-card animate-fade">
        ${p.media ? `<img src="${p.media}" class="post-media">` : ''}
        <div class="post-body">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] opacity-40">${window.timeAgo(p.id)}</span>
                ${isAdmin ? `<button onclick="window.deletePost(${p.id})" class="text-red-500"><i class="fas fa-trash-alt"></i></button>` : ''}
            </div>
            ${p.title ? `<div class="glass-title"><h3 class="font-bold text-lg">${p.title}</h3></div>` : ''}
            <p class="text-sm opacity-70 mb-4">${p.desc || ''}</p>
            <div class="flex justify-between items-center border-t border-white/5 pt-3">
                <div class="flex gap-6">
                    <button onclick="window.toggleFavorite(${p.id})" class="flex items-center gap-2">
                        <i class="${isLiked ? 'fas fa-heart text-red-500' : 'far fa-heart opacity-50'} text-xl"></i>
                        <span>${likeCounts[p.id] || 0}</span>
                    </button>
                    <button onclick="window.openComments(${p.id})" class="flex items-center gap-2 opacity-60">
                        <i class="far fa-comment-dots text-xl"></i><span>${(comments[p.id] || []).length}</span>
                    </button>
                </div>
                ${expiryHTML}
            </div>
        </div>
    </div>`;
};

window.timeAgo = (prev) => {
    const diff = Date.now() - prev;
    const t = uiTrans[currentLang];
    if (diff < 60000) return t.now;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + "m " + t.ago;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + "h " + t.ago;
    return Math.floor(hours / 24) + "d " + t.ago;
};

// --- Auth UI ---
window.renderAuthUI = (mode = 'login') => {
    const display = document.getElementById('content-display');
    const t = uiTrans[currentLang];
    if (currentUser) {
        display.innerHTML = `<div class="glass-card p-8 text-center animate-fade">
            <div class="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">${currentUser.email[0].toUpperCase()}</div>
            <h2 class="text-xl font-bold mb-2">${currentUser.name || currentUser.email.split('@')[0]}</h2>
            <button class="auth-submit !bg-red-500/20 !text-red-400" onclick="window.logout()">${t.logout}</button>
        </div>`;
        return;
    }
    if (mode === 'login') {
        display.innerHTML = `<div class="glass-card p-6 animate-fade">
            <h2 class="text-xl font-bold mb-6 text-center">${t.login}</h2>
            <input id="auth-email" type="email" class="auth-input" placeholder="${t.email}">
            <input id="auth-pass" type="password" class="auth-input" placeholder="${t.pass}">
            <button class="auth-submit" onclick="window.handleLogin()">${t.login}</button>
            <p class="text-center mt-6 text-xs opacity-50">${t.noAcc} <span class="text-blue-400 cursor-pointer" onclick="window.renderAuthUI('register')">${t.register}</span></p>
        </div>`;
    } else {
        display.innerHTML = `<div class="glass-card p-6 animate-fade">
            <h2 class="text-xl font-bold mb-6 text-center">${t.register}</h2>
            <input id="reg-user" type="text" class="auth-input" placeholder="${t.user}">
            <input id="reg-email" type="email" class="auth-input" placeholder="${t.email}">
            <input id="reg-pass" type="password" class="auth-input" placeholder="${t.pass}">
            <button class="auth-submit" onclick="window.handleRegister()">${t.register}</button>
            <p class="text-center mt-6 text-xs opacity-50">${t.hasAcc} <span class="text-blue-400 cursor-pointer" onclick="window.renderAuthUI('login')">${t.login}</span></p>
        </div>`;
    }
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-email').value.trim().toLowerCase();
    const p = document.getElementById('auth-pass').value.trim();
    if (e === OWNER_EMAIL && p === OWNER_PASS) {
        currentUser = { email: e, name: 'Boss Belal', role: 'admin' };
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.location.reload(); 
        return;
    }
    const { data: user } = await _supabase.from('users').select('*').eq('email', e).eq('password', p).single();
    if (user) { 
        currentUser = user; 
        localStorage.setItem('user', JSON.stringify(currentUser)); 
        window.location.reload(); 
    } else { 
        alert(uiTrans[currentLang].authFail); 
    }
};

window.handleRegister = async () => {
    const u = document.getElementById('reg-user').value.trim();
    const e = document.getElementById('reg-email').value.trim().toLowerCase();
    const p = document.getElementById('reg-pass').value.trim();
    if (!u || !e || !p) return;
    const newUser = { email: e, password: p, name: u, role: 'user', last_active: Date.now() };
    const { error } = await _supabase.from('users').insert([newUser]);
    if (!error) { alert(uiTrans[currentLang].regSuccess); window.renderAuthUI('login'); }
};

window.logout = () => { localStorage.removeItem('user'); window.location.reload(); };

// --- Admin Controls ---
window.submitPost = async () => {
    const title = document.getElementById('post-title').value; 
    const desc = document.getElementById('post-desc').value;
    const cat = document.getElementById('post-category').value; 
    const duration = document.getElementById('post-duration').value;
    
    let expiryDate = null; 
    if (duration !== "never") { 
        const units = { '1w': 7, '2w': 14, '3w': 21, '1m': 30, '2m': 60, '3m': 90 }; 
        expiryDate = Date.now() + (units[duration] * 86400000); 
    }
    
    const { error } = await _supabase.from('posts').insert([{ 
        title, desc, lang: document.getElementById('post-lang').value, 
        category: cat, sub_category: document.getElementById('post-sub-category').value, 
        expiry_date: expiryDate, media: tempMedia.url, admin_name: currentUser.name, user_email: currentUser.email 
    }]);
    if(!error) { window.closePostModal(); await syncAllData(); }
};

window.deletePost = async (id) => { if(confirm('Delete?')) { await _supabase.from('posts').delete().eq('id', id); await syncAllData(); } };

window.toggleHideItem = (type, value, event) => {
    if (event) event.stopPropagation();
    if (hiddenItems[type].includes(value)) {
        hiddenItems[type] = hiddenItems[type].filter(i => i !== value);
    } else {
        hiddenItems[type].push(value);
    }
    localStorage.setItem('hiddenItems', JSON.stringify(hiddenItems));
    window.updateUIScript();
    window.updateTabContent(localStorage.getItem('lastMainTab'));
};

window.getHideBtn = (type, value) => {
    if (!(currentUser && currentUser.email === OWNER_EMAIL)) return "";
    const isHidden = hiddenItems[type].includes(value);
    return `<i class="fas ${isHidden ? 'fa-eye-slash text-red-500' : 'fa-eye text-green-500'} ml-2 cursor-pointer" 
               onclick="window.toggleHideItem('${type}', '${value}', event)"></i>`;
};

// --- Initialization ---
async function init() {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    await syncAllData(); 
    const bossIcon = document.getElementById('boss-admin-icon');
    if (bossIcon) bossIcon.style.display = (currentUser && currentUser.email === OWNER_EMAIL) ? 'block' : 'none';
    const lastMain = localStorage.getItem('lastMainTab') || 'news';
    window.changeTab(lastMain, document.getElementById('nav-btn-' + lastMain));
}

init();
