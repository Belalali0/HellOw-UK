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

// --- Header Functions ---

window.toggleDarkMode = () => {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = isDarkMode ? 'fas fa-sun text-yellow-400' : 'fas fa-moon text-blue-400';
    }
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
    const lastTab = localStorage.getItem('lastMainTab') || 'news';
    window.updateTabContent(lastTab);
};

// --- Admin & Owner Logic ---

window.toggleAdminBar = () => {
    if (currentUser && currentUser.email === OWNER_EMAIL) {
        const bar = document.getElementById('admin-quick-bar');
        if (bar) bar.style.display = (bar.style.display === 'none' || bar.style.display === '') ? 'flex' : 'none';
    }
};

window.openPostModal = () => {
    const el = document.getElementById('post-modal');
    if (el) el.style.display = 'flex';
};

window.closePostModal = () => {
    const el = document.getElementById('post-modal');
    if (el) el.style.display = 'none';
};

window.openNotifModal = () => {
    const el = document.getElementById('notif-modal');
    if (el) el.style.display = 'flex';
};

window.closeNotifModal = () => {
    const el = document.getElementById('notif-modal');
    if (el) el.style.display = 'none';
};

// --- Global UI Logic ---

window.changeTab = (tab, el) => { 
    if(typeof window.closeHeartMenu === "function") window.closeHeartMenu(); 
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
    const langOverlay = document.querySelector('#lang-overlay .lang-grid');
    if (langOverlay) {
        const langs = ['ku', 'en', 'ar', 'fa'];
        langOverlay.innerHTML = langs.map(l => {
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

window.formatFullDate = (ts) => {
    const d = new Date(ts);
    return d.getFullYear() + "/" + (d.getMonth() + 1).toString().padStart(2, '0') + "/" + d.getDate().toString().padStart(2, '0') + " " + d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
};

window.renderPostHTML = (p) => {
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === OWNER_EMAIL);
    const t = uiTrans[currentLang];
    
    const isLiked = currentUser && userFavorites[currentUser.email] && userFavorites[currentUser.email].some(f => f.id === p.id);
    const mediaHTML = p.media ? `<img src="${p.media}" class="post-media">` : '';
    
    let expiryHTML = '';
    if (p.expiry_date === 'never' || !p.expiry_date) {
        if (isAdmin) expiryHTML = `<span class="expiry-tag"><i class="far fa-clock"></i> NEVER</span>`;
    } else {
        const diff = p.expiry_date - Date.now();
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const timeLeftLine = `<span class="expiry-tag"><i class="far fa-clock"></i> ${t.time_left} ${days}d ${hours}h</span>`;
        if (isAdmin) { expiryHTML = `<div class="flex flex-col items-end gap-1"><span class="duration-info">${t.ads_for} ${p.duration_label || "Never"}</span>${timeLeftLine}</div>`; }
        else if (p.category === 'discount') { expiryHTML = `<div class="flex flex-col items-end gap-1">${timeLeftLine}</div>`; }
    }

    const creatorInfo = isAdmin ? `<div class="flex flex-col items-end"><span class="admin-name-tag">By: ${p.admin_name || 'Admin'}</span><span style="font-size: 8px; opacity: 0.5;">(${t.post_time}) ${window.formatFullDate(p.id)}</span></div>` : '';
    const commentCount = (comments[p.id] || []).length;
    
    const linkBtnHTML = p.post_link ? `
        <a href="${p.post_link.startsWith('http') ? p.post_link : 'https://' + p.post_link}" target="_blank" 
           class="flex items-center justify-center w-9 h-9 bg-blue-500/20 rounded-full text-blue-400 hover:scale-110 transition-transform">
            <i class="fas fa-link text-sm"></i>
        </a>` : '';

    return `
    <div class="post-card animate-fade">
        ${mediaHTML}
        <div class="post-body">
            <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] opacity-40 mb-2">${window.timeAgo(p.id)}</span>
                <div class="flex gap-3 items-center">
                    ${linkBtnHTML}
                    ${isAdmin ? `<button onclick="window.deletePost(${p.id})" class="text-red-500 opacity-40"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            </div>
            ${p.title ? `<div class="glass-title"><h3 class="font-bold text-lg">${p.title}</h3></div>` : ''}
            ${p.desc ? `<p class="text-sm opacity-70 mb-4 px-2">${p.desc}</p>` : ''}
            <div class="flex justify-between items-end border-t border-white/5 pt-3">
                <div class="flex gap-6">
                    <button id="like-btn-${p.id}" onclick="window.toggleFavorite(${p.id})" class="flex items-center gap-2">
                        <i class="${isLiked ? 'fas fa-heart text-red-500' : 'far fa-heart opacity-50'} text-xl transition-all duration-300"></i>
                        <span id="like-count-${p.id}">${likeCounts[p.id] || 0}</span>
                    </button>
                    <button onclick="window.openComments(${p.id})" class="flex items-center gap-2 opacity-60">
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

// --- Auth Section ---

window.renderAuthUI = (mode = 'login') => {
    const display = document.getElementById('content-display');
    const t = uiTrans[currentLang];
    if (currentUser) {
        display.innerHTML = `<div class="glass-card p-8 text-center animate-fade"><div class="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">${currentUser.email[0].toUpperCase()}</div><h2 class="text-xl font-bold mb-2">${currentUser.name || currentUser.email.split('@')[0]}</h2><p class="text-xs opacity-40 mb-6">${currentUser.email}</p><button class="auth-submit !bg-red-500/20 !text-red-400 !border-red-500/30" onclick="window.logout()">${t.logout}</button></div>`;
        return;
    }
    if (mode === 'login') {
        display.innerHTML = `<div class="glass-card p-6 animate-fade"><h2 class="text-xl font-bold mb-6 text-center">${t.login}</h2><input id="auth-email" type="email" class="auth-input" placeholder="${t.email}"><input id="auth-pass" type="password" class="auth-input" placeholder="${t.pass}"><button class="auth-submit" onclick="window.handleLogin()">${t.login}</button><p class="text-center mt-6 text-xs opacity-50">${t.noAcc} <span class="text-blue-400 cursor-pointer" onclick="window.renderAuthUI('register')">${t.register}</span></p></div>`;
    } else {
        display.innerHTML = `<div class="glass-card p-6 animate-fade"><h2 class="text-xl font-bold mb-6 text-center">${t.register}</h2><input id="reg-user" type="text" class="auth-input" placeholder="${t.user}"><input id="reg-email" type="email" class="auth-input" placeholder="${t.email}"><input id="reg-pass" type="password" class="auth-input" placeholder="${t.pass}"><button class="auth-submit !bg-blue-500/20 !text-blue-300" onclick="window.handleRegister()">${t.register}</button><p class="text-center mt-6 text-xs opacity-50">${t.hasAcc} <span class="text-blue-400 cursor-pointer" onclick="window.renderAuthUI('login')">${t.login}</span></p></div>`;
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
    const { data: existing } = await _supabase.from('users').select('email').eq('email', e).single();
    if (existing) { alert("Email already exists"); return; }
    
    const newUser = { email: e, password: p, name: u, role: 'user', last_active: Date.now() };
    const { error } = await _supabase.from('users').insert([newUser]);
    if (!error) {
        alert(uiTrans[currentLang].regSuccess); window.renderAuthUI('login');
    }
};

window.logout = () => {
    localStorage.removeItem('user');
    window.location.reload();
};

// --- Actions & Database ---

window.toggleFavorite = async (id) => {
    if (!currentUser) { window.showGuestAuthAlert(); return; }
    const email = currentUser.email;
    const { data: existing } = await _supabase.from('likes').select('*').eq('post_id', id).eq('user_email', email).single();
    
    if (!existing) {
        await _supabase.from('likes').insert([{ post_id: id, user_email: email }]);
    } else {
        await _supabase.from('likes').delete().eq('post_id', id).eq('user_email', email);
    }
    await syncAllData();
};

window.submitPost = async () => {
    const title = document.getElementById('post-title').value; 
    const desc = document.getElementById('post-desc').value;
    const postLink = document.getElementById('post-external-link') ? document.getElementById('post-external-link').value.trim() : "";
    const cat = document.getElementById('post-category').value; 
    const durSelect = document.getElementById('post-duration');
    const duration = durSelect.value; 
    const durationLabel = durSelect.options[durSelect.selectedIndex].text;
    
    if(!title && !desc && !tempMedia.url) return;
    
    let expiryDate = null; 
    if (duration !== "never") { 
        const units = { '1w': 7, '2w': 14, '3w': 21, '1m': 30, '2m': 60, '3m': 90 }; 
        expiryDate = Date.now() + (units[duration] * 86400000); 
    }
    
    const adminName = currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : "Admin";
    
    const newPost = { 
        title, desc, 
        post_link: postLink,
        admin_name: adminName, 
        user_email: currentUser?.email || "system", 
        lang: document.getElementById('post-lang').value, 
        category: cat, 
        sub_category: document.getElementById('post-sub-category').value, 
        expiry_date: expiryDate, 
        duration_label: durationLabel, 
        media: tempMedia.url 
    }; 
    
    const { error } = await _supabase.from('posts').insert([newPost]);
    if(!error) {
        window.closePostModal(); 
        await syncAllData();
    }
};

window.submitNotif = async () => {
    const title = document.getElementById('notif-title').value; 
    const desc = document.getElementById('notif-desc').value;
    const lang = document.getElementById('notif-lang').value;
    const { error } = await _supabase.from('posts').insert([{
        title, desc, lang, category: 'notif', admin_name: currentUser?.name || "Admin", user_email: currentUser?.email
    }]);
    if(!error) {
        window.closeNotifModal(); 
        await syncAllData();
    }
};

window.deletePost = async (id) => { 
    if(confirm('Delete?')) { 
        await _supabase.from('posts').delete().eq('id', id);
        await syncAllData();
    } 
};

// --- Favorites & Notif System ---

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

window.showFavorites = (type) => {
    currentFavTab = type;
    document.querySelectorAll('.fav-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(type === 'post' ? 'btn-fav-post' : 'btn-fav-notif');
    if(btn) btn.classList.add('active');
    
    let likedItems = [];
    if (type === 'post') {
        likedItems = allPosts.filter(p => p.category !== 'notif' && (likeCounts[p.id] > 0));
    } else {
        likedItems = allPosts.filter(p => p.category === 'notif' && (likeCounts[p.id] > 0));
    }
    
    document.getElementById('fav-items-display').innerHTML = likedItems.length ? likedItems.map(p => window.renderPostHTML(p)).join('') : '<p class="text-center opacity-20 mt-10">Empty</p>';
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

window.showGuestAuthAlert = () => {
    const t = uiTrans[currentLang];
    const el = document.getElementById('heart-overlay');
    if (el) {
        el.style.display='block';
        document.getElementById('fav-items-display').innerHTML = `
            <div class="p-8 text-center animate-fade">
                <i class="fas fa-lock text-4xl mb-4 opacity-20"></i>
                <p class="text-sm font-bold text-yellow-500 mb-2">${t.noComment}</p>
                <p class="text-[11px] leading-relaxed opacity-60 mb-6">${t.wantReg}</p>
                <div class="flex gap-3 px-4">
                    <button onclick="window.changeTab('account', document.getElementById('nav-btn-account'))" class="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-xs">${t.yes}</button>
                    <button onclick="window.closeHeartMenu()" class="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs">${t.no}</button>
                </div>
            </div>`;
    }
};

// --- Comments ---

window.openComments = (id) => { 
    activeCommentPostId = id; 
    const modal = document.getElementById('comment-modal');
    if(modal) modal.style.display = 'flex'; 
    window.renderComments(); 
    window.updateCommentInputArea(); 
};

window.closeCommentModal = () => {
    const el = document.getElementById('comment-modal');
    if (el) el.style.display = 'none';
};

window.updateCommentInputArea = () => {
    const area = document.getElementById('comment-input-area');
    if(!area) return;
    const t = uiTrans[currentLang];
    if(!currentUser) { 
        area.innerHTML = `<div class="p-4 text-center text-xs text-yellow-500">${t.noComment}</div>`; 
        return; 
    }
    area.innerHTML = `
        <div class="flex gap-2 p-2">
            <input id="comment-input" type="text" class="auth-input flex-1 !mb-0" placeholder="Write...">
            <button onclick="window.submitComment()" class="p-4 bg-green-500 rounded-xl"><i class="fas fa-paper-plane text-black"></i></button>
        </div>`;
};

window.renderComments = () => {
    const list = document.getElementById('comment-list');
    if(!list) return;
    const allComs = comments[activeCommentPostId] || [];
    list.innerHTML = allComs.map(c => `<div class="bg-white/5 p-3 rounded-2xl mb-2"><span class="opacity-40 text-[10px]">@${c.user_name}</span><p class="text-sm">${c.text}</p></div>`).join('') || '<p class="text-center opacity-20">Empty</p>';
};

window.submitComment = async () => {
    const input = document.getElementById('comment-input');
    if(!input || !input.value.trim()) return;
    const { error } = await _supabase.from('comments').insert([{
        post_id: activeCommentPostId,
        user_email: currentUser.email,
        user_name: currentUser.name,
        text: input.value
    }]);
    if(!error) {
        input.value = ''; await syncAllData(); window.renderComments();
    }
};

// --- Stats & Admin Dashboard ---

window.openAdminStats = () => {
    const modal = document.getElementById('admin-stats-modal');
    if (modal) modal.style.display = 'flex';
    window.filterUserList('all');
};

window.closeAdminStats = () => {
    const modal = document.getElementById('admin-stats-modal');
    if (modal) modal.style.display = 'none';
};

window.filterUserList = (filterType) => {
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    const btn = document.getElementById('btn-stat-' + filterType);
    if(btn) btn.classList.add('active');
    
    let usersToDisplay = (filterType === 'all') ? registeredUsers : registeredUsers.filter(u => (Date.now() - u.last_active) < 300000);
    window.renderUsers(usersToDisplay);
};

window.renderUsers = (users) => {
    const list = document.getElementById('admin-user-list'); 
    list.innerHTML = users.map(u => {
        const roleColor = u.email === OWNER_EMAIL ? "bg-yellow-500/30" : (u.role === "admin" ? "bg-red-500/30" : "bg-blue-500/20");
        return `<div class="glass-card p-3 flex justify-between items-center mb-2">
            <div><span class="font-bold text-sm">${u.name}</span><br><span class="text-[10px] opacity-40">${u.email}</span></div>
            <span class="px-2 py-1 rounded text-[8px] ${roleColor}">${u.role.toUpperCase()}</span>
        </div>`;
    }).join('');
};

window.filterBySub = (tab, subName) => { 
    activeSubCategory = subName; 
    window.updateTabContent(tab); 
};

window.getHideBtn = (type, value) => {
    if (!(currentUser && currentUser.email === OWNER_EMAIL)) return "";
    const isHidden = hiddenItems[type].includes(value);
    return `<i class="fas ${isHidden ? 'fa-eye-slash text-red-500' : 'fa-eye text-green-500'} ml-2 cursor-pointer pointer-events-auto" 
               onclick="window.toggleHideItem('${type}', '${value}', event)"></i>`;
};

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

// --- Cloudinary Widget (Placeholder) ---
window.openCloudinaryWidget = () => {
    alert("Cloudinary Widget setup required with your Cloudinary Cloud Name.");
};

// --- Initialization ---
async function init() {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    await syncAllData(); 
    const bossIcon = document.getElementById('boss-admin-icon');
    if (bossIcon) bossIcon.style.display = (currentUser && currentUser.email === OWNER_EMAIL) ? 'block' : 'none';
    
    const lastMain = localStorage.getItem('lastMainTab') || 'news';
    const activeBtn = document.getElementById('nav-btn-' + lastMain);
    window.changeTab(lastMain, activeBtn);
}

init();

// Click outside menus to close
window.addEventListener('click', (event) => {
    const langOverlay = document.getElementById('lang-overlay');
    if (event.target === langOverlay) window.closeLangMenu();
    const heartOverlay = document.getElementById('heart-overlay');
    if (event.target === heartOverlay) window.closeHeartMenu();
});
