// --- Variables & State ---
const supabaseUrl = 'https://yqjfdtrjngwaoeygeiqh.supabase.co';
const supabaseKey = 'sb_publishable_kR58sr2ch1wun_WmJqmetw_ailryRxc';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentLang = localStorage.getItem('appLang') || 'ku';
let isDarkMode = localStorage.getItem('theme') !== 'light';
let allPosts = []; 
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

// فەچکردنی پۆستەکان بە شێوەی دروست لە سێرڤەرەوە
async function syncPostsWithServer() {
    try {
        const { data, error } = await _supabase
            .from('posts')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (data) {
            allPosts = data;
            const currentTab = localStorage.getItem('lastMainTab') || 'news';
            updateTabContent(currentTab);
            updateUIScript();
        }
    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

function ensureOwnerAccount() {
    const ownerIdx = registeredUsers.findIndex(u => u.email === OWNER_EMAIL);
    if (ownerIdx === -1) {
        registeredUsers.push({ email: OWNER_EMAIL, password: 'belal5171', name: 'Belal', role: 'admin', lastActive: Date.now() });
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    } else {
        registeredUsers[ownerIdx].password = 'belal5171';
        registeredUsers[ownerIdx].role = 'admin';
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }
}

const uiTrans = {
    ku: { news: "هەواڵ", info: "زانیاری", market: "بازاڕ", discount: "داشکاندن", account: "ئەکاونت", fav: "دڵخوازەکان", notifSec: "بەشی نۆتفیکەیشن", login: "چوونە ژوورەوە", logout: "دەرچوون", email: "ئیمەیڵ", empty: "هیچ پۆستێک نییە", ago: "لەمەوپێش", now: "ئێستا", rep: "وەڵام", del: "سڕینەوە", edit: "دەستکاری", authErr: "ببورە پێویستە ئەکاونتت هەبێت", yes: "بەڵێ", no: "نەخێر", post: "پۆستەکان", notif: "نۆتفی", time_left: "ماوە:", ads_for: "بۆ ماوەی:", pass: "پاسۆرد", user: "ناو", register: "دروستکردنی ئەکاونت", noAcc: "ئەکاونتت نییە؟", hasAcc: "ئەکاونتت هەیە؟", authFail: "ئیمەیڵ یان پاسۆرد هەڵەیە", regSuccess: "ئەکاونت دروستکرا", post_time: "کاتی پۆست:", noComment: "ناتوانی کۆمێنت بکەی ئەگەر ئەکاونتت نەبێت", wantReg: "ئەتەوێت ئەکاونت دروست بکەیت؟", notifMsg: "ئەگەر بێتاقەتیت و بێزاری ئەکاونت دروست بکە من هەموو ڕۆژێک ئینێرجی باشت پێ ئەدەم بۆ ڕۆژەکەت" },
    en: { news: "News", info: "Info", market: "Market", discount: "Discount", account: "Account", fav: "Favorites", notifSec: "Notification Section", login: "Login", logout: "Logout", email: "Email", empty: "No posts yet", ago: "ago", now: "now", rep: "Reply", del: "Delete", edit: "Edit", authErr: "Sorry, you need an account", yes: "Yes", no: "No", post: "Posts", notif: "Notif", time_left: "Left:", ads_for: "For:", pass: "Password", user: "Username", register: "Register", noAcc: "No account?", hasAcc: "Have account?", authFail: "Wrong email or password", regSuccess: "Account Created", post_time: "Post time:", noComment: "You cannot comment without an account", wantReg: "Do you want to create an account?", notifMsg: "If you're bored or tired, create an account and I'll give you good energy every day for your day" },
    ar: { news: "الأخبار", info: "معلومات", market: "السوق", discount: "تخفیضات", account: "الحساب", fav: "المفضلة", notifSec: "قسم الإشعارات", login: "تسجيل الدخول", logout: "تسجيل الخروج", email: "الإيميل", empty: "لا يوجد منشورات", ago: "منذ", now: "الآن", rep: "رد", del: "حذف", edit: "تعديل", authErr: "عذراً، يجب أن يكون لديك حساب", yes: "نعم", no: "لا", post: "المنشورات", notif: "إشعار", time_left: "باقي:", ads_for: "لمدة:", pass: "كلمة السر", user: "الاسم", register: "إنشاء حساب", noAcc: "ليس لديك حساب؟", hasAcc: "لديك حساب؟", authFail: "الإيميل أو كلمة السر خطأ", regSuccess: "تم إنشاء الحساب", post_time: "وقت النشر:", noComment: "لا يمكنك التعليق بدون حساب", wantReg: "هل تريد إنشاء حساب؟", notifMsg: "إذا كنت تشعر بالملل أو السأم، فأنشئ حساباً وسأمنحك طاقة جيدة كل يوم ليومك" },
    fa: { news: "اخبار", info: "اطلاعات", market: "بازار", discount: "تخفیف", account: "حساب", fav: "علاقه مندی", notifSec: "بخش اعلان‌ها", login: "ورود", logout: "خروج", email: "ایمیل", empty: "پستی وجود ندارد", ago: "پیش", now: "الان", rep: "پاسخ", del: "حذف", edit: "ویرایش", authErr: "ببخشید، باید حساب کاربری داشته باشید", yes: "بله", no: "خیر", post: "پست‌ها", notif: "اعلان", time_left: "زمان باقی‌مانده:", ads_for: "برای مدت:", pass: "رمز عبور", user: "نام", register: "ساخت حساب", noAcc: "حساب ندارید؟", hasAcc: "حساب دارید؟", authFail: "ایمیل یا رمز عبور اشتباه است", regSuccess: "حساب ساخته شد", post_time: "زمان ارسال:", noComment: "بدون حساب کاربری نمی‌توانید نظر بدهید", wantReg: "آیا می‌خواهید حساب کاربری بسازید؟", notifMsg: "اگر بی حوصله یا خسته هستید، یک حساب کاربری بسازید و من هر روز انرژی خوبی برای روزتان به شما می دهم" }
};

const subCategories = {
    info: { ku: ["کۆلێژ", "ڕێکخراو", "هەلیکار"], en: ["College", "Organization", "Jobs"], ar: ["كلية", "منظمة", "وظائف"], fa: ["دانشکده", "سازمان", "کاریابی"] },
    market: { ku: ["سەیارە", "بزنس", "خانوو"], en: ["Cars", "Business", "House"], ar: ["سيارات", "تجارة", "عقارات"], fa: ["ماشین", "تجارت", "خانه"] },
    discount: { ku: ["ڕێستۆرانت", "جلوبەرگ", "مارکێت"], en: ["Restaurant", "Clothing", "Market"], ar: ["مطعم", "ملابس", "مارکت"], fa: ["رستوران", "پوشاک", "مارکت"] }
};

async function init() {
    ensureOwnerAccount();
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    
    await syncPostsWithServer();
    
    updateUIScript();
    updateHeartUI();
    updateBossIcon();
    
    const lastMain = localStorage.getItem('lastMainTab') || 'news';
    const activeBtn = document.getElementById('nav-btn-' + lastMain);
    if(activeBtn) changeTab(lastMain, activeBtn);
    
    checkNewNotifs();
    updateNotifToggleUI();
    trackUserActivity();

    _supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
            syncPostsWithServer();
        })
        .subscribe();
}

