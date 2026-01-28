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
let tempMedia = { url: "", type: "" };
let activeCommentPostId = null;
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
        
        if (currentUser && currentUser.email === OWNER_EMAIL) {
            updateCounters();
            renderUsers(registeredUsers);
        }

        updateUIScript();
        updateTabContent(localStorage.getItem('lastMainTab') || 'news');
    } catch (e) { console.error("Sync Error:", e); }
}

const uiTrans = {
    ku: { news: "هەواڵ", info: "زانیاری", market: "بازاڕ", discount: "داشکاندن", account: "ئەکاونت", fav: "دڵخوازەکان", notifSec: "بەشی نۆتفیکەیشن", login: "چوونە ژوورەوە", logout: "دەرچوون", email: "ئیمەیڵ", empty: "هیچ نییە", ago: "لەمەوپێش", now: "ئێستا", rep: "وەڵام", del: "سڕینەوە", edit: "دەستکاری", authErr: "ببورە پێویستە ئەکاونتت هەبێت", yes: "بەڵێ", no: "نەخێر", post: "پۆستەکان", notif: "نۆتفی", time_left: "ماوە:", ads_for: "بۆ ماوەی:", pass: "پاسۆرد", user: "ناو", register: "دروستکردنی ئەکاونت", noAcc: "ئەکاونتت نییە؟", hasAcc: "ئەکاونتت هەیە؟", authFail: "ئیمەیڵ یان پاسۆرد هەڵەیە", regSuccess: "ئەکاونت دروستکرا", post_time: "کاتی پۆست:", noComment: "ببورە ناتوانی پێویستە ئەکاونت دروست بکەیت", wantReg: "ئەتەوێت ئەکاونت دروست بکەیت؟", notifMsg: "ئینێرجی باش بۆ ڕۆژەکەت" },
    en: { news: "News", info: "Info", market: "Market", discount: "Discount", account: "Account", fav: "Favorites", notifSec: "Notifications", login: "Login", logout: "Logout", email: "Email", empty: "Empty", ago: "ago", now: "now", rep: "Reply", del: "Delete", edit: "Edit", authErr: "Login Required", yes: "Yes", no: "No", post: "Posts", notif: "Notif", time_left: "Left:", ads_for: "For:", pass: "Password", user: "Username", register: "Register", noAcc: "No account?", hasAcc: "Have account?", authFail: "Wrong credentials", regSuccess: "Account Created", post_time: "Post time:", noComment: "Login to comment", wantReg: "Create account?", notifMsg: "Good energy for your day" },
    ar: { news: "الأخبار", info: "معلومات", market: "السوق", discount: "تخفیضات", account: "الحساب", fav: "المفضلة", notifSec: "الإشعارات", login: "تسجيل الدخول", logout: "خروج", email: "الإيميل", empty: "فارغ", ago: "منذ", now: "الآن", rep: "رد", del: "حذف", edit: "تعديل", authErr: "يجب تسجيل الدخول", yes: "نعم", no: "لا", post: "المنشورات", notif: "إشعار", time_left: "باقي:", ads_for: "لمدة:", pass: "كلمة السر", user: "الاسم", register: "إنشاء حساب", noAcc: "ليس لديك حساب؟", hasAcc: "لديك حساب؟", authFail: "خطأ في البيانات", regSuccess: "تم إنشاء الحساب", post_time: "وقت النشر:", noComment: "سجل تعليقك", wantReg: "هل تريد إنشاء حساب؟", notifMsg: "طاقة إيجابية ليومك" },
    fa: { news: "اخبار", info: "اطلاعات", market: "بازار", discount: "تخفیف", account: "حساب", fav: "علاقه مندی", notifSec: "اعلان‌ها", login: "ورود", logout: "خروج", email: "ایمیل", empty: "خالی", ago: "پیش", now: "الان", rep: "پاسخ", del: "حذف", edit: "ویرایش", authErr: "ورود لازم است", yes: "بله", no: "خیر", post: "پست‌ها", notif: "اعلان", time_left: "مانده:", ads_for: "برای:", pass: "رمز عبور", user: "نام", register: "ثبت نام", noAcc: "حساب ندارید؟", hasAcc: "حساب دارید؟", authFail: "خطا در ورود", regSuccess: "حساب ساخته شد", post_time: "زمان ارسال:", noComment: "وارد شوید", wantReg: "ساخت حساب؟", notifMsg: "انرژی خوب برای روزتان" }
};

