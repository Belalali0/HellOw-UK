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
        
        if (currentUser) {
            await _supabase.from('users').update({ last_active: Date.now() }).eq('email', currentUser.email);
        }

        updateUIScript();
        updateTabContent(localStorage.getItem('lastMainTab') || 'news');
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

// --- Core Helper Functions ---

window.timeAgo = (ts) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    const t = uiTrans[currentLang];
    if (seconds < 60) return t.now;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m " + t.ago;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h " + t.ago;
    return Math.floor(hours / 24) + "d " + t.ago;
};

function formatFullDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// --- Initialization ---

async function init() {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    await syncAllData(); 
    
    const lastMain = localStorage.getItem('lastMainTab') || 'news';
    const activeBtn = document.getElementById('nav-btn-' + lastMain);
    if(activeBtn) changeTab(lastMain, activeBtn);
    
    checkNewNotifs();
    
    // Admin Toggle
    const brandName = document.querySelector('.glass-logo');
    if(brandName) {
        brandName.onclick = () => {
            const bar = document.getElementById('admin-quick-bar');
            if(currentUser && currentUser.email === OWNER_EMAIL) {
                bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
            }
        };
    }
}

// --- UI Updates ---

window.updateUIScript = () => { 
    const t = uiTrans[currentLang]; 
    const activeCodeEl = document.getElementById('active-lang-code');
    if(activeCodeEl) activeCodeEl.innerText = currentLang.toUpperCase(); 

    const isBoss = currentUser && currentUser.email === OWNER_EMAIL;
    
    // Update Nav visibility based on content and boss settings
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
    if(!display) return;
    
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
                <button class="sub-tab-btn ${activeSubCategory === item ? 'active' : ''}" 
                onclick="filterBySub('${tab}', '${item}')">
                    ${item}
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
            filtered = filtered.filter(p => p.sub_category === activeSubCategory);
        }
        display.innerHTML = filtered.length ? filtered.map(p => renderPostHTML(p)).join('') : `<div class="text-center py-20 opacity-30">${uiTrans[currentLang].empty}</div>`;
    }
};

// --- Post & Comment Rendering ---