function updateBossIcon() {
    const bossIcon = document.getElementById('boss-admin-icon');
    if (bossIcon) bossIcon.style.display = (currentUser && currentUser.email === OWNER_EMAIL) ? 'block' : 'none';
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

function getHideBtn(type, value) {
    if (!(currentUser && currentUser.email === OWNER_EMAIL)) return "";
    const isHidden = hiddenItems[type].includes(value);
    return `<i class="fas ${isHidden ? 'fa-eye-slash text-red-500' : 'fa-eye text-green-500'} ml-2 cursor-pointer pointer-events-auto" 
               onclick="toggleHideItem('${type}', '${value}', event)"></i>`;
}

window.changeTab = (tab, el) => { 
    closeHeartMenu(); 
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
            const isHiddenByBoss = hiddenItems.langs.includes(l);
            const langName = l === 'ku' ? 'Kurdî' : (l === 'en' ? 'English' : (l === 'ar' ? 'العربية' : 'فارسی'));
            if (isBoss) {
                return `<div class="flex items-center justify-between w-full bg-white/5 rounded-xl p-1 mb-2">
                    <button onclick="changeLanguage('${l}')" class="lang-btn-glass !mb-0 flex-1">${langName}</button>
                    ${getHideBtn('langs', l)}
                </div>`;
            } else if (!isHiddenByBoss) {
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
                if (isBoss) {
                    btn.style.display = 'flex';
                    btn.querySelectorAll('.fa-eye, .fa-eye-slash').forEach(e=>e.remove());
                    btn.insertAdjacentHTML('beforeend', getHideBtn('navs', k));
                } else {
                    btn.style.display = (!isHiddenByBoss) ? 'flex' : 'none';
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
            return !isHiddenByBoss; 
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

function formatFullDate(ts) {
    const d = new Date(ts);
    return d.getFullYear() + "/" + (d.getMonth() + 1).toString().padStart(2, '0') + "/" + d.getDate().toString().padStart(2, '0') + " " + d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
}

window.renderPostHTML = (p) => {
    const favList = currentUser ? (userFavorites[currentUser.email] || []) : [];
    const isLiked = favList.some(f => f.id === p.id);
    const mediaHTML = p.media ? `<img src="${p.media}" class="post-media">` : '';
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

window.renderAuthUI = (mode = 'login') => {
    const display = document.getElementById('content-display');
    const t = uiTrans[currentLang];
    if (currentUser) {
        display.innerHTML = `<div class="glass-card p-8 text-center animate-fade"><div class="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">${currentUser.email[0].toUpperCase()}</div><h2 class="text-xl font-bold mb-2">${currentUser.name || currentUser.email.split('@')[0]}</h2><p class="text-xs opacity-40 mb-6">${currentUser.email}</p><button class="auth-submit !bg-red-500/20 !text-red-400 !border-red-500/30" onclick="logout()">${t.logout}</button></div>`;
        return;
    }
    if (mode === 'login') {
        display.innerHTML = `<div class="glass-card p-6 animate-fade"><h2 class="text-xl font-bold mb-6 text-center">${t.login}</h2><input id="auth-email" type="email" class="auth-input" placeholder="${t.email}"><input id="auth-pass" type="password" class="auth-input" placeholder="${t.pass}"><button class="auth-submit" onclick="handleLogin()">${t.login}</button><p class="text-center mt-6 text-xs opacity-50">${t.noAcc} <span class="text-blue-400 cursor-pointer" onclick="renderAuthUI('register')">${t.register}</span></p></div>`;
    } else {
        display.innerHTML = `<div class="glass-card p-6 animate-fade"><h2 class="text-xl font-bold mb-6 text-center">${t.register}</h2><input id="reg-user" type="text" class="auth-input" placeholder="${t.user}"><input id="reg-email" type="email" class="auth-input" placeholder="${t.email}"><input id="reg-pass" type="password" class="auth-input" placeholder="${t.pass}"><button class="auth-submit !bg-blue-500/20 !text-blue-300" onclick="handleRegister()">${t.register}</button><p class="text-center mt-6 text-xs opacity-50">${t.hasAcc} <span class="text-blue-400 cursor-pointer" onclick="renderAuthUI('login')">${t.login}</span></p></div>`;
    }
};

window.handleLogin = () => {
    const e = document.getElementById('auth-email').value.trim();
    const p = document.getElementById('auth-pass').value.trim();
    const user = registeredUsers.find(u => u.email === e && u.password === p);
    if (user) { currentUser = user; localStorage.setItem('user', JSON.stringify(currentUser)); trackUserActivity(); init(); } else { alert(uiTrans[currentLang].authFail); }
};

window.handleRegister = () => {
    const u = document.getElementById('reg-user').value.trim();
    const e = document.getElementById('reg-email').value.trim();
    const p = document.getElementById('reg-pass').value.trim();
    if (!u || !e || !p) return;
    if (registeredUsers.some(user => user.email === e)) { alert("Email already exists"); return; }
    const newUser = { email: e, password: p, name: u, role: e === OWNER_EMAIL ? 'admin' : 'user', lastActive: Date.now() };
    registeredUsers.push(newUser); localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    alert(uiTrans[currentLang].regSuccess); renderAuthUI('login');
};

window.filterBySub = (tab, subName) => { activeSubCategory = subName; lastVisitedSub[tab] = subName; localStorage.setItem('lastVisitedSub', JSON.stringify(lastVisitedSub)); updateTabContent(tab); };

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

window.showFavorites = (type) => {
    currentFavTab = type; document.querySelectorAll('.fav-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(type === 'post' ? 'btn-fav-post' : 'btn-fav-notif');
    if(btn) btn.classList.add('active');
    let favData = currentUser ? (userFavorites[currentUser.email] || []) : []; favData.sort((a,b) => b.likedAt - a.likedAt);
    const items = favData.map(f => allPosts.find(p => p.id === f.id)).filter(p => p && (type === 'post' ? p.category !== 'notif' : p.category === 'notif'));
    document.getElementById('fav-items-display').innerHTML = items.length ? items.map(p => renderPostHTML(p)).join('') : '<p class="text-center opacity-20 mt-10">Empty</p>';
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
    
    let expiryDate = "never"; 
    if (duration !== "never") { 
        const units = { '1w': 7, '2w': 14, '3w': 21, '1m': 30, '2m': 60, '3m': 90 }; 
        expiryDate = Date.now() + (units[duration] * 86400000); 
    }
    
    const adminName = currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : "Admin";
    const userEmail = currentUser ? currentUser.email : "system";
    
    const newPost = { 
        title: title, 
        desc: desc, 
        postLink: postLink,
        adminName: adminName, 
        userEmail: userEmail, 
        lang: document.getElementById('post-lang').value, 
        category: cat, 
        subCategory: document.getElementById('post-sub-category').value || "", 
        expiryDate: expiryDate, 
        durationLabel: durationLabel, 
        media: tempMedia.url || ""
    };

    try {
        const { error } = await _supabase.from('posts').insert([newPost]);
        if (error) throw error;

        document.getElementById('post-title').value = "";
        document.getElementById('post-desc').value = "";
        if(document.getElementById('post-external-link')) document.getElementById('post-external-link').value = "";
        tempMedia = { url: "", type: "" };
        document.getElementById('upload-status').innerText = "";

        closePostModal(); 
        await syncPostsWithServer();
    } catch (err) {
        alert("Error saving post: " + err.message);
    }
};

window.submitNotif = async () => {
    const title = document.getElementById('notif-title').value; 
    const desc = document.getElementById('notif-desc').value;
    const lang = document.getElementById('notif-lang').value; 
    if(!title && !desc) return;
    
    const newNotif = { 
        title: title, 
        desc: desc, 
        adminName: (currentUser?.name || "Admin"), 
        userEmail: currentUser?.email || "system", 
        lang: lang, 
        category: 'notif', 
        media: "", 
        expiryDate: "never", 
        durationLabel: "Never" 
    };

    await _supabase.from('posts').insert([newNotif]);
    closeNotifModal(); 
    await syncPostsWithServer();
    if(lang === currentLang && currentUser && notifOnScreen) fireToast(title || "Notif", desc || "");
};

window.openAdminStats = () => { document.getElementById('admin-stats-modal').style.display = 'flex'; filterUserList('all'); };
window.closeAdminStats = () => document.getElementById('admin-stats-modal').style.display = 'none';
window.filterUserList = (filterType) => {
    const now = Date.now();
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    if(document.getElementById('btn-stat-' + filterType)) document.getElementById('btn-stat-' + filterType).classList.add('active');
    let usersToDisplay = (filterType === 'all') ? registeredUsers : registeredUsers.filter(u => (now - u.lastActive) < 300000);
    renderUsers(usersToDisplay); updateCounters();
};

function renderUsers(users) {
    const list = document.getElementById('admin-user-list'); const isBoss = currentUser?.email === OWNER_EMAIL;
    list.innerHTML = users.map(u => {
        const isUserBoss = u.email === OWNER_EMAIL;
        const postCount = allPosts.filter(p => p.userEmail === u.email).length;
        const roleLabel = isUserBoss ? "BOSS" : (u.role === "admin" ? "ADMIN" : "USER");
        const roleColor = isUserBoss ? "bg-yellow-500/30 border-yellow-500/50" : (u.role === "admin" ? "bg-red-500/30 border-red-500/50" : "bg-blue-500/20 border-blue-500/30");
        return `<div class="glass-card p-3 flex justify-between items-center mb-2 animate-fade"><div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full ${(Date.now() - u.lastActive) < 300000 ? 'bg-green-500' : 'bg-gray-500'}"></div><div><div class="flex items-center gap-2"><span class="font-bold text-sm">${u.name || u.email.split('@')[0]}</span><span class="text-[8px] px-1.5 py-0.5 rounded-md border backdrop-blur-md ${roleColor}">${roleLabel}</span></div><span class="text-[10px] opacity-40 italic d-block">${u.email}</span><div class="text-[10px] text-green-400 mt-1 font-bold">Posts: ${postCount}</div></div></div>${isBoss && !isUserBoss ? `<button onclick="toggleUserRole('${u.email}')" class="px-3 py-1 rounded-full text-[9px] border backdrop-blur-lg">${u.role === 'admin' ? 'SET USER' : 'SET ADMIN'}</button>` : ''}</div>`;
    }).join('');
}

window.toggleUserRole = (email) => { if (currentUser?.email !== OWNER_EMAIL) return; const idx = registeredUsers.findIndex(u => u.email === email); if (idx !== -1) { registeredUsers[idx].role = registeredUsers[idx].role === 'admin' ? 'user' : 'admin'; localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers)); filterUserList('all'); } };
function updateCounters() { const now = Date.now(); document.getElementById('stat-total-users').innerText = registeredUsers.length; document.getElementById('stat-online-users').innerText = registeredUsers.filter(u => (now - u.lastActive) < 300000).length; document.getElementById('stat-guest-users').innerText = guestActivity.filter(g => (now - g.lastActive) < 300000).length; }

window.showAllNotifs = () => {
    const t = uiTrans[currentLang];
    document.getElementById('heart-overlay').style.display='block'; 
    document.getElementById('fav-title-main').innerText = t.notifSec;
    document.getElementById('fav-nav-tabs').style.display = 'none'; 
    document.getElementById('notif-toggle-btn').style.display = 'flex';
    
    if (!currentUser) {
        document.getElementById('fav-items-display').innerHTML = `
            <div class="p-8 text-center animate-fade">
                <i class="fas fa-bullhorn text-4xl mb-4 opacity-20"></i>
                <p class="text-sm leading-relaxed opacity-80 mb-4">${t.notifMsg}</p>
                <p class="text-[10px] opacity-40 mb-6">${t.wantReg}</p>
                <div class="flex gap-3 px-4">
                    <button onclick="goToAccountTab()" class="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-xs">${t.yes}</button>
                    <button onclick="closeHeartMenu()" class="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs">${t.no}</button>
                </div>
            </div>`;
    } else {
        const items = allPosts.filter(p => p.category === 'notif' && p.lang === currentLang).sort((a,b)=>b.id-a.id);
        document.getElementById('fav-items-display').innerHTML = items.length ? items.map(p => renderPostHTML(p)).join('') : '<p class="text-center opacity-20 mt-10">Empty</p>';
    }
};

window.openHeartMenu = () => { document.getElementById('heart-overlay').style.display='block'; document.getElementById('fav-title-main').innerText = uiTrans[currentLang].fav; document.getElementById('fav-nav-tabs').style.display = 'flex'; document.getElementById('notif-toggle-btn').style.display = 'none'; showFavorites('post'); };
function trackUserActivity() { 
    const now = Date.now(); if (currentUser) { 
        let idx = registeredUsers.findIndex(u => u.email === currentUser.email); 
        if (idx !== -1) { registeredUsers[idx].lastActive = now; } 
        else { registeredUsers.push({ email: currentUser.email, name: currentUser.name, role: 'user', lastActive: now, password: currentUser.password }); } 
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers)); 
    } else { 
        let gId = localStorage.getItem('guestId') || 'Guest_'+Math.floor(Math.random()*1000); localStorage.setItem('guestId', gId); 
        let gIdx = guestActivity.findIndex(g => g.id === gId); if(gIdx !== -1) guestActivity[gIdx].lastActive = now; else guestActivity.push({id:gId, lastActive:now}); 
        localStorage.setItem('guestActivity', JSON.stringify(guestActivity)); 
    } 
}
function checkNewNotifs() { if(!currentUser) return; const lastSeen = parseInt(localStorage.getItem('lastNotifSeen') || 0); const newOnes = allPosts.filter(p => p.category === 'notif' && p.id > lastSeen && p.lang === currentLang); if(newOnes.length > 0) { let i = 0; const inv = setInterval(() => { if(i < newOnes.length) { if(notifOnScreen) fireToast(newOnes[i].title, newOnes[i].desc); i++; } else { clearInterval(inv); localStorage.setItem('lastNotifSeen', Date.now()); } }, 1500); } }
function fireToast(t, d) { const audio = document.getElementById('notif-sound'); if(audio) audio.play().catch(e=>{}); const toast = document.getElementById('toast-area'); document.getElementById('toast-title').innerText = t; document.getElementById('toast-desc').innerText = d; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 6000); }

window.openComments = (id) => { activeCommentPostId = id; replyingToId = null; document.getElementById('comment-modal').style.display = 'flex'; renderComments(); updateCommentInputArea(); };

window.updateCommentInputArea = () => {
    const area = document.getElementById('comment-input-area');
    const t = uiTrans[currentLang];
    if(!currentUser) { 
        area.innerHTML = `<div class="p-4 text-center text-xs text-yellow-500 font-bold bg-yellow-500/5 rounded-xl border border-yellow-500/20 m-2">${t.noComment}</div>`; 
        return; 
    }
    area.innerHTML = `
        ${replyingToId ? `<div class="px-4 py-1 text-[10px] bg-blue-500/10 flex justify-between"><span>Replying to...</span><button onclick="cancelReply()" class="text-red-400">Cancel</button></div>` : ''}
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
    }).join('') || '<p class="text-center opacity-20">Empty</p>';
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
    comments[activeCommentPostId].push({ id: Date.now(), parentId: replyingToId, userEmail: currentUser.email, userName: (currentUser.name || currentUser.email.split('@')[0]), text: input.value });
    localStorage.setItem('postComments', JSON.stringify(comments));
    input.value = ''; replyingToId = null; renderComments(); updateTabContent(localStorage.getItem('lastMainTab'));
};
window.setReply = (id) => { replyingToId = id; updateCommentInputArea(); document.getElementById('comment-input').focus(); };
window.cancelReply = () => { replyingToId = null; updateCommentInputArea(); };
window.deleteComment = (comId) => { if(!confirm("Delete?")) return; comments[activeCommentPostId] = comments[activeCommentPostId].filter(c => c.id !== comId && c.parentId !== comId); localStorage.setItem('postComments', JSON.stringify(comments)); renderComments(); updateTabContent(localStorage.getItem('lastMainTab')); };

window.deletePost = async (id) => { 
    if(confirm('Delete?')) { 
        const { error } = await _supabase.from('posts').delete().eq('id', id);
        if (!error) {
            allPosts = allPosts.filter(x => x.id !== id);
            await syncPostsWithServer();
        } else {
            alert("Error deleting post");
        }
    } 
};

window.logout = () => { currentUser = null; localStorage.removeItem('user'); init(); };
window.changeLanguage = (l) => { currentLang = l; localStorage.setItem('appLang', l); init(); closeLangMenu(); };
window.toggleTheme = () => { isDarkMode = !isDarkMode; localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); init(); };
window.updateHeartUI = () => { const h = document.getElementById('main-heart'); if(h) h.className = currentUser ? 'fas fa-heart text-red-500' : 'fas fa-heart-broken opacity-30'; };
window.closeLangMenu = () => { document.getElementById('lang-overlay').style.display = 'none'; };
window.openLangMenu = () => { document.getElementById('lang-overlay').style.display = 'flex'; };
window.openPostModal = () => { document.getElementById('post-modal').style.display = 'flex'; };
window.closePostModal = () => { document.getElementById('post-modal').style.display = 'none'; };
window.openNotifModal = () => { document.getElementById('notif-modal').style.display = 'flex'; };
window.closeNotifModal = () => { document.getElementById('notif-modal').style.display = 'none'; };
window.closeCommentModal = () => { document.getElementById('comment-modal').style.display='none'; };
window.closeHeartMenu = () => { document.getElementById('heart-overlay').style.display='none'; };
window.openCloudinaryWidget = () => { cloudinary.openUploadWidget({ cloudName: "dbttb8vmg", uploadPreset: "Hellowuk" }, (err, res) => { if (res.event === "success") { tempMedia.url = res.info.secure_url; document.getElementById('upload-status').innerText = "✅"; } }); };
window.updateSubSelect = (cat) => { const s = document.getElementById('post-sub-category'); if (['info', 'market', 'discount'].includes(cat)) { s.style.display = 'block'; s.innerHTML = subCategories[cat][currentLang].map(i => `<option value="${i}">${i}</option>`).join(''); } else s.style.display = 'none'; };
window.toggleNotifScreenStatus = () => { notifOnScreen = !notifOnScreen; localStorage.setItem('notifOnScreen', notifOnScreen); updateNotifToggleUI(); };
function updateNotifToggleUI() { const i = document.getElementById('notif-toggle-icon'); if(i) i.className = (notifOnScreen ? 'fas fa-bell' : 'far fa-bell') + " text-2xl"; }

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

function toggleAdminBar() { if(currentUser?.email === OWNER_EMAIL) { const bar = document.getElementById('admin-quick-bar'); bar.style.display = bar.style.display === 'none' ? 'flex' : 'none'; } }
function closeAuthAlert() { document.getElementById('auth-alert-modal').style.display = 'none'; }
function goToAccountTab() { closeAuthAlert(); changeTab('account', document.getElementById('nav-btn-account')); }
function searchUsers(val) { const filtered = registeredUsers.filter(u => u.email.toLowerCase().includes(val.toLowerCase()) || (u.name && u.name.toLowerCase().includes(val.toLowerCase()))); renderUsers(filtered); }

document.addEventListener('DOMContentLoaded', init);