const subCategories = {
    info: { ku: ["کۆلێژ", "ڕێکخراو", "هەلیکار"], en: ["College", "Organization", "Jobs"], ar: ["كلية", "منظمة", "وظائف"], fa: ["دانشکده", "سازمان", "کاریابی"] },
    market: { ku: ["سەیارە", "بزنس", "خانوو"], en: ["Cars", "Business", "House"], ar: ["سيارات", "تجارة", "عقارات"], fa: ["ماشین", "تجارت", "خانه"] },
    discount: { ku: ["ڕێستۆرانت", "جلوبەرگ", "مارکێت"], en: ["Restaurant", "Clothing", "Market"], ar: ["مطعم", "ملابس", "مارکت"], fa: ["رستوران", "پوشاک", "مارکت"] }
};

// --- Core Helper Functions ---
function timeAgo(ts) {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    const t = uiTrans[currentLang];
    if (seconds < 60) return t.now;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m " + t.ago;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h " + t.ago;
    return Math.floor(hours / 24) + "d " + t.ago;
}

function getHideBtn(type, value) {
    if (!(currentUser && currentUser.email === OWNER_EMAIL)) return "";
    const isHidden = hiddenItems[type].includes(value);
    return `<i class="fas ${isHidden ? 'fa-eye-slash text-red-500' : 'fa-eye text-green-500'} ml-2 cursor-pointer pointer-events-auto" 
               onclick="toggleHideItem('${type}', '${value}', event)"></i>`;
}

function updateCounters() { 
    const now = Date.now(); 
    const totalUsers = registeredUsers.length;
    const onlineUsers = registeredUsers.filter(u => (now - (u.last_active || 0)) < 300000).length;

    if(document.getElementById('stat-total-users')) document.getElementById('stat-total-users').innerText = totalUsers; 
    if(document.getElementById('stat-online-users')) document.getElementById('stat-online-users').innerText = onlineUsers; 
}

// --- Window Scoped Functions ---
window.toggleDarkMode = () => {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    if(icon) icon.className = isDarkMode ? 'fas fa-moon text-blue-400' : 'fas fa-sun text-yellow-400';
};

window.openLangMenu = () => document.getElementById('lang-overlay').style.display = 'flex';
window.closeLangMenu = () => document.getElementById('lang-overlay').style.display = 'none';

window.changeLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    window.closeLangMenu();
    updateUIScript();
    updateTabContent(localStorage.getItem('lastMainTab') || 'news');
};

window.toggleAdminBar = () => {
    if (currentUser && currentUser.email === OWNER_EMAIL) {
        const bar = document.getElementById('admin-quick-bar');
        bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    }
};

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