window.renderPostHTML = (p) => {
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.email === OWNER_EMAIL);
    const t = uiTrans[currentLang];
    const isLiked = currentUser && likeCounts[p.id] > 0; // Simple check for visual
    const mediaHTML = p.media ? `<img src="${p.media}" class="post-media" loading="lazy">` : '';
    
    let expiryHTML = '';
    if (p.expiry_date && p.expiry_date !== 'never') {
        const diff = p.expiry_date - Date.now();
        const days = Math.floor(diff / 86400000);
        expiryHTML = `<span class="expiry-tag"><i class="far fa-clock"></i> ${t.time_left} ${days}d</span>`;
    }

    return `
    <div class="post-card animate-fade">
        ${mediaHTML}
        <div class="post-body">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] opacity-40">${timeAgo(p.id)}</span>
                <div class="flex gap-3">
                    ${isAdmin ? `<button onclick="deletePost(${p.id})" class="text-red-500 opacity-40"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            </div>
            ${p.title ? `<div class="glass-title"><h3 class="font-bold text-md">${p.title}</h3></div>` : ''}
            ${p.desc ? `<p class="text-sm opacity-70 mb-4">${p.desc}</p>` : ''}
            <div class="flex justify-between items-center border-t border-white/5 pt-3">
                <div class="flex gap-6">
                    <button onclick="toggleFavorite(${p.id})" class="flex items-center gap-2">
                        <i class="fas fa-heart ${isLiked ? 'text-red-500' : 'opacity-20'}"></i>
                        <span class="text-xs">${likeCounts[p.id] || 0}</span>
                    </button>
                    <button onclick="openComments(${p.id})" class="flex items-center gap-2 opacity-60">
                        <i class="far fa-comment-dots"></i><span class="text-xs">${(comments[p.id] || []).length}</span>
                    </button>
                </div>
                ${expiryHTML}
            </div>
        </div>
    </div>`;
};

// --- Auth logic ---

window.handleLogin = async () => {
    const e = document.getElementById('auth-email').value.trim().toLowerCase();
    const p = document.getElementById('auth-pass').value.trim();
    
    if (e === OWNER_EMAIL && p === OWNER_PASS) {
        currentUser = { email: e, name: 'Boss Belal', role: 'admin' };
        localStorage.setItem('user', JSON.stringify(currentUser));
        location.reload(); 
        return;
    }

    const { data: user } = await _supabase.from('users').select('*').eq('email', e).eq('password', p).single();
    if (user) { 
        currentUser = user; 
        localStorage.setItem('user', JSON.stringify(currentUser)); 
        location.reload(); 
    } else { 
        alert(uiTrans[currentLang].authFail); 
    }
};

window.logout = () => {
    localStorage.removeItem('user');
    location.reload();
};

// --- Modals Control ---

window.openPostModal = () => document.getElementById('post-modal').style.display = 'flex';
window.closePostModal = () => document.getElementById('post-modal').style.display = 'none';
window.openNotifModal = () => document.getElementById('notif-modal').style.display = 'flex';
window.closeNotifModal = () => document.getElementById('notif-modal').style.display = 'none';
window.closeLangMenu = () => document.getElementById('lang-overlay').style.display = 'none';
window.closeHeartMenu = () => document.getElementById('heart-overlay').style.display = 'none';
window.closeCommentModal = () => document.getElementById('comment-modal').style.display = 'none';

window.openLangMenu = () => document.getElementById('lang-overlay').style.display = 'flex';

window.changeLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    window.closeLangMenu();
    updateUIScript();
    updateTabContent(localStorage.getItem('lastMainTab') || 'news');
};

window.changeTab = (tab, el) => { 
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active')); 
    if(el) el.classList.add('active'); 
    localStorage.setItem('lastMainTab', tab);
    updateTabContent(tab); 
};

// --- Database Interactions ---

window.submitPost = async () => {
    const title = document.getElementById('post-title').value; 
    const desc = document.getElementById('post-desc').value;
    const cat = document.getElementById('post-category').value; 
    const lang = document.getElementById('post-lang').value;
    
    const { error } = await _supabase.from('posts').insert([{
        title, desc, category: cat, lang, 
        user_email: currentUser?.email,
        admin_name: currentUser?.name || "Admin"
    }]);

    if(!error) {
        closePostModal();
        await syncAllData();
    }
};

window.toggleFavorite = async (id) => {
    if (!currentUser) return alert(uiTrans[currentLang].authErr);
    const { data: existing } = await _supabase.from('likes').select('*').eq('post_id', id).eq('user_email', currentUser.email).single();
    if (existing) {
        await _supabase.from('likes').delete().eq('id', existing.id);
    } else {
        await _supabase.from('likes').insert([{ post_id: id, user_email: currentUser.email }]);
    }
    await syncAllData();
};

window.openComments = (id) => {
    activeCommentPostId = id;
    document.getElementById('comment-modal').style.display = 'flex';
    renderComments();
    updateCommentInputArea();
};

window.renderComments = () => {
    const list = document.getElementById('comment-list');
    const coms = comments[activeCommentPostId] || [];
    list.innerHTML = coms.map(c => `
        <div class="bg-white/5 p-3 rounded-xl">
            <b class="text-[10px] text-blue-400">@${c.user_name}</b>
            <p class="text-sm">${c.text}</p>
        </div>
    `).join('') || '<p class="text-center opacity-20 mt-4">No comments</p>';
};

window.submitComment = async () => {
    const input = document.getElementById('comment-input');
    if (!input.value.trim() || !currentUser) return;
    
    await _supabase.from('comments').insert([{
        post_id: activeCommentPostId,
        user_email: currentUser.email,
        user_name: currentUser.name || "User",
        text: input.value
    }]);
    
    input.value = '';
    await syncAllData();
    renderComments();
};

window.updateCommentInputArea = () => {
    const area = document.getElementById('comment-input-area');
    if (!currentUser) {
        area.innerHTML = `<p class="p-4 text-center text-xs text-yellow-500">${uiTrans[currentLang].noComment}</p>`;
        return;
    }
    area.innerHTML = `
        <div class="flex gap-2 p-2">
            <input id="comment-input" type="text" class="auth-input flex-1 !mb-0" placeholder="Write...">
            <button onclick="submitComment()" class="p-3 bg-green-500 rounded-xl"><i class="fas fa-paper-plane text-black"></i></button>
        </div>`;
};

// --- Search & Stats ---

window.searchUsers = (val) => {
    const filtered = registeredUsers.filter(u => u.email.includes(val.toLowerCase()) || (u.name && u.name.toLowerCase().includes(val.toLowerCase())));
    renderUsers(filtered);
};

function checkNewNotifs() {
    const lastSeen = localStorage.getItem('lastNotifSeen') || 0;
    const latestNotif = allPosts.find(p => p.category === 'notif' && p.id > lastSeen);
    if (latestNotif) {
        const toast = document.getElementById('toast-area');
        document.getElementById('toast-title').innerText = latestNotif.title;
        document.getElementById('toast-desc').innerText = latestNotif.desc;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 5000);
        localStorage.setItem('lastNotifSeen', latestNotif.id);
    }
}

// Start app
init();