window.changeTab = (tab, el) => { 
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active')); 
    if(el) el.classList.add('active'); 
    localStorage.setItem('lastMainTab', tab);
    updateTabContent(tab); 
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
                    <button onclick="changeLanguage('${l}')" class="lang-btn-glass !mb-0 flex-1 text-xs">${langName}</button>
                    ${getHideBtn('langs', l)}
                </div>`;
            } else if (!isHiddenByBoss && hasPosts) {
                return `<button onclick="changeLanguage('${l}')" class="lang-btn-glass">${langName}</button>`;
            }
            return '';
        }).join('');
    }

    ['news','info','market','discount','account'].forEach(k => { 
        const navText = document.getElementById('nav-'+k);
        if(navText) navText.innerText = t[k]; 
        
        const btn = document.getElementById('nav-btn-' + k);
        if (btn) {
            const isHiddenByBoss = hiddenItems.navs.includes(k);
            if (k === 'account') {
                btn.style.display = 'flex';
            } else {
                const hasAnyPosts = allPosts.some(p => p.category === k && p.lang === currentLang);
                if (isBoss) {
                    btn.style.display = 'flex';
                } else {
                    // ئەگەر Hide بووبێت نیشان نادرێت تەنانەت ئەگەر پۆستیشی هەبێت
                    btn.style.display = (!isHiddenByBoss && hasAnyPosts) ? 'flex' : 'none';
                }
            }
        }
    }); 
};

window.updateTabContent = (tab) => {
    const display = document.getElementById('content-display');
    const subNav = document.getElementById('sub-nav-container');
    const subBar = document.getElementById('sub-nav-bar');
    if(!display) return;
    
    const isBoss = currentUser && currentUser.email === OWNER_EMAIL;

    if (['info', 'market', 'discount'].includes(tab)) {
        const availableSubs = subCategories[tab][currentLang].filter(sub => {
            const isHiddenByBoss = hiddenItems.factions.includes(sub);
            if (isBoss) return true;
            // بۆ یوزەر تەنها کاتێک نیشان بدە کە Hide نەکرابێت و پۆستیشی هەبێت
            return !isHiddenByBoss && allPosts.some(p => p.category === tab && p.sub_category === sub && p.lang === currentLang);
        });

        if (availableSubs.length > 0) {
            subNav.style.display = 'block';
            if (!activeSubCategory || !availableSubs.includes(activeSubCategory)) activeSubCategory = availableSubs[0];
            subBar.innerHTML = availableSubs.map(item => `
                <button class="sub-tab-btn ${activeSubCategory === item ? 'active' : ''}" 
                onclick="filterBySub('${tab}', '${item}')">
                    ${item} ${getHideBtn('factions', item)}
                </button>
            `).join('');
        } else {
            subNav.style.display = 'none';
        }
    } else { 
        subNav.style.display = 'none'; 
    }

    if (tab === 'account') { 
        renderAuthUI(); 
    } else {
        let filtered = allPosts.filter(p => p.lang === currentLang && p.category === tab);
        if (['info', 'market', 'discount'].includes(tab) && activeSubCategory) {
            filtered = filtered.filter(p => p.sub_category === activeSubCategory);
        }
        display.innerHTML = filtered.length ? filtered.map(p => renderPostHTML(p)).join('') : `<div class="text-center py-20 opacity-30">${uiTrans[currentLang].empty}</div>`;
    }
};

window.filterBySub = (tab, subName) => { 
    activeSubCategory = subName; 
    updateTabContent(tab); 
};

window.renderPostHTML = (p) => {
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === OWNER_EMAIL);
    const t = uiTrans[currentLang];
    const isLiked = currentUser && likeCounts[p.id] > 0; 
    const mediaHTML = p.media ? `<img src="${p.media}" class="post-media" loading="lazy">` : '';
    
    return `
    <div class="post-card animate-fade">
        ${mediaHTML}
        <div class="post-body">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] opacity-40">${timeAgo(p.id)}</span>
                <div class="flex gap-3">
                    ${p.post_link ? `<a href="${p.post_link}" target="_blank" class="text-blue-400"><i class="fas fa-link"></i></a>` : ''}
                    ${isAdmin ? `<button onclick="deletePost(${p.id})" class="text-red-500"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
            ${p.title ? `<div class="glass-title"><h3 class="font-bold">${p.title}</h3></div>` : ''}
            ${p.desc ? `<p class="text-sm opacity-70 mb-4">${p.desc}</p>` : ''}
            <div class="flex justify-between items-center border-t border-white/5 pt-3">
                <div class="flex gap-4">
                    <button onclick="toggleFavorite(${p.id})" class="flex items-center gap-1">
                        <i class="fa-heart ${isLiked ? 'fas text-red-500' : 'far opacity-50'}"></i>
                        <span class="text-xs">${likeCounts[p.id] || 0}</span>
                    </button>
                    <button onclick="openComments(${p.id})" class="flex items-center gap-1 opacity-60">
                        <i class="far fa-comment"></i><span class="text-xs">${(comments[p.id] || []).length}</span>
                    </button>
                </div>
                ${isAdmin ? `<span class="admin-name-tag">By: ${p.admin_name || 'Admin'}</span>` : ''}
            </div>
        </div>
    </div>`;
};

window.renderAuthUI = (mode = 'login') => {
    const display = document.getElementById('content-display');
    const t = uiTrans[currentLang];
    if (currentUser) {
        display.innerHTML = `<div class="glass-card p-8 text-center animate-fade">
            <div class="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">${currentUser.email[0].toUpperCase()}</div>
            <h2 class="text-xl font-bold mb-2">${currentUser.name || 'User'}</h2>
            <p class="text-xs opacity-40 mb-6">${currentUser.email}</p>
            <button class="auth-submit !bg-red-500/20 !text-red-400" onclick="logout()">${t.logout}</button>
        </div>`;
        return;
    }
    if (mode === 'login') {
        display.innerHTML = `<div class="glass-card p-6 animate-fade"><h2 class="text-xl font-bold mb-6 text-center">${t.login}</h2>
            <input id="auth-email" type="email" class="auth-input" placeholder="${t.email}">
            <input id="auth-pass" type="password" class="auth-input" placeholder="${t.pass}">
            <button class="auth-submit" onclick="handleLogin()">${t.login}</button>
            <p class="text-center mt-6 text-xs opacity-50">${t.noAcc} <span class="text-blue-400 cursor-pointer" onclick="renderAuthUI('register')">${t.register}</span></p></div>`;
    } else {
        display.innerHTML = `<div class="glass-card p-6 animate-fade"><h2 class="text-xl font-bold mb-6 text-center">${t.register}</h2>
            <input id="reg-user" type="text" class="auth-input" placeholder="${t.user}">
            <input id="reg-email" type="email" class="auth-input" placeholder="${t.email}">
            <input id="reg-pass" type="password" class="auth-input" placeholder="${t.pass}">
            <button class="auth-submit" onclick="handleRegister()">${t.register}</button>
            <p class="text-center mt-6 text-xs opacity-50">${t.hasAcc} <span class="text-blue-400 cursor-pointer" onclick="renderAuthUI('login')">${t.login}</span></p></div>`;
    }
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-email').value.trim().toLowerCase();
    const p = document.getElementById('auth-pass').value.trim();
    if (e === OWNER_EMAIL && p === OWNER_PASS) {
        currentUser = { email: e, name: 'Boss Belal', role: 'admin', last_active: Date.now() };
    } else {
        const { data } = await _supabase.from('users').select('*').eq('email', e).eq('password', p).single();
        if (data) {
            currentUser = data;
            await _supabase.from('users').update({ last_active: Date.now() }).eq('email', e);
        } else { alert(uiTrans[currentLang].authFail); return; }
    }
    localStorage.setItem('user', JSON.stringify(currentUser));
    window.location.reload();
};

window.handleRegister = async () => {
    const u = document.getElementById('reg-user').value.trim();
    const e = document.getElementById('reg-email').value.trim().toLowerCase();
    const p = document.getElementById('reg-pass').value.trim();
    if (!u || !e || !p) return;
    const { error } = await _supabase.from('users').insert([{ email: e, password: p, name: u, role: 'user', last_active: Date.now() }]);
    if (!error) { alert(uiTrans[currentLang].regSuccess); renderAuthUI('login'); }
};

window.logout = () => { localStorage.removeItem('user'); window.location.reload(); };

// --- Modals & Submits ---
window.openPostModal = () => {
    document.getElementById('post-modal').style.display = 'flex';
    window.updateSubSelect('news');
};
window.closePostModal = () => document.getElementById('post-modal').style.display = 'none';
window.openNotifModal = () => document.getElementById('notif-modal').style.display = 'flex';
window.closeNotifModal = () => document.getElementById('notif-modal').style.display = 'none';

window.updateSubSelect = (cat) => {
    const subSel = document.getElementById('post-sub-category');
    if (['info', 'market', 'discount'].includes(cat)) {
        subSel.style.display = 'block';
        subSel.innerHTML = subCategories[cat][currentLang].map(s => `<option value="${s}">${s}</option>`).join('');
    } else {
        subSel.style.display = 'none';
        subSel.value = "";
    }
};

window.submitPost = async () => {
    const title = document.getElementById('post-title').value; 
    const desc = document.getElementById('post-desc').value;
    const cat = document.getElementById('post-category').value; 
    const sub = document.getElementById('post-sub-category').value;
    const lang = document.getElementById('post-lang').value;
    const { error } = await _supabase.from('posts').insert([{ 
        title, desc, category: cat, sub_category: sub, lang, 
        admin_name: currentUser.name, user_email: currentUser.email, media: tempMedia.url 
    }]);
    if(!error) { window.closePostModal(); syncAllData(); }
};

window.openComments = (id) => { 
    activeCommentPostId = id; 
    document.getElementById('comment-modal').style.display = 'flex'; 
    renderComments(); 
    const area = document.getElementById('comment-input-area');
    if(!currentUser) area.innerHTML = `<p class="text-center text-xs text-yellow-500">${uiTrans[currentLang].noComment}</p>`;
    else area.innerHTML = `<div class="flex gap-2 p-2"><input id="comment-input" type="text" class="auth-input flex-1" placeholder="..."><button onclick="submitComment()" class="p-2 bg-green-500 rounded-lg"><i class="fas fa-paper-plane"></i></button></div>`;
};
window.closeCommentModal = () => document.getElementById('comment-modal').style.display = 'none';

window.renderComments = () => {
    const list = document.getElementById('comment-list');
    const allComs = comments[activeCommentPostId] || [];
    list.innerHTML = allComs.map(c => `<div class="bg-white/5 p-2 rounded-lg mb-2"><span class="text-[10px] opacity-40">@${c.user_name}</span><p class="text-sm">${c.text}</p></div>`).join('') || 'Empty';
};

window.submitComment = async () => {
    const val = document.getElementById('comment-input').value;
    if(!val) return;
    await _supabase.from('comments').insert([{ post_id: activeCommentPostId, text: val, user_name: currentUser.name, user_email: currentUser.email }]);
    document.getElementById('comment-input').value = "";
    syncAllData(); setTimeout(renderComments, 500);
};

window.deletePost = async (id) => { if(confirm('Delete?')) { await _supabase.from('posts').delete().eq('id', id); syncAllData(); } };

window.showAllNotifs = () => {
    document.getElementById('heart-overlay').style.display = 'block';
    document.getElementById('fav-title-main').innerText = uiTrans[currentLang].notifSec;
    document.getElementById('fav-nav-tabs').style.display = 'none';
    const items = allPosts.filter(p => p.category === 'notif' && p.lang === currentLang);
    document.getElementById('fav-items-display').innerHTML = items.length ? items.map(p => renderPostHTML(p)).join('') : 'Empty';
};

window.openHeartMenu = () => {
    if(!currentUser) { alert(uiTrans[currentLang].authErr); return; }
    document.getElementById('heart-overlay').style.display = 'block';
    document.getElementById('fav-title-main').innerText = uiTrans[currentLang].fav;
    document.getElementById('fav-nav-tabs').style.display = 'flex';
    window.showFavorites('post');
};
window.closeHeartMenu = () => document.getElementById('heart-overlay').style.display = 'none';

window.showFavorites = (type) => {
    const items = allPosts.filter(p => (type === 'post' ? p.category !== 'notif' : p.category === 'notif') && likeCounts[p.id] > 0);
    document.getElementById('fav-items-display').innerHTML = items.length ? items.map(p => renderPostHTML(p)).join('') : 'Empty';
};

function renderUsers(users) {
    const list = document.getElementById('admin-user-list');
    if (!list) return;
    list.innerHTML = users.map(u => {
        const isOnline = (Date.now() - (u.last_active || 0)) < 300000;
        return `
        <div class="glass-card p-3 flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}"></div>
                <div><p class="font-bold text-sm">${u.name}</p><p class="text-[10px] opacity-40">${u.email}</p></div>
            </div>
            <span class="text-[10px] p-1 rounded ${u.role==='admin'?'bg-red-500':'bg-blue-500'}">${u.role.toUpperCase()}</span>
        </div>`;
    }).join('');
}

window.openCloudinaryWidget = () => {
    const url = prompt("Enter image URL:");
    if(url) { tempMedia.url = url; document.getElementById('upload-status').innerText = "Image Selected!"; }
};

// --- Init ---
async function init() {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    if (currentUser) await _supabase.from('users').update({ last_active: Date.now() }).eq('email', currentUser.email);
    await syncAllData();
    updateUIScript();
    const lastTab = localStorage.getItem('lastMainTab') || 'news';
    changeTab(lastTab, document.getElementById('nav-btn-' + lastTab));
    setInterval(() => {
        if (currentUser) _supabase.from('users').update({ last_active: Date.now() }).eq('email', currentUser.email);
    }, 60000);
}
init();
