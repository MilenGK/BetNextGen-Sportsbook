(function () {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const profileWrapper = document.getElementById("profileWrapper");
  if (!isLoggedIn) {
    if (profileWrapper) profileWrapper.classList.add("hidden");
  } else {
    if (profileWrapper) profileWrapper.classList.remove("hidden");
  }
})();

// Enhanced bet tracking with statistics
let userBets = JSON.parse(localStorage.getItem('userBets')) || [];

// ============================================
// BIG WINS DATA
// ============================================

const bigWinsData = [
  { name: 'Tom W.', initial: 'TW', bet: '7-Fold Acca - Champions League', amount: 8450 },
  { name: 'John D.', initial: 'JD', bet: 'Arsenal vs Chelsea - Home Win', amount: 2450 },
  { name: 'Sarah M.', initial: 'SM', bet: 'Lakers ML - Full Time', amount: 890 },
  { name: 'Anna K.', initial: 'AK', bet: 'Bayern vs Dortmund - BTTS', amount: 1340 },
  { name: 'Mike K.', initial: 'MK', bet: '5-Leg Parlay - All Winners', amount: 5200 },
  { name: 'Emma R.', initial: 'ER', bet: 'Barcelona vs Real Madrid - Over 2.5', amount: 1750 },
  { name: 'David L.', initial: 'DL', bet: 'Tennis Combo - 3 Selections', amount: 3100 },
  { name: 'Lisa P.', initial: 'LP', bet: 'Nadal vs Djokovic - Nadal Win', amount: 1920 }
];

// ============================================
// STATISTICS SYSTEM
// ============================================

// Initialize stats if not exists
let userStats = JSON.parse(localStorage.getItem('userStats')) || {
  totalBets: 0,
  totalWins: 0,
  totalLosses: 0,
  totalProfit: 0,
  biggestWin: 0,
  currentStreak: 0,
  bestStreak: 0,
  weeklyProfit: 0,
  weekStartDate: new Date().toISOString()
};

function saveStats() {
  localStorage.setItem('userStats', JSON.stringify(userStats));
}





// ============================================
// ✅ ADD THIS NEW CODE HERE
// WEEKLY WINNERS DATA & RENDERING
// ============================================

const weeklyWinnersData = [
  { rank: 1, name: 'Tom W.', initial: 'TW', totalWins: 12, profit: 8450 },
  { rank: 2, name: 'Mike K.', initial: 'MK', totalWins: 10, profit: 5200 },
  { rank: 3, name: 'David L.', initial: 'DL', totalWins: 8, profit: 3100 },
];

function renderWeeklyWinners() {
  const container = document.getElementById('weeklyWinnersList');
  if (!container) return;

  container.innerHTML = weeklyWinnersData.map(winner => `
    <div class="weekly-winner-card">
      <div class="rank-badge rank-${winner.rank}">${winner.rank}</div>
      <div class="weekly-winner-avatar">${winner.initial}</div>
      <div class="weekly-winner-info">
        <div class="weekly-winner-name">${winner.name}</div>
        <div class="weekly-winner-stats">${winner.totalWins} wins this week</div>
      </div>
      <div class="weekly-winner-profit">€${winner.profit.toLocaleString()}</div>
    </div>
  `).join('');
}

// ✅ UPDATE YOUR EXISTING DOMContentLoaded (if you have one)
// OR ADD THIS IF YOU DON'T HAVE IT
document.addEventListener('DOMContentLoaded', () => {
  renderRecentWinners(); // ✅ Existing function - KEEP
  renderWeeklyWinners(); // ✅ New function - ADD
});
// ============================================
// CASH OUT SYSTEM
// ============================================

function calculateCashOut(bet) {
  // Cash out offers 70-90% of potential win depending on time
  const timePassed = Date.now() - new Date(bet.timestamp).getTime();
  const minutesPassed = timePassed / 60000;

  // Higher % if bet is winning, lower if it's been longer
  let cashOutPercentage = 0.85; // Base 85%

  // Reduce by 1% every 10 minutes (max -15%)
  cashOutPercentage -= Math.min(0.15, (minutesPassed / 10) * 0.01);

  // Minimum 70%
  cashOutPercentage = Math.max(0.70, cashOutPercentage);

  const cashOutAmount = bet.potentialWin * cashOutPercentage;
  return parseFloat(cashOutAmount.toFixed(2));
}

function cashOutBet(betIndex) {
  const bet = userBets[betIndex];
  if (!bet || bet.status !== 'unsettled') return;

  const cashOutAmount = calculateCashOut(bet);

  // Confirm cash out
  if (!confirm(`Cash out for ${cashOutAmount.toFixed(2)} лв?\n\nYou staked ${bet.stake.toFixed(2)} лв\nPotential win: ${bet.potentialWin.toFixed(2)} лв`)) {
    return;
  }

  // Calculate profit/loss
  const profit = cashOutAmount - bet.stake;

  // Update balance
  const currentBalance = getWallet();
  setWallet(currentBalance + cashOutAmount);

  // Update bet status
  bet.status = 'cashed-out';
  bet.cashOutAmount = cashOutAmount;
  bet.cashOutTime = new Date().toISOString();
  bet.result = `Cashed Out: ${cashOutAmount.toFixed(2)} лв`;

  // Update stats
  userStats.totalBets++;
  userStats.totalProfit += profit;
  userStats.weeklyProfit += profit;
  updateMyBetsBadge();


  if (profit > 0) {
    userStats.totalWins++;
    userStats.currentStreak++;
    userStats.bestStreak = Math.max(userStats.bestStreak, userStats.currentStreak);

    if (profit > userStats.biggestWin) {
      userStats.biggestWin = profit;
    }

    showWinNotification(cashOutAmount, profit);
  } else {
    userStats.totalLosses++;
    userStats.currentStreak = 0;
  }

  // Save everything
  localStorage.setItem('userBets', JSON.stringify(userBets));
  saveStats();
  updateLeaderboard(profit);

  // Update UI
  renderMyBets();
  renderStatistics();

  toast(`💰 Cashed out for ${cashOutAmount.toFixed(2)} лв`);
}

// Constants for Settings (moved from later in file to prevent ReferenceError)
const THEME_KEY = 'betnextgen-theme';
const ODDS_FMT_KEY = 'betnextgen-oddsfmt-v1';
let oddsMode = localStorage.getItem(ODDS_FMT_KEY) || 'dec';

function updateUIAfterAuth(isLoggedIn) {
  const authButtons = document.getElementById("authButtons");
  const logoutWrapper = document.getElementById("logoutButtonWrapper");
  const profileWrapper = document.getElementById("profileWrapper");
  const floatingBetSlip = document.getElementById("floatingBetSlip");

  if (isLoggedIn) {
    localStorage.setItem("isLoggedIn", "true");
    document.body.classList.add('user-logged-in');

    authButtons?.classList.add("hidden");
    logoutWrapper?.classList.remove("hidden");
    profileWrapper?.classList.remove("hidden");
    floatingBetSlip?.classList.remove("hidden");
    document.getElementById('promotionsBtn').style.display = 'flex';

    updateProfileDisplay();
    initializeProfileListeners();

    // ✅ ADD THIS - Sync wallet variable with balance
    wallet = getWallet();
    updateWalletUI();
  } else {
    localStorage.removeItem("isLoggedIn");
    document.body.classList.remove('user-logged-in');

    authButtons?.classList.remove("hidden");
    document.getElementById('promotionsBtn').style.display = 'none';
    logoutWrapper?.classList.add("hidden");
    profileWrapper?.classList.add("hidden");
    floatingBetSlip?.classList.add("hidden");

    // ✅ ADD THIS - Reset wallet on logout
    wallet = 0;
    updateWalletUI();
  }
}
function updateProfileDisplay() {
  const usernameDisplay = document.getElementById("usernameDisplay");
  const fullnameDisplay = document.getElementById("fullnameDisplay");
  const userBalance = document.getElementById("userBalance");
  const withdrawable = document.getElementById("withdrawable");
  const credits = document.getElementById("credits");
  const initialsSpan = document.querySelector(".avatar-initials");

  // Get current user data
  let currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  // Set defaults if needed
  currentUser = {
    username: currentUser.username || "user",
    fullName: currentUser.fullName || "",
    firstName: currentUser.firstName || "",
    lastName: currentUser.lastName || "",
    gender: currentUser.gender || "other",
    balance: currentUser.balance || 0.00,
    withdrawable: currentUser.withdrawable || 0.00,
    credits: currentUser.credits || 0.00,
    ...currentUser
  };

  // Update initials
  const initials = currentUser.firstName && currentUser.lastName
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : currentUser.username.slice(0, 2).toUpperCase();
  if (initialsSpan) initialsSpan.textContent = initials;

  // Create display name with title
  const title = currentUser.gender === 'female' ? 'Ms.' : 'Mr.';
  const displayName = currentUser.firstName && currentUser.lastName
    ? `${title} ${currentUser.firstName} ${currentUser.lastName}`
    : currentUser.fullName || currentUser.username;

  // Update all profile elements
  if (fullnameDisplay) fullnameDisplay.textContent = displayName;
  if (usernameDisplay) usernameDisplay.textContent = `@${currentUser.username}`;
  if (userBalance) userBalance.textContent = `${currentUser.balance.toFixed(2)} лв`;
  if (withdrawable) withdrawable.textContent = `${currentUser.withdrawable.toFixed(2)} лв`;
  if (credits) credits.textContent = `${currentUser.credits.toFixed(2)} лв`;
}

// Navigation links functionality
document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    // Remove active class from all
    document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));

    // Add active to clicked
    link.classList.add('active');

    // Get the section
    const section = link.getAttribute('href').replace('#', '');

    // Handle navigation
    if (section === 'all-sports') {
      showSection('inPlayPage'); // Show In Play/All Sports
      toast('Showing All Sports');
    } else if (section === 'in-play') {
      showSection('inPlayPage'); // Show In Play
      toast('Loading Live Matches');
    } else if (section === 'casino') {
      showSection('casinoPage'); // Show Casino section
      toast('Opening Casino');
    } else if (section === 'social') {
      showSection('socialPage'); // Show Social
      toast('Loading Social Feed');
    } else if (section === 'ask_ai') {  // CHANGED: underscore instead of dash
      showSection('askAiPage');
      toast('AI Assistant Ready');
    }
  });
});

// Function to show sections
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show the selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Logo button click - Home navigation
const logoBtn = document.getElementById('navToggle');

if (logoBtn) {
  logoBtn.addEventListener('click', () => {
    // On mobile: toggle sidebar
    if (window.innerWidth <= 1024) {
      document.body.classList.toggle('nav-open');
      const backdrop = document.getElementById('navBackdrop');
      if (backdrop) backdrop.hidden = !document.body.classList.contains('nav-open');
    }
    // On desktop: go to home
    else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));
      document.querySelector('.nav__link')?.classList.add('active');
      toast('🏠 Home');
    }
  });
}

// ← MOVED OUTSIDE - This is now a separate function
function initializeProfileListeners() {
  const profileBtn = document.getElementById("profileToggleBtn");
  const panel = document.getElementById("profilePanel");

  if (!profileBtn || !panel) return;

  // Remove old listeners to prevent duplicates
  const newProfileBtn = profileBtn.cloneNode(true);
  profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);

  // Add fresh click listener
  newProfileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("show");
  });

  // Close panel when clicking outside
  document.addEventListener("click", (e) => {
    if (!panel?.contains(e.target) && !newProfileBtn?.contains(e.target)) {
      panel?.classList.remove("show");
    }
  });



  // Logout button handler
  const profileLogoutBtn = document.getElementById("logoutBtn");
  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      updateUIAfterAuth(false);
      panel?.classList.remove("show");
      showAuthMessage("See you soon 👋", 2000);
    });
  }
  // Tab switching logic
  document.querySelectorAll('.profile-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Grid items click handlers - Add to EACH grid item directly
  document.querySelectorAll('.grid-item').forEach(gridItem => {
    gridItem.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = gridItem.textContent.trim();
      panel.classList.remove('show');

      if (text.includes('Bank')) alert('Bank clicked!');
      else if (text.includes('Messages')) alert('Messages clicked!');
      else if (text.includes('My Account')) alert('My Account clicked!');
      else if (text.includes('Gambling Controls')) alert('Gambling Controls clicked!');
      else if (text.includes('My Activity')) alert('My Activity clicked!');
      else if (text.includes('History')) alert('History clicked!');
    });
  });
}

// ============================================
//  SETTINGS DROPDOWN INITIALIZATION
// ============================================
function initializeSettingsDropdown() {
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsDropdown = document.getElementById('settingsDropdown');
  const themeToggleDropdown = document.getElementById('themeToggleDropdown');
  const oddsFormatDropdown = document.getElementById('oddsFormatDropdown');

  // Exit if elements don't exist
  if (!settingsToggle || !settingsDropdown) {
    console.warn('Settings dropdown elements not found');
    return;
  }

  // Toggle dropdown
  settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('hidden');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.settings-dropdown-wrapper')) {
      settingsDropdown.classList.add('hidden');
    }
  });

  // Theme toggle in dropdown
  if (themeToggleDropdown) {
    themeToggleDropdown.addEventListener('click', () => {
      const current = localStorage.getItem(THEME_KEY) || 'dark';
      const newTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      const themeText = document.getElementById('themeText');
      if (themeText) {
        themeText.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
      }
    });
  }

  // Odds format change
  if (oddsFormatDropdown) {
    oddsFormatDropdown.addEventListener('change', (e) => {
      oddsMode = e.target.value;
      localStorage.setItem(ODDS_FMT_KEY, oddsMode);
      repaintOdds();
    });

    // Set initial values
    oddsFormatDropdown.value = localStorage.getItem(ODDS_FMT_KEY) || 'dec';
  }
}

// ✅ Show centered auth message
function showAuthMessage(message, duration = 3000) {
  const msgEl = document.getElementById("authMessage");
  msgEl.textContent = message;
  msgEl.classList.remove("hidden");
  msgEl.classList.add("show");

  setTimeout(() => {
    msgEl.classList.remove("show");
    msgEl.classList.add("hidden");
  }, duration);
}

// —————— Profile initialization + Auth handling ——————
document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  updateUIAfterAuth(isLoggedIn);

  // Initialize settings dropdown
  initializeSettingsDropdown();

  const signupForm = document.getElementById("signupForm");
  const dobInput = document.getElementById("suDob");
  const dobError = document.getElementById("dobError");

  function isAtLeast18(dateStr) {
    const dob = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18;
  }

  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      dobError.style.display = "none"; // reset

      const dobValue = dobInput.value;
      if (!isAtLeast18(dobValue)) {
        e.preventDefault();
        dobError.style.display = "block";
        dobInput.focus();
        return;
      }

      const pass = document.getElementById("suPassword").value;
      const confirm = document.getElementById("suConfirm").value;
      if (pass !== confirm) {
        e.preventDefault();
        alert("Passwords do not match.");
        return;
      }

      if (isLoggedIn) {
        updateProfileDisplay();
        initializeProfileListeners(); // Use the new function
      }
      // Allow signup to proceed
      // Possibly call updateUIAfterAuth(true) here or redirect
    });
  }

  // =========================
  // Remember email support
  const remembered = localStorage.getItem('rememberEmail') || '';
  const loginEmail = $$('#loginEmail'); const suEmail = $$('#suEmail');
  if (remembered) {
    if (loginEmail) loginEmail.value = remembered;
    if (suEmail) suEmail.value = remembered;
  }

  // LOGIN with password validation
  const loginFormEl = document.getElementById("loginForm");
  if (loginFormEl) {
    loginFormEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      // ✅ NEW CODE - Includes balance
      const hardcodedAccounts = [
        {
          email: "demo@example.com",
          password: "Demo123!",
          firstName: "John",
          lastName: "Doe",
          gender: "male",
          username: "demo",
          balance: 100.00,
          withdrawable: 0.00,
          credits: 100.00
        },
        {
          email: "test@example.com",
          password: "Test123!",
          firstName: "Jane",
          lastName: "Smith",
          gender: "female",
          username: "test",
          balance: 100.00,
          withdrawable: 0.00,
          credits: 100.00
        }
      ];

      // ✅ GET SAVED ACCOUNTS FROM SIGNUP
      const savedAccounts = JSON.parse(localStorage.getItem('demoAccounts')) || [];

      // ✅ COMBINE BOTH ACCOUNT LISTS
      const allAccounts = [...hardcodedAccounts, ...savedAccounts];

      // Check credentials
      const account = allAccounts.find(acc => acc.email === email && acc.password === password);

      // ✅ NEW CODE - Loads saved balance
      if (account) {
        const userData = {
          username: account.username || email.split('@')[0],
          fullName: `${account.firstName} ${account.lastName}`,
          firstName: account.firstName,
          lastName: account.lastName,
          gender: account.gender,
          email: email,
          balance: account.balance || 0.00,           // ✅ LOADS SAVED BALANCE
          withdrawable: account.withdrawable || 0.00, // ✅ LOADS SAVED BALANCE
          credits: account.credits || 0.00            // ✅ LOADS SAVED BALANCE
        };
        localStorage.setItem("currentUser", JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        document.body.classList.add('user-logged-in');

        updateUIAfterAuth(true);
        document.getElementById("loginModal")?.classList.remove("open");
        showAuthMessage(`Welcome back, ${account.firstName}!`, 2000);
      } else {
        showAuthMessage("Invalid email or password. Try demo@example.com / Demo123!", 3000);
      }
    });
  }
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem('isLoggedIn');
      document.body.classList.remove('user-logged-in');
      updateUIAfterAuth(false); // 🔥 hides profile + shows login/register
    });
  }
});


// =========================
// Utilities
// =========================
const $$ = (sel, ctx = document) => ctx.querySelector(sel);
const $$$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const fmtSafe = (n, digits = 2) => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(digits) : '—';
};

// ---- Bet Slip visibility
const betSlipPanel = document.querySelector('.floating-bet-slip');
const slipList = document.getElementById('slipList');
const slipEmpty = document.getElementById('slipEmpty');

// ========================================
// BET SLIP STICKY FIX - FOLLOWS SCREEN
// ========================================

function ensureBetSlipSticky() {
  const betSlip = document.getElementById('floatingBetSlip');
  const collapsed = document.getElementById('betSlipCollapsed');
  const expanded = document.getElementById('betSlipExpanded');

  if (!betSlip) {
    console.log('❌ Bet slip not found, retrying...');
    setTimeout(ensureBetSlipSticky, 500);
    return;
  }

  console.log('✅ Bet slip found!');

  // Move to body level if not already there
  if (betSlip.parentElement && betSlip.parentElement.tagName !== 'BODY') {
    document.body.appendChild(betSlip);
    console.log('✅ Bet slip moved to body level');
  }

  // Show bet slip if there are items
  if (slip.length > 0) {
    collapsed.style.display = 'flex';
  }

  // Remove body class
  document.body.classList.remove('betslip-open');
}

// ============================================
// UPDATE BET SLIP TRIGGER (COLLAPSED STATE)
// ============================================


function updateBetSlipTrigger() {
  const trigger = document.getElementById('betSlipCollapsed');
  const count = document.querySelector('.slip-count');
  const total = document.querySelector('.slip-odds');
  const savedSlip = localStorage.getItem(SAVED_SLIP_KEY);
  const restoreSection = document.getElementById('restoreBetsSection');

  if (!trigger) return;

  // Case 1: Has active bets in slip
  if (slip.length > 0) {
    trigger.style.display = 'flex';
    trigger.classList.remove('has-restore');

    // Update count
    if (count) {
      count.textContent = slip.length;
      count.style.animation = 'betCountPulse 0.3s ease-out';
    }

    // Calculate total odds
    const totalOdds = slip.reduce((acc, bet) => acc * bet.odd, 1);
    if (total) {
      total.textContent = totalOdds.toFixed(2);
      total.style.fontSize = '';
    }

    trigger.classList.add('updated');
    setTimeout(() => trigger.classList.remove('updated'), 600);
  }
  // Case 2: No bets, but has saved backup AND restore section is visible
  else if (savedSlip && restoreSection && !restoreSection.classList.contains('hidden')) {
    try {
      const saved = JSON.parse(savedSlip);
      if (saved && saved.length > 0) {
        trigger.style.display = 'flex';
        trigger.classList.add('has-restore');

        if (count) {
          count.textContent = saved.length;
          count.style.animation = 'none';
        }
        if (total) {
          total.textContent = '🔄';
          total.style.fontSize = '16px';
        }
        return;
      }
    } catch (error) {
      console.error('Error checking saved slip:', error);
      localStorage.removeItem(SAVED_SLIP_KEY);
    }
  }

  // Case 3: No bets and no valid backup - HIDE AND RESET
  trigger.style.display = 'none';
  trigger.classList.remove('has-restore');

  // ✅ FORCE RESET THE DOM ELEMENTS
  if (count) {
    count.textContent = '0';
  }
  if (total) {
    total.textContent = '0.00';
  }
}


// Call on page load and whenever bets change
document.addEventListener('DOMContentLoaded', () => {
  ensureBetSlipSticky();
  updateBetSlipTrigger();
});

// Update trigger whenever slip changes
// Update the existing saveSlip function to also update collapsed state
const _wrappedSaveSlip = saveSlip;
saveSlip = function () {
  _wrappedSaveSlip(); // This already calls updateBetSlipTrigger & ensureBetSlipSticky
  updateCollapsedBetSlip();
  renderBetItems();
  updateRestoreButton(); // ✅ ADD THIS LINE
};

// Re-check positioning on scroll (just in case)
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(ensureBetSlipSticky, 100);
}, { passive: true });

// Re-check on window resize
window.addEventListener('resize', ensureBetSlipSticky);

// ---- Toast feedback
function toast(msg, ms = 1400) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}


// =========================
// Demo Data
// =========================
const MATCHES = [
  { id: 'f1', sport: 'Football', comp: 'Premier League', time: 'Today 19:00', teams: ['Arsenal', 'Chelsea'], odds: { '1': 1.85, 'X': 3.50, '2': 4.20 }, likes: 342, isLiked: false },
  { id: 'f2', sport: 'Football', comp: 'Premier League', time: 'Today 21:00', teams: ['Liverpool', 'Man City'], odds: { '1': 2.10, 'X': 3.20, '2': 3.00 }, likes: 567, isLiked: false },
  { id: 't1', sport: 'Tennis', comp: 'ATP 500', time: 'Today 15:00', teams: ['Medvedev', 'Zverev'], odds: { '1': 1.70, '2': 2.10 }, likes: 198, isLiked: false },
  { id: 't2', sport: 'Tennis', comp: 'WTA 1000', time: 'Today 17:00', teams: ['Swiatek', 'Sabalenka'], odds: { '1': 1.90, '2': 1.80 }, likes: 234, isLiked: false },
  { id: 'b1', sport: 'Basketball', comp: 'NBA', time: 'Today 20:00', teams: ['Lakers', 'Clippers'], odds: { '1': 1.50, '2': 2.40 }, likes: 421, isLiked: false },
  { id: 'b2', sport: 'Basketball', comp: 'NBA', time: 'Tomorrow 19:30', teams: ['Warriors', 'Celtics'], odds: { '1': 1.80, '2': 2.00 }, likes: 389, isLiked: false },
];
// ✅ LIVE MATCHES DATA - Add this right after MATCHES array
const LIVE_MATCHES_DATA = [
  // ========================================
  // FOOTBALL - LA LIGA (Spain)
  // ========================================
  {
    id: 'live-f1',
    sport: 'football',
    league: 'Spain - LaLiga',
    leagueIcon: '',
    teams: ['Valencia CF', 'Real Oviedo'],
    score: [1, 0],
    time: '78:11',
    odds: { '1': 1.19, 'X': 5.40, '2': 29.00 }
  },
  {
    id: 'live-f2',
    sport: 'football',
    league: 'Spain - LaLiga',
    leagueIcon: '',
    teams: ['Barcelona', 'Real Madrid'],
    score: [2, 2],
    time: '82:34',
    odds: { '1': 2.10, 'X': 3.20, '2': 3.50 }
  },
  {
    id: 'live-f3',
    sport: 'football',
    league: 'Spain - LaLiga',
    leagueIcon: ``,
    teams: ['Atletico Madrid', 'Sevilla'],
    score: [0, 1],
    time: '56:22',
    odds: { '1': 3.40, 'X': 3.10, '2': 2.20 }
  },

  // ========================================
  // FOOTBALL - PREMIER LEAGUE (England)
  // ========================================
  {
    id: 'live-f4',
    sport: 'football',
    league: 'England - Premier League',
    leagueIcon: '',
    teams: ['Arsenal', 'Chelsea'],
    score: [2, 1],
    time: '65:34',
    odds: { '1': 1.45, 'X': 4.20, '2': 7.80 }
  },
  {
    id: 'live-f5',
    sport: 'football',
    league: 'England - Premier League',
    leagueIcon: '',
    teams: ['Liverpool', 'Manchester City'],
    score: [1, 1],
    time: '71:45',
    odds: { '1': 2.30, 'X': 3.40, '2': 2.90 }
  },
  {
    id: 'live-f6',
    sport: 'football',
    league: 'England - Premier League',
    leagueIcon: '',
    teams: ['Manchester United', 'Tottenham'],
    score: [0, 0],
    time: '38:12',
    odds: { '1': 2.10, 'X': 3.30, '2': 3.60 }
  },
  // ========================================
  // FOOTBALL - SERIE A (Italy)
  // ========================================
  {
    id: 'live-f7',
    sport: 'football',
    league: 'Italy - Serie A',
    leagueIcon: '',
    teams: ['AC Milan', 'Inter Milan'],
    score: [0, 0],
    time: '23:45',
    odds: { '1': 2.30, 'X': 3.10, '2': 3.40 }
  },
  {
    id: 'live-f8',
    sport: 'football',
    league: 'Italy - Serie A',
    leagueIcon: '',
    teams: ['Juventus', 'Napoli'],
    score: [3, 1],
    time: '88:02',
    odds: { '1': 1.25, 'X': 6.50, '2': 12.00 }
  },
  {
    id: 'live-f9',
    sport: 'football',
    league: 'Italy - Serie A',
    leagueIcon: '',
    teams: ['AS Roma', 'Lazio'],
    score: [1, 2],
    time: '67:18',
    odds: { '1': 3.20, 'X': 3.50, '2': 2.20 }
  },

  // ========================================
  // FOOTBALL - BUNDESLIGA (Germany)
  // ========================================
  {
    id: 'live-f10',
    sport: 'football',
    league: 'Germany - Bundesliga',
    leagueIcon: '',
    teams: ['Bayern Munich', 'Borussia Dortmund'],
    score: [2, 0],
    time: '54:30',
    odds: { '1': 1.35, 'X': 5.00, '2': 8.50 }
  },
  {
    id: 'live-f11',
    sport: 'football',
    league: 'Germany - Bundesliga',
    leagueIcon: '',
    teams: ['RB Leipzig', 'Bayer Leverkusen'],
    score: [1, 1],
    time: '79:55',
    odds: { '1': 2.40, 'X': 3.30, '2': 2.90 }
  },
  {
    id: 'live-f12',
    sport: 'football',
    league: 'Germany - Bundesliga',
    leagueIcon: '',
    teams: ['Borussia M\'gladbach', 'Eintracht Frankfurt'],
    score: [0, 1],
    time: '42:17',
    odds: { '1': 2.80, 'X': 3.20, '2': 2.60 }
  },

  // ========================================
  // FOOTBALL - LIGUE 1 (France)
  // ========================================
  {
    id: 'live-f13',
    sport: 'football',
    league: 'France - Ligue 1',
    leagueIcon: '',
    teams: ['Paris Saint-Germain', 'Marseille'],
    score: [3, 0],
    time: '61:28',
    odds: { '1': 1.15, 'X': 7.50, '2': 15.00 }
  },
  {
    id: 'live-f14',
    sport: 'football',
    league: 'France - Ligue 1',
    leagueIcon: '',
    teams: ['Lyon', 'Monaco'],
    score: [1, 2],
    time: '73:40',
    odds: { '1': 2.90, 'X': 3.40, '2': 2.40 }
  },
  {
    id: 'live-f15',
    sport: 'football',
    league: 'France - Ligue 1',
    leagueIcon: '',
    teams: ['Lille', 'Nice'],
    score: [0, 0],
    time: '19:05',
    odds: { '1': 1.90, 'X': 3.50, '2': 4.20 }
  },

  // ========================================
  // BASKETBALL
  // ========================================
  {
    id: 'live-b1',
    sport: 'basketball',
    league: 'NBA',
    leagueIcon: '🏀',
    teams: ['Lakers', 'Clippers'],
    score: [89, 92],
    time: 'Q3 8:45',
    odds: { '1': 2.10, '2': 1.75 }
  },
  {
    id: 'live-b2',
    sport: 'basketball',
    league: 'NBA',
    leagueIcon: '🏀',
    teams: ['Warriors', 'Celtics'],
    score: [67, 71],
    time: 'Q2 2:15',
    odds: { '1': 1.95, '2': 1.90 }
  },

  // ========================================
  // TENNIS
  // ========================================
  {
    id: 'live-t1',
    sport: 'tennis',
    league: 'ATP 500',
    leagueIcon: '🎾',
    teams: ['Medvedev', 'Zverev'],
    score: ['6-4, 2-3', ''],
    time: 'Set 2',
    odds: { '1': 1.65, '2': 2.25 }
  },
  {
    id: 'live-t2',
    sport: 'tennis',
    league: 'WTA 1000',
    leagueIcon: '🎾',
    teams: ['Swiatek', 'Sabalenka'],
    score: ['4-6, 5-4', ''],
    time: 'Set 2',
    odds: { '1': 1.80, '2': 2.05 }
  },

  // ========================================
  // ICE HOCKEY
  // ========================================
  {
    id: 'live-h1',
    sport: 'ice-hockey',
    league: 'NHL',
    leagueIcon: '🏒',
    teams: ['Toronto Maple Leafs', 'Montreal Canadiens'],
    score: [2, 1],
    time: 'P2 12:34',
    odds: { '1': 1.55, 'X': 4.50, '2': 5.20 }
  },
  // ========================================
  // TABLE TENNIS
  // ========================================
  {
    id: 'live-tt1',
    sport: 'table-tennis',
    league: 'World Championship',
    leagueIcon: '🏓',
    teams: ['Ma Long', 'Fan Zhendong'],
    score: ['2', '1'],
    time: 'Set 3',
    odds: { '1': 1.75, '2': 2.10 }
  },
  {
    id: 'live-tt2',
    sport: 'table-tennis',
    league: 'World Championship',
    leagueIcon: '🏓',
    teams: ['Xu Xin', 'Harimoto Tomokazu'],
    score: ['1', '2'],
    time: 'Set 4',
    odds: { '1': 2.40, '2': 1.60 }
  },

  // ========================================
  // VOLLEYBALL
  // ========================================
  {
    id: 'live-vb1',
    sport: 'volleyball',
    league: 'FIVB World League',
    leagueIcon: '🏐',
    teams: ['Brazil', 'Poland'],
    score: [2, 1],
    time: 'Set 4',
    odds: { '1': 1.55, '2': 2.45 }
  },
  {
    id: 'live-vb2',
    sport: 'volleyball',
    league: 'FIVB World League',
    leagueIcon: '🏐',
    teams: ['USA', 'Italy'],
    score: [1, 1],
    time: 'Set 3',
    odds: { '1': 1.85, '2': 1.95 }
  },

  // ========================================
  // HANDBALL
  // ========================================
  {
    id: 'live-hb1',
    sport: 'handball',
    league: 'EHF Champions League',
    leagueIcon: '🤾',
    teams: ['FC Barcelona', 'Paris Saint-Germain'],
    score: [24, 22],
    time: '48:30',
    odds: { '1': 1.65, 'X': 15.00, '2': 3.20 }
  },
  {
    id: 'live-hb2',
    sport: 'handball',
    league: 'EHF Champions League',
    leagueIcon: '🤾',
    teams: ['THW Kiel', 'Vardar Skopje'],
    score: [18, 18],
    time: '32:15',
    odds: { '1': 2.10, 'X': 18.00, '2': 2.30 }
  },

  // ========================================
  // DARTS
  // ========================================
  {
    id: 'live-d1',
    sport: 'darts',
    league: 'PDC World Championship',
    leagueIcon: '🎯',
    teams: ['Michael van Gerwen', 'Peter Wright'],
    score: ['3', '2'],
    time: 'Set 6',
    odds: { '1': 1.45, '2': 2.75 }
  },
  {
    id: 'live-d2',
    sport: 'darts',
    league: 'PDC World Championship',
    leagueIcon: '🎯',
    teams: ['Gary Anderson', 'Rob Cross'],
    score: ['1', '1'],
    time: 'Set 3',
    odds: { '1': 2.20, '2': 1.70 }
  },

  // ========================================
  // ESPORTS - CS:GO
  // ========================================
  {
    id: 'live-e1',
    sport: 'esports',
    league: 'CS:GO - ESL Pro League',
    leagueIcon: '🎮',
    teams: ['Natus Vincere', 'FaZe Clan'],
    score: [12, 8],
    time: 'Map 1',
    odds: { '1': 1.55, '2': 2.40 }
  },
  {
    id: 'live-e2',
    sport: 'esports',
    league: 'CS:GO - ESL Pro League',
    leagueIcon: '🎮',
    teams: ['G2 Esports', 'Team Vitality'],
    score: [7, 7],
    time: 'Map 1',
    odds: { '1': 1.90, '2': 1.90 }
  },

  // ========================================
  // CRICKET
  // ========================================
  {
    id: 'live-c1',
    sport: 'cricket',
    league: 'IPL 2024',
    leagueIcon: '🏏',
    teams: ['Mumbai Indians', 'Chennai Super Kings'],
    score: ['142/4', '98/2'],
    time: 'Over 12',
    odds: { '1': 1.75, '2': 2.10 }
  },
  {
    id: 'live-c2',
    sport: 'cricket',
    league: 'IPL 2024',
    leagueIcon: '🏏',
    teams: ['Royal Challengers', 'Kolkata Knight Riders'],
    score: ['165/6', '87/1'],
    time: 'Over 9',
    odds: { '1': 2.30, '2': 1.65 }
  }
];
function renderCarousel(matches) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  track.innerHTML = matches.map(m => `
      <div class="event-card" data-id="${m.id}">
        <!-- Fire Like Button -->
        <button class="event-like-btn ${m.isLiked ? 'liked' : ''}" data-event-id="${m.id}">
          🔥
          <span class="like-count">${m.likes}</span>
        </button>
  
        <div class="event-sport">
          <svg class="icon" width="16" height="16"><use href="#icon-ball"/></svg>
          <span>${m.sport}</span>
        </div>
        <strong>${m.teams[0]} vs ${m.teams[1]}</strong>
        <div class="meta">${m.comp} • ${m.time}</div>
        <div class="carousel-odds"></div>
      </div>
    `).join('');
}

// ============================================
// PREMATCH EVENTS DATA (First 8 Sports)
// ============================================

const PREMATCH_EVENTS = [
  // ========== SOCCER ==========
  {
    id: 'pre-soccer-1',
    sport: 'football',
    league: 'England - Premier League',
    teams: ['Newcastle United', 'Aston Villa'],
    date: 'today',
    time: '15:00',
    sessionType: 'day',
    odds: { '1': 2.10, 'X': 3.40, '2': 3.60 }
  },
  {
    id: 'pre-soccer-2',
    sport: 'football',
    league: 'Spain - LaLiga',
    teams: ['Real Betis', 'Getafe'],
    date: 'today',
    time: '21:00',
    sessionType: 'night',
    odds: { '1': 1.75, 'X': 3.60, '2': 4.80 }
  },
  {
    id: 'pre-soccer-3',
    sport: 'football',
    league: 'Germany - Bundesliga',
    teams: ['Wolfsburg', 'Hoffenheim'],
    date: 'tomorrow',
    time: '14:30',
    sessionType: 'day',
    odds: { '1': 2.30, 'X': 3.20, '2': 3.40 }
  },

  // ========== BASKETBALL ==========
  {
    id: 'pre-basketball-1',
    sport: 'basketball',
    league: 'NBA',
    teams: ['Brooklyn Nets', 'Miami Heat'],
    date: 'today',
    time: '20:00',
    sessionType: 'night',
    odds: { '1': 1.85, '2': 1.95 }
  },
  {
    id: 'pre-basketball-2',
    sport: 'basketball',
    league: 'NBA',
    teams: ['Phoenix Suns', 'Dallas Mavericks'],
    date: 'today',
    time: '22:30',
    sessionType: 'night',
    odds: { '1': 2.10, '2': 1.75 }
  },
  {
    id: 'pre-basketball-3',
    sport: 'basketball',
    league: 'Euroleague',
    teams: ['Real Madrid', 'Barcelona'],
    date: 'tomorrow',
    time: '19:00',
    sessionType: 'night',
    odds: { '1': 1.65, '2': 2.25 }
  },

  // ========== TENNIS ==========
  {
    id: 'pre-tennis-1',
    sport: 'tennis',
    league: 'ATP Masters 1000',
    teams: ['Carlos Alcaraz', 'Daniil Medvedev'],
    date: 'today',
    time: '16:00',
    sessionType: 'day',
    odds: { '1': 1.55, '2': 2.45 }
  },
  {
    id: 'pre-tennis-2',
    sport: 'tennis',
    league: 'WTA 1000',
    teams: ['Aryna Sabalenka', 'Elena Rybakina'],
    date: 'tomorrow',
    time: '12:00',
    sessionType: 'day',
    odds: { '1': 1.70, '2': 2.15 }
  },
  {
    id: 'pre-tennis-3',
    sport: 'tennis',
    league: 'ATP 500',
    teams: ['Jannik Sinner', 'Stefanos Tsitsipas'],
    date: 'tomorrow',
    time: '20:00',
    sessionType: 'night',
    odds: { '1': 1.80, '2': 2.05 }
  },

  // ========== HORSE RACING ==========
  {
    id: 'pre-horse-1',
    sport: 'horse-racing',
    league: 'Royal Ascot',
    teams: ['Thunder Strike', 'Golden Arrow'],
    date: 'today',
    time: '14:45',
    sessionType: 'day',
    odds: { '1': 2.80, '2': 1.50 }
  },
  {
    id: 'pre-horse-2',
    sport: 'horse-racing',
    league: 'Kentucky Derby',
    teams: ['Speed Demon', 'Night Rider'],
    date: 'today',
    time: '17:30',
    sessionType: 'day',
    odds: { '1': 3.20, '2': 1.35 }
  },
  {
    id: 'pre-horse-3',
    sport: 'horse-racing',
    league: 'Dubai World Cup',
    teams: ['Desert Storm', 'Silver Bullet'],
    date: 'tomorrow',
    time: '15:15',
    sessionType: 'day',
    odds: { '1': 2.10, '2': 1.75 }
  },

  // ========== ESPORTS ==========
  {
    id: 'pre-esports-1',
    sport: 'esports',
    league: 'CS:GO - IEM Katowice',
    teams: ['FaZe Clan', 'Astralis'],
    date: 'today',
    time: '18:00',
    sessionType: 'day',
    odds: { '1': 1.65, '2': 2.25 }
  },
  {
    id: 'pre-esports-2',
    sport: 'esports',
    league: 'League of Legends - LCS',
    teams: ['Cloud9', 'Team Liquid'],
    date: 'today',
    time: '23:00',
    sessionType: 'night',
    odds: { '1': 2.30, '2': 1.65 }
  },
  {
    id: 'pre-esports-3',
    sport: 'esports',
    league: 'Dota 2 - DPC',
    teams: ['Team Secret', 'OG'],
    date: 'tomorrow',
    time: '16:00',
    sessionType: 'day',
    odds: { '1': 1.90, '2': 1.90 }
  },

  // ========== ICE HOCKEY ==========
  {
    id: 'pre-hockey-1',
    sport: 'ice-hockey',
    league: 'NHL',
    teams: ['Boston Bruins', 'Tampa Bay Lightning'],
    date: 'today',
    time: '19:00',
    sessionType: 'night',
    odds: { '1': 2.10, 'X': 4.20, '2': 3.20 }
  },
  {
    id: 'pre-hockey-2',
    sport: 'ice-hockey',
    league: 'NHL',
    teams: ['Colorado Avalanche', 'Vegas Golden Knights'],
    date: 'today',
    time: '22:00',
    sessionType: 'night',
    odds: { '1': 1.85, 'X': 4.50, '2': 3.80 }
  },
  {
    id: 'pre-hockey-3',
    sport: 'ice-hockey',
    league: 'KHL',
    teams: ['CSKA Moscow', 'SKA St. Petersburg'],
    date: 'tomorrow',
    time: '17:00',
    sessionType: 'day',
    odds: { '1': 2.40, 'X': 3.90, '2': 2.90 }
  },

  // ========== TABLE TENNIS ==========
  {
    id: 'pre-tt-1',
    sport: 'table-tennis',
    league: 'ITTF World Tour',
    teams: ['Lin Gaoyuan', 'Dimitrij Ovtcharov'],
    date: 'today',
    time: '13:00',
    sessionType: 'day',
    odds: { '1': 1.55, '2': 2.45 }
  },
  {
    id: 'pre-tt-2',
    sport: 'table-tennis',
    league: 'Chinese Super League',
    teams: ['Wang Chuqin', 'Liang Jingkun'],
    date: 'tomorrow',
    time: '10:00',
    sessionType: 'day',
    odds: { '1': 1.75, '2': 2.10 }
  },
  {
    id: 'pre-tt-3',
    sport: 'table-tennis',
    league: 'European Championships',
    teams: ['Timo Boll', 'Hugo Calderano'],
    date: 'tomorrow',
    time: '19:30',
    sessionType: 'night',
    odds: { '1': 2.20, '2': 1.70 }
  },

  // ========== VOLLEYBALL ==========
  {
    id: 'pre-vb-1',
    sport: 'volleyball',
    league: 'FIVB World Championship',
    teams: ['Italy', 'France'],
    date: 'today',
    time: '18:30',
    sessionType: 'day',
    odds: { '1': 1.80, '2': 2.05 }
  },
  {
    id: 'pre-vb-2',
    sport: 'volleyball',
    league: 'CEV Champions League',
    teams: ['Zenit Kazan', 'Lube Civitanova'],
    date: 'today',
    time: '20:00',
    sessionType: 'night',
    odds: { '1': 2.10, '2': 1.75 }
  },
  {
    id: 'pre-vb-3',
    sport: 'volleyball',
    league: 'Turkish League',
    teams: ['Fenerbahce', 'Galatasaray'],
    date: 'tomorrow',
    time: '17:00',
    sessionType: 'day',
    odds: { '1': 1.65, '2': 2.25 }
  }
];

// Track currently selected sport
let currentSelectedSport = null;

// ============================================
// CENTRALIZED MATCH TIMER SYSTEM
// ============================================

// Store all match timers centrally
const matchTimers = new Map();

// Initialize timers from LIVE_MATCHES_DATA
function initializeMatchTimers() {
  LIVE_MATCHES_DATA.forEach(match => {
    if (!matchTimers.has(match.id)) {
      // Parse time string (e.g., "79:38" or "Q3 8:45")
      const timeData = parseMatchTime(match.time);
      matchTimers.set(match.id, timeData);
    }
  });
}

// Parse different time formats
function parseMatchTime(timeString) {
  // Football/Soccer format: "79:38"
  if (timeString.includes(':') && !timeString.includes('Q') && !timeString.includes('P')) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return {
      type: 'football',
      minutes: minutes,
      seconds: seconds,
      period: minutes >= 45 ? 2 : 1
    };
  }

  // Basketball format: "Q3 8:45"
  if (timeString.includes('Q')) {
    const quarter = parseInt(timeString.match(/Q(\d)/)[1]);
    const [minutes, seconds] = timeString.split(' ')[1].split(':').map(Number);
    return {
      type: 'basketball',
      quarter: quarter,
      minutes: minutes,
      seconds: seconds
    };
  }

  // Ice Hockey format: "P2 12:34"
  if (timeString.includes('P')) {
    const period = parseInt(timeString.match(/P(\d)/)[1]);
    const [minutes, seconds] = timeString.split(' ')[1].split(':').map(Number);
    return {
      type: 'hockey',
      period: period,
      minutes: minutes,
      seconds: seconds
    };
  }

  // Tennis/Other format: "Set 2"
  return {
    type: 'other',
    display: timeString
  };
}

// Format timer back to display string
function formatMatchTime(timeData) {
  if (timeData.type === 'football') {
    return `${timeData.minutes}:${timeData.seconds.toString().padStart(2, '0')}`;
  }

  if (timeData.type === 'basketball') {
    return `Q${timeData.quarter} ${timeData.minutes}:${timeData.seconds.toString().padStart(2, '0')}`;
  }

  if (timeData.type === 'hockey') {
    return `P${timeData.period} ${timeData.minutes}:${timeData.seconds.toString().padStart(2, '0')}`;
  }

  return timeData.display;
}

// Update timer (increment by 1 second)
function incrementMatchTimer(matchId) {
  const timeData = matchTimers.get(matchId);
  if (!timeData) return;

  if (timeData.type === 'football') {
    timeData.seconds++;

    if (timeData.seconds >= 60) {
      timeData.seconds = 0;
      timeData.minutes++;

      if (timeData.minutes === 45) {
        timeData.period = 2;
      }

      if (timeData.minutes >= 90) {
        timeData.minutes = 90;
        timeData.seconds = 0;
      }
    }
  }

  if (timeData.type === 'basketball') {
    timeData.seconds--;

    if (timeData.seconds < 0) {
      timeData.seconds = 59;
      timeData.minutes--;

      if (timeData.minutes < 0) {
        timeData.quarter++;
        timeData.minutes = 12;
        timeData.seconds = 0;

        if (timeData.quarter > 4) {
          timeData.quarter = 4;
          timeData.minutes = 0;
          timeData.seconds = 0;
        }
      }
    }
  }

  if (timeData.type === 'hockey') {
    timeData.seconds++;

    if (timeData.seconds >= 60) {
      timeData.seconds = 0;
      timeData.minutes++;

      if (timeData.minutes >= 20) {
        timeData.period++;
        timeData.minutes = 0;
        timeData.seconds = 0;

        if (timeData.period > 3) {
          timeData.period = 3;
          timeData.minutes = 20;
          timeData.seconds = 0;
        }
      }
    }
  }

  matchTimers.set(matchId, timeData);
  updateAllMatchTimerDisplays(matchId);
}

// Update ALL displays of a match timer
function updateAllMatchTimerDisplays(matchId) {
  const timeData = matchTimers.get(matchId);
  if (!timeData) return;

  const timeString = formatMatchTime(timeData);

  // Update in live matches cards
  document.querySelectorAll(`.live-match-card[data-match-id="${matchId}"] .live-time`).forEach(el => {
    el.textContent = timeString;
  });

  // Update in match markets page
  const marketsTime = document.getElementById('marketsMatchTime');
  if (marketsTime && marketsTime.dataset.matchId === matchId) {
    marketsTime.textContent = timeString;
  }

  // Update in right panel
  const panelTime = document.getElementById('panelTime');
  if (panelTime && panelTime.dataset.matchId === matchId) {
    panelTime.textContent = timeString + ' ● LIVE';
  }

  // Update the match data itself
  const match = LIVE_MATCHES_DATA.find(m => m.id === matchId);
  if (match) {
    match.time = timeString;
  }
}

// Start timer updates
let timerUpdateInterval = null;

function startMatchTimers() {
  if (timerUpdateInterval) {
    clearInterval(timerUpdateInterval);
  }

  initializeMatchTimers();

  timerUpdateInterval = setInterval(() => {
    matchTimers.forEach((timeData, matchId) => {
      incrementMatchTimer(matchId);
    });
  }, 1000);

  console.log('✅ Match timers started');
}

function stopMatchTimers() {
  if (timerUpdateInterval) {
    clearInterval(timerUpdateInterval);
    timerUpdateInterval = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopMatchTimers();
  } else {
    startMatchTimers();
  }
});

// ============================================
// DYNAMIC ODDS SYSTEM
// ============================================

let oddsUpdateInterval = null;

// Update odds for all matches
function updateDynamicOdds() {
  // Select ALL odds buttons including market page
  const allOddsButtons = document.querySelectorAll('.odd-btn[data-match][data-odd]');

  allOddsButtons.forEach(btn => {
    // Skip if in bet slip (locked)
    if (btn.closest('.bet-slip-expanded')) return;

    const currentOdd = parseFloat(btn.dataset.odd);
    if (isNaN(currentOdd)) return;

    // Random change between -10% to +10%
    const changePercent = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
    const newOdd = Math.max(1.01, currentOdd * (1 + changePercent));
    const roundedOdd = newOdd.toFixed(2);

    // Only update if odds actually changed
    if (roundedOdd === currentOdd.toFixed(2)) return;

    // Update the display
    const valueSpan = btn.querySelector('.option-value') || btn.querySelector('.val');
    if (valueSpan) {
      // Add animation class
      if (newOdd > currentOdd) {
        btn.classList.add('odds-up');
        valueSpan.innerHTML = `${roundedOdd} <span class="odds-change-indicator up">↑</span>`;
      } else {
        btn.classList.add('odds-down');
        valueSpan.innerHTML = `${roundedOdd} <span class="odds-change-indicator down">↓</span>`;
      }

      // Remove animation class and arrow after 2 seconds
      setTimeout(() => {
        btn.classList.remove('odds-up', 'odds-down');
        valueSpan.textContent = roundedOdd;
      }, 2000);

      // Update stored odd value
      btn.dataset.odd = roundedOdd;
    }
  });
}

// Start dynamic odds updates
function startDynamicOdds() {
  if (oddsUpdateInterval) {
    clearInterval(oddsUpdateInterval);
  }

  // Update odds at random intervals (3-8 seconds)
  function scheduleNextUpdate() {
    const delay = Math.random() * 5000 + 3000; // 3-8 seconds

    oddsUpdateInterval = setTimeout(() => {
      updateDynamicOdds();
      scheduleNextUpdate(); // Schedule next update
    }, delay);
  }

  scheduleNextUpdate();
  console.log('✅ Dynamic odds system started');
}

// Stop dynamic odds (call this when user is inactive)
function stopDynamicOdds() {
  if (oddsUpdateInterval) {
    clearTimeout(oddsUpdateInterval);
    oddsUpdateInterval = null;
    console.log('⏸️ Dynamic odds paused');
  }
}

// Pause odds updates when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopDynamicOdds();
  } else {
    startDynamicOdds();
  }
});

// Start odds updates when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait 2 seconds before first update
  setTimeout(() => {
    startDynamicOdds();
  }, 2000);
});

// Event Like System
let eventLikes = JSON.parse(localStorage.getItem('eventLikes')) || {};

// Load likes on page load
function loadEventLikes() {
  MATCHES.forEach(match => {
    if (eventLikes[match.id]) {
      match.likes = eventLikes[match.id].likes;
      match.isLiked = eventLikes[match.id].isLiked;
    }
  });
}

// Handle event like button click
document.addEventListener('click', (e) => {
  if (e.target.closest('.event-like-btn')) {
    e.stopPropagation();
    const btn = e.target.closest('.event-like-btn');
    const eventId = btn.dataset.eventId;
    toggleEventLike(eventId);
  }
});

function toggleEventLike(eventId) {
  const match = MATCHES.find(m => m.id === eventId);
  if (!match) return;

  // Toggle like
  match.isLiked = !match.isLiked;

  if (match.isLiked) {
    match.likes++;
  } else {
    match.likes--;
  }

  // Save to localStorage
  eventLikes[eventId] = {
    isLiked: match.isLiked,
    likes: match.likes
  };
  localStorage.setItem('eventLikes', JSON.stringify(eventLikes));

  // Refresh carousel sorted by likes
  updateCarousel();
}

// Update carousel with most liked events
function updateCarousel() {
  // Sort by likes (highest first)
  const sortedMatches = [...MATCHES].sort((a, b) => b.likes - a.likes);
  renderCarousel(sortedMatches);

  // Re-hydrate odds after render
  requestAnimationFrame(() => {
    hydrateCarouselOdds();
  });
}

// Initialize on page load
loadEventLikes();
updateCarousel(); // Use this instead of renderCarousel(MATCHES)

updateCarousel(); // This sorts by likes automatically
requestAnimationFrame(() => {
  hydrateCarouselOdds();
});


document.querySelector('.carousel-btn.left')?.addEventListener('click', () => {
  const track = document.getElementById('carouselTrack');
  if (track) {
    const scrollAmount = Math.min(track.clientWidth * 0.8, 400);
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }
});

document.querySelector('.carousel-btn.right')?.addEventListener('click', () => {
  const track = document.getElementById('carouselTrack');
  if (track) {
    const scrollAmount = Math.min(track.clientWidth * 0.8, 400);
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
});

// Auto-scroll carousel
function startCarouselAutoScroll() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  carouselInterval = setInterval(() => {
    if (!isCarouselPaused) {
      const cardWidth = track.querySelector('.event-card')?.offsetWidth || 300;
      const scrollAmount = Math.min(cardWidth, track.clientWidth * 0.8); // Never scroll more than 80% of viewport

      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }, 5000);
}

let isCarouselPaused = false;

// Pause on hover
const carouselTrack = document.getElementById('carouselTrack');
if (carouselTrack) {
  carouselTrack.addEventListener('mouseenter', () => {
    isCarouselPaused = true;
  });

  carouselTrack.addEventListener('mouseleave', () => {
    isCarouselPaused = false;
  });
}

// Also pause when user manually clicks buttons
document.querySelector('.carousel-btn.left')?.addEventListener('click', () => {
  clearInterval(carouselInterval);
  setTimeout(() => startCarouselAutoScroll(), 10000); // Resume after 10 seconds
});

document.querySelector('.carousel-btn.right')?.addEventListener('click', () => {
  clearInterval(carouselInterval);
  setTimeout(() => startCarouselAutoScroll(), 10000); // Resume after 10 seconds
});

// Start auto-scroll when page loads
startCarouselAutoScroll();

// Restart if user interacts with odds buttons in carousel
document.addEventListener('click', (e) => {
  if (e.target.closest('.event-card')) {
    clearInterval(carouselInterval);
    setTimeout(() => startCarouselAutoScroll(), 10000);
  }
});

function hydrateCarouselOdds() {
  const cards = document.querySelectorAll('.event-card[data-id]');
  cards.forEach(card => {
    const id = card.dataset.id;
    const match = MATCHES.find(m => m.id === id);
    if (!match || !match.odds) return;

    const oddsWrap = card.querySelector('.carousel-odds');
    if (!oddsWrap) return;

    const allowed = match.sport === 'Football' ? ['1', 'X', '2'] : ['1', '2'];

    const oddsHtml = allowed.map(outcome => {
      const val = match.odds[outcome];
      if (!Number.isFinite(val)) return '';
      return `
        <button class="odd-btn" data-match="${match.id}" data-outcome="${outcome}" data-odd="${val}">
          <span class="lbl">${outcome}</span>
          <span class="val">${val}</span>
        </button>
      `;
    }).join('');

    oddsWrap.innerHTML = oddsHtml;
  });
}



const HISTORY_KEY = 'betnextgen-history-v1';



// ============================================
// State (with persistence)
// ============================================
const SLIP_KEY = 'betnextgen-slip-v1';

let slip = [];
try {
  const stored = localStorage.getItem(SLIP_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);

    // ✅ LAYER 2: Validate after loading
    if (Array.isArray(parsed)) {
      slip = parsed.filter(item =>
        item &&
        typeof item === 'object' &&
        item.matchId &&
        item.odd &&
        typeof item.odd === 'number' &&
        item.teams &&
        Array.isArray(item.teams) &&
        item.teams.length === 2 &&
        item.market &&
        item.selection
      );

      // ✅ LAYER 3: Auto-cleanup if corruption detected
      if (slip.length !== parsed.length) {
        console.warn(`🧹 Removed ${parsed.length - slip.length} corrupted items from bet slip`);
        saveSlip(); // Save cleaned version immediately
      }
    }
  }
} catch (error) {
  console.error('Error loading slip:', error);
  localStorage.removeItem(SLIP_KEY);
  slip = [];
}

function saveSlip() {
  try {
    // ✅ Validate before saving
    const validSlip = slip.filter(item =>
      item &&
      typeof item === 'object' &&
      item.matchId &&
      item.odd &&
      typeof item.odd === 'number' &&
      item.teams &&
      Array.isArray(item.teams) &&
      item.teams.length === 2
    );

    // Only save if valid
    if (validSlip.length !== slip.length) {
      console.warn('Filtered out invalid items before saving');
      slip = validSlip; // Update slip with valid items only
    }

    localStorage.setItem(SLIP_KEY, JSON.stringify(validSlip));
  } catch (error) {
    console.error('Error saving slip:', error);
    // On error, clear storage to prevent corruption
    localStorage.removeItem(SLIP_KEY);
  }
}

// ============================================
// RESTORE BETS FUNCTIONALITY
// ============================================

const SAVED_SLIP_KEY = 'betnextgen-saved-slip';

// Save current slip before clearing
function saveSlipBackup() {
  if (slip.length > 0) {
    localStorage.setItem(SAVED_SLIP_KEY, JSON.stringify(slip));
    console.log('💾 Bet slip backed up:', slip.length, 'bets');
  }
}

// Restore previous slip
function restoreBets() {
  const savedSlip = localStorage.getItem(SAVED_SLIP_KEY);

  if (!savedSlip) {
    toast('❌ No previous bets to restore');
    return;
  }

  try {
    const restoredBets = JSON.parse(savedSlip);

    if (!restoredBets || restoredBets.length === 0) {
      toast('❌ No bets found');
      return;
    }

    // Restore the slip
    slip = [...restoredBets];
    saveSlip();
    updateOddSelections();
    renderSlip();
    renderBetItems();
    updateCollapsedBetSlip();
    updatePotentialWin();
    updateRestoreButton();

    toast(`✅ Restored ${slip.length} bet${slip.length > 1 ? 's' : ''}!`);

    // Clear the backup after restoring
    localStorage.removeItem(SAVED_SLIP_KEY);

  } catch (error) {
    console.error('Error restoring bets:', error);
    toast('❌ Failed to restore bets');
  }
}

// Update restore button visibility and count
// Add this to your updateRestoreButton function
function updateRestoreButton() {
  const restoreSection = document.getElementById('restoreBetsSection');
  const restoreCount = document.getElementById('restoreCount');
  const savedSlip = localStorage.getItem(SAVED_SLIP_KEY);

  if (!restoreSection) return;

  if (slip.length === 0 && savedSlip) {
    try {
      const saved = JSON.parse(savedSlip);
      if (saved && saved.length > 0) {
        restoreSection.classList.remove('hidden');
        if (restoreCount) {
          restoreCount.textContent = `${saved.length} selection${saved.length > 1 ? 's' : ''}`;
        }

        // ✅ DON'T auto-open - just show collapsed state
        // User can click to open and see restore button

        return;
      }
    } catch (error) {
      console.error('Error parsing saved slip:', error);
    }
  }

  // Hide if slip is not empty or no saved data
  restoreSection.classList.add('hidden');
}

// Restore button click handler
document.addEventListener('DOMContentLoaded', () => {
  const restoreBtn = document.getElementById('restoreBetsBtn');

  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      restoreBets();
    });
  }

  // Dismiss restore button
  const dismissRestoreBtn = document.getElementById('dismissRestoreBtn');

  if (dismissRestoreBtn) {
    dismissRestoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Clear saved slip from storage
      localStorage.removeItem(SAVED_SLIP_KEY);

      // Hide restore section
      document.getElementById('restoreBetsSection').classList.add('hidden');

      // ✅ UPDATE: Call both functions to hide collapsed trigger too
      updateRestoreButton();
      updateBetSlipTrigger();

      toast('❌ Previous bets dismissed');
    });
  }

  // ============================================
  // MATCH MARKETS EVENT LISTENERS
  // ============================================

  // Market tabs filtering
  document.querySelectorAll('.market-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const category = this.getAttribute('data-tab');

      document.querySelectorAll('.market-card').forEach(card => {
        if (category === 'all') {
          card.style.display = 'block';
        } else {
          const cardCategories = card.getAttribute('data-category') || '';
          card.style.display = cardCategories.includes(category) ? 'block' : 'none';
        }
      });
    });
  });

  // Back button
  document.getElementById('backToMatches')?.addEventListener('click', () => {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.getElementById('inplaySection').classList.add('active');

    // Show footer and stats again
    document.querySelector('.site-footer').style.display = 'block';
    document.querySelector('.live-stats-dashboard').style.display = 'block'; // ✅ ADD THIS
    document.querySelector('.search-bar-section').style.display = 'block'; // ✅ ADD THIS TOO
  });

  // Market option clicks
  document.querySelectorAll('.market-option-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      this.classList.toggle('selected');
      const optionName = this.querySelector('.option-name')?.textContent || '';
      const optionValue = this.querySelector('.option-value')?.textContent || '';
      toast(`Added ${optionName} @ ${optionValue}`);
    });
  });

  // Click on live match to open markets
  document.addEventListener('click', function (e) {
    const matchCard = e.target.closest('.live-match-card');

    if (matchCard && !e.target.closest('.odd-btn') && !e.target.closest('.odds-btn') && !e.target.closest('.action-btn')) {
      // ✅ Get match ID from card
      const matchId = matchCard.dataset.matchId;

      // ✅ Find actual match data
      const match = LIVE_MATCHES_DATA.find(m => m.id === matchId);

      if (!match) {
        console.error('Match not found:', matchId);
        return;
      }

      // ✅ Use real match data with current timer
      const currentTimer = matchTimers.get(matchId);
      const currentTime = currentTimer ? formatMatchTime(currentTimer) : match.time;

      const matchData = {
        id: match.id,
        league: match.league,
        teams: match.teams,
        score: match.score,
        time: currentTime,
        odds: match.odds
      };

      openMatchMarketsPage(matchData);
    }
  });

});

// 🔥 WRAP saveSlip to update bet slip visibility
const _originalSaveSlip = saveSlip;
saveSlip = function () {
  _originalSaveSlip();
  updateBetSlipTrigger();
  ensureBetSlipSticky();
};

const STAKE_KEY = 'betnextgen-stake-v1';

// ==== Wallet & Mode ====
const WALLET_KEY = 'betnextgen-wallet-v1';
const MODE_KEY = 'betnextgen-mode-v1'; // 'combo' | 'singles'

let wallet = 0;
function getWallet() {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return Number(user.balance) || 0;
}
wallet = getWallet();
let betMode = localStorage.getItem(MODE_KEY) || 'combo';

function setWallet(v) {
  wallet = Math.max(0, Number(v) || 0);

  // Update currentUser
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  user.balance = wallet;
  user.withdrawable = wallet;
  localStorage.setItem('currentUser', JSON.stringify(user));

  // ✅ NEW - ALSO UPDATE demoAccounts
  const accounts = JSON.parse(localStorage.getItem('demoAccounts') || '[]');
  const accountIndex = accounts.findIndex(acc => acc.email === user.email);

  if (accountIndex !== -1) {
    accounts[accountIndex].balance = wallet;
    accounts[accountIndex].withdrawable = wallet;
    accounts[accountIndex].credits = user.credits || 0;
    localStorage.setItem('demoAccounts', JSON.stringify(accounts));
  }

  updateProfileDisplay();
  updateWalletUI();
}

function updateWalletUI() {
  const el = document.getElementById('walletBalance');
  if (el) el.textContent = '$' + fmtSafe(wallet);
}
function setMode(mode) {
  betMode = mode === 'singles' ? 'singles' : 'combo';
  localStorage.setItem(MODE_KEY, betMode);
  renderSlip();
}


// Ensures mode toggle + wallet row exist in the Bet Slip (safe to call anytime)
function ensureSlipChrome() {
  const slipEl = document.querySelector('.bet-slip');
  if (!slipEl) return;

  // --- Mode toggle row (above slip list)
  if (!document.getElementById('betModeRow')) {
    const row = document.createElement('div');
    row.id = 'betModeRow';
    row.className = 'row';
    row.style.margin = '6px 0 10px';
    row.innerHTML = `
      <div style="display:flex; gap:6px;">
        <button id="modeSingles" class="btn btn-login" style="padding:6px 10px">Singles</button>
        <button id="modeCombo"   class="btn btn-login" style="padding:6px 10px">Combo</button>
      </div>
      <span class="muted" style="font-size:12px;">Switch bet mode</span>
    `;
    const empty = document.getElementById('slipEmpty');
    slipEl.insertBefore(row, empty ?? slipEl.firstChild);

    const syncActive = () => {
      document.getElementById('modeSingles')?.classList.toggle('btn-join', betMode === 'singles');
      document.getElementById('modeCombo')?.classList.toggle('btn-join', betMode === 'combo');
    };
    row.addEventListener('click', (e) => {
      if (e.target.id === 'modeSingles') setMode('singles');
      if (e.target.id === 'modeCombo') setMode('combo');
      syncActive();
      toast(`Mode: ${betMode === 'singles' ? 'Singles' : 'Combo'}`);
    });
    syncActive();
  }

  // --- Wallet row (first line inside .slip-summary)
  const summary = slipEl.querySelector('.slip-summary');
  if (summary && !document.getElementById('walletRow')) {
    const row = document.createElement('div');
    row.id = 'walletRow';
    row.className = 'row';
    row.style.marginBottom = '6px';
    row.innerHTML = `
      <span>Balance</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <strong id="walletBalance">$0.00</strong>
        <button id="addFunds" class="btn btn-login" style="padding:6px 10px">+ $100</button>
      </div>
    `;
    summary.prepend(row);
    document.getElementById('addFunds')?.addEventListener('click', () => setWallet(wallet + 100));
  }

  updateWalletUI();
}

// ✅ SIMPLE - Just sync wallet from existing profile balance
setInterval(() => {
  const profileBalance = document.getElementById('userBalance');
  const walletAmount = document.querySelector('.balance-amount');

  if (profileBalance && walletAmount) {
    // Copy balance from profile to wallet
    walletAmount.textContent = profileBalance.textContent;
  }
}, 1000); // Check every second

// ✅ KEEP - Wallet click handler
document.addEventListener('click', (e) => {
  if (e.target.closest('.wallet-balance')) {
    console.log('Wallet clicked - open deposit modal');
  }
});

// ============================================
// MATCH MARKETS PAGE NAVIGATION
// ============================================

function openMatchMarketsPage(matchData) {
  // Hide all pages
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));

  const marketsPage = document.getElementById('matchMarketsPage');

  if (marketsPage) {
    marketsPage.classList.add('active');
  } else {
    console.error('matchMarketsPage not found!');
    return;
  }

  // Store current match ID globally
  window.currentMarketMatchId = matchData.id;

  // Hide footer, stats, and search bar
  document.querySelector('.site-footer').style.display = 'none';
  document.querySelector('.live-stats-dashboard').style.display = 'none';
  document.querySelector('.search-bar-section').style.display = 'none';

  // Populate match info
  document.getElementById('marketsLeagueBadge').textContent = matchData.league;
  document.getElementById('marketsTeamName1').textContent = matchData.teams[0];
  document.getElementById('marketsTeamName2').textContent = matchData.teams[1];

  document.getElementById('marketsScore1').textContent = matchData.score[0];
  document.getElementById('marketsScore2').textContent = matchData.score[1];

  // ✅ Sync timer with live matches
  const timeEl = document.getElementById('marketsMatchTime');
  if (timeEl && matchData.id) {
    timeEl.dataset.matchId = matchData.id;

    // Get current timer from central system
    const currentTimer = matchTimers.get(matchData.id);
    if (currentTimer) {
      timeEl.textContent = formatMatchTime(currentTimer);
    } else {
      timeEl.textContent = matchData.time;
    }
  }

  // ✅ UPDATED: Set initial odds for fulltime result specifically
  const ft1Span = document.getElementById('ft-1');
  const ftXSpan = document.getElementById('ft-x');
  const ft2Span = document.getElementById('ft-2');

  if (ft1Span) {
    ft1Span.textContent = matchData.odds['1'];
    const ft1Btn = ft1Span.closest('.market-option-btn');
    if (ft1Btn) {
      ft1Btn.dataset.match = matchData.id;
      ft1Btn.dataset.odd = matchData.odds['1'];
    }
  }

  if (ftXSpan) {
    ftXSpan.textContent = matchData.odds['X'];
    const ftXBtn = ftXSpan.closest('.market-option-btn');
    if (ftXBtn) {
      ftXBtn.dataset.match = matchData.id;
      ftXBtn.dataset.odd = matchData.odds['X'];
    }
  }

  if (ft2Span) {
    ft2Span.textContent = matchData.odds['2'];
    const ft2Btn = ft2Span.closest('.market-option-btn');
    if (ft2Btn) {
      ft2Btn.dataset.match = matchData.id;
      ft2Btn.dataset.odd = matchData.odds['2'];
    }
  }

  // ✅ Set data attributes for ALL OTHER market buttons
  const allMarketButtons = document.querySelectorAll('#matchMarketsPage .market-option-btn.odd-btn');

  allMarketButtons.forEach(btn => {
    const valueSpan = btn.querySelector('.option-value');

    if (valueSpan && !btn.dataset.match) {
      // Set match ID and current odd value
      btn.dataset.match = matchData.id;
      btn.dataset.odd = valueSpan.textContent;
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// Sync wallet balance and color
setInterval(() => {
  const profileBalance = document.getElementById('userBalance');
  const walletAmount = document.querySelector('.balance-amount');
  const wallet = document.querySelector('.wallet-balance');

  if (profileBalance && walletAmount && wallet) {
    walletAmount.textContent = profileBalance.textContent;

    const value = parseFloat(profileBalance.textContent);

    // Red if ≤50, Green if >50
    wallet.style.background = value <= 50
      ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
      : 'linear-gradient(135deg, #2ecc71, #27ae60)';
  }
}, 1000);

// Wallet click
document.addEventListener('click', (e) => {
  if (e.target.closest('.wallet-balance')) {
    console.log('Wallet clicked');
  }
});

setInterval(() => {
  const wallet = document.querySelector('.wallet-balance');
  const myBets = document.querySelector('.my-bets-btn'); // 
  const profile = document.getElementById('profileWrapper');

  if (wallet && profile) {
    wallet.style.display = profile.classList.contains('hidden') ? 'none' : 'flex';
    myBets.style.display = profile.classList.contains('hidden') ? 'none' : 'block'; // ADD THIS
  }
}, 500);

// Open My Bets Modal
const myBetsBtn = document.getElementById('myBetsBtn');
const myBetsModal = document.getElementById('myBetsModal');
const closeMyBets = document.getElementById('closeMyBets');

myBetsBtn?.addEventListener('click', () => {
  myBetsModal.classList.remove('hidden');
  renderMyBets(); // ADD THIS
  updateMyBetsBadge();
});

// Close modal
closeMyBets?.addEventListener('click', () => {
  myBetsModal.classList.add('hidden');
});

// Close on overlay click
document.querySelector('.my-bets-overlay')?.addEventListener('click', () => {
  myBetsModal.classList.add('hidden');
});

// Tab switching
document.querySelectorAll('.bet-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;

    // Remove active from all tabs
    document.querySelectorAll('.bet-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bet-tab-content').forEach(c => c.classList.remove('active'));

    // Add active to clicked tab
    e.target.classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');

    console.log('Switched to:', tabName);
    // TODO: Load bets for this tab
  });
});



// =========================
/* Rendering */
// =========================
function renderTrending() {
  const list = $$('#trendingList');
  if (!list) return;
  const shuffled = TRENDING.slice().sort(() => Math.random() - 0.5);
  list.innerHTML = shuffled.map(item => (
    `<li class="side-item">
       <svg class="icon" width="18" height="18"><use href="${item.icon}"/></svg>${item.label}
     </li>`
  )).join('');
}

function displayName(sport, outcome, teams) {
  if (sport === 'Football') {
    if (outcome === '1') return '1';
    if (outcome === 'X') return 'X';
    if (outcome === '2') return '2';
  }
  if (outcome === '1') return '1';
  if (outcome === '2') return '2';
  return outcome;
}


function renderCards() {
  const wrap = $$('#cards');
  if (!wrap) return;
  wrap.innerHTML = '';




  // Keep UI state after render
  updateOddSelections();
}

function updateOddSelections() {
  $$$('.odd-btn').forEach(b => {
    b.classList.remove('selected');
    b.setAttribute('aria-pressed', 'false');
  });
  slip.forEach(s => {
    const btn = $$(`.odd-btn[data-match="${s.matchId}"][data-outcome="${s.outcome}"]`);
    if (btn) {
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    }
  });
}

function renderSlip() {
  ensureSlipChrome(); // make sure UI exists

  const empty = $$('#slipEmpty');
  const list = $$('#slipList');
  if (!list || !empty) return;

  list.innerHTML = '';

  if (!slip.length) {
    empty.removeAttribute('hidden');
    list.setAttribute('hidden', 'true');
  } else {
    empty.setAttribute('hidden', 'true');
    list.removeAttribute('hidden');
    slip.forEach(item => {
      const legStake = Number(item.stake ?? 0);
      const legStakeInput = betMode === 'singles'
        ? `<input class="input leg-stake" data-leg="${item.matchId}" type="number" min="0" step="1" value="${legStake || 0}" style="width:90px;margin-left:8px"/>`
        : '';

      const el = document.createElement('div');
      el.className = 'slip-item';
      el.innerHTML = `
        <div class="meta">
          <div class="teams">${item.teams[0]} vs ${item.teams[1]}</div>
          <div class="market">${item.market}</div>
        </div>
        <div>
          <span class="odds">${formatOddDisplay(item.odd)}</span>
          ${legStakeInput}
          <button class="remove" aria-label="Remove" data-remove="${item.matchId}">×</button>
        </div>
      `;
      list.appendChild(el);
    });

    if (betMode === 'singles') {
      list.querySelectorAll('.leg-stake').forEach(inp => {
        inp.addEventListener('input', () => {
          const id = inp.dataset.leg;
          const it = slip.find(s => s.matchId === id);
          if (it) {
            it.stake = Math.max(0, Number(inp.value) || 0);
            saveSlip();
            updateTotals();
            updateBetSlipVisibility();
            updateRestoreButton();
          }
        });
      });
    }
  }


  // Hide/show global stake row
  const globalStakeRow = document.querySelector('label[for="stake"]')?.closest('.row');
  if (globalStakeRow) globalStakeRow.style.display = (betMode === 'combo') ? '' : 'none';

  updateTotals();
  updateBetSlipVisibility(); // <— add this line

}

function updateTotals() {
  const stakeInput = $$('#stake');
  const globalStake = Number(stakeInput?.value) || 0;
  const totalDec = slip.reduce((acc, b) => acc * Number(b.odd || 1), 1) || 1;

  let totalStake, payout;
  if (betMode === 'combo') {
    totalStake = globalStake;
    payout = globalStake * totalDec;
  } else {
    totalStake = slip.reduce((a, b) => a + (Number(b.stake) || 0), 0);
    payout = slip.reduce((a, b) => a + ((Number(b.stake) || 0) * Number(b.odd || 1)), 0);
  }

  $$('#totalOdds').textContent = formatOddDisplay(totalDec);
  $$('#payout').textContent = fmtSafe(payout);

  const canAfford = totalStake > 0 && totalStake <= wallet;
  const placeBtn = $$('#place');
  placeBtn.disabled = !(slip.length && canAfford);
  placeBtn.title = canAfford ? '' : 'Insufficient funds';
}

// =========================
// Odds format (DEC / FRAC / US)
// =========================


function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function toFrac(d) {
  if (!Number.isFinite(d) || d <= 1) return '-';
  const n = Math.round((d - 1) * 100), den = 100, g = gcd(n, den) || 1;
  return `${n / g}/${den / g}`;
}
function toUS(d) {
  if (!Number.isFinite(d) || d <= 1) return '-';
  return d >= 2 ? `+${Math.round((d - 1) * 100)}` : `-${Math.round(100 / (d - 1))}`;
}



function formatOddDisplay(dec) {
  if (oddsMode === 'dec') return fmtSafe(dec);
  if (oddsMode === 'frac') return toFrac(dec);
  return toUS(dec);
}

function repaintOdds() {
  // cards
  document.querySelectorAll('.odd-btn').forEach(btn => {
    const v = Number(btn.dataset.odd);
    const el = btn.querySelector('.val');
    if (el && Number.isFinite(v)) el.textContent = formatOddDisplay(v);
  });
  // slip
  document.querySelectorAll('.slip-item').forEach(it => {
    const id = it.querySelector('[data-remove]')?.dataset.remove;
    const s = id && slip.find(x => x.matchId === id);
    const el = it.querySelector('.odds');
    if (s && el) el.textContent = formatOddDisplay(s.odd);
  });
  // total
  const totalDec = slip.reduce((a, b) => a * Number(b.odd || 1), 1) || 1;
  const totEl = document.getElementById('totalOdds');
  if (totEl) totEl.textContent = formatOddDisplay(totalDec);
}

// Odds format in settings dropdown
const oddsDropdown = document.getElementById('oddsDropdown');
if (oddsDropdown) {
  oddsDropdown.value = oddsMode;
  oddsDropdown.addEventListener('change', (e) => {
    oddsMode = e.target.value;
    localStorage.setItem(ODDS_FMT_KEY, oddsMode);
    repaintOdds();
  });
}// Hook repaint after renders
const _renderCards = renderCards;
renderCards = function () { _renderCards(); repaintOdds(); };

const _renderSlip = renderSlip;
renderSlip = function () { _renderSlip(); repaintOdds(); };


// =========================
/* Interactions */
// =========================
// Find this code in your existing click handler (around line 900)
document.addEventListener('click', (e) => {
  const oddBtn = e.target.closest('.odd-btn') || e.target.closest('.odds-btn');
  if (oddBtn) {
    if (oddBtn.disabled) return;
    const matchId = oddBtn.dataset.match;
    const outcome = oddBtn.dataset.outcome;
    const odd = Number(oddBtn.dataset.odd);
    if (!Number.isFinite(odd)) return;

    // ✅ Find the match (check both regular and live matches)
    const match = MATCHES.find(m => m.id === matchId) || LIVE_MATCHES_DATA.find(m => m.id === matchId);
    if (!match) return;

    const market = displayName(match.sport, outcome, match.teams);

    const idx = slip.findIndex(b => b.matchId === matchId);
    if (idx > -1 && slip[idx].outcome === outcome) {
      slip.splice(idx, 1);
      toast('Selection removed');
    } else if (idx > -1) {
      slip[idx] = {
        matchId,
        teams: match.teams,
        outcome,
        odd,
        market,
        isLive: !!LIVE_MATCHES_DATA.find(m => m.id === matchId), // ✅ Mark as live
        league: match.league || match.comp,
        lockedOdd: odd
      };
      toast('Selection updated');
    } else {
      // ✅ Add new selection with live flag
      slip.push({
        matchId,
        teams: match.teams,
        outcome,
        odd,
        market,
        isLive: !!LIVE_MATCHES_DATA.find(m => m.id === matchId), // ✅ Mark as live
        league: match.league || match.comp,
        lockedOdd: odd
      });
      toast('Selection added');
    }
    saveSlip();
    updateOddSelections();
    renderSlip();
    updateBetSlipTrigger();
    renderBetItems();
    updateCollapsedBetSlip();
    updatePotentialWin();
    return;
  }


  // Handle remove buttons
  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) {
    const id = removeBtn.dataset.remove;
    slip = slip.filter(s => s.matchId !== id);
    saveSlip();
    updateOddSelections();
    renderSlip();
    updateBetSlipTrigger(); // ← ADDED THIS
    renderBetItems();
    updateCollapsedBetSlip();
    updatePotentialWin();
    toast('Selection removed');
    return;
  }

  // Handle modal close buttons
  const closeAttr = e.target.getAttribute && e.target.getAttribute('data-close');
  if (closeAttr) {
    const el = document.getElementById(closeAttr);
    closeAuth(el);
    return;
  }

  // Close modals on background click
  if (e.target.id === 'mClose' || e.target.closest('#mClose') || e.target.id === 'modal') {
    closeModal();
    return;
  }


});
// Stake input (persist)
const stakeInput = $$('#stake');
if (stakeInput) {
  const savedStake = localStorage.getItem(STAKE_KEY);
  if (savedStake !== null) stakeInput.value = savedStake;
  stakeInput.addEventListener('input', () => {
    localStorage.setItem(STAKE_KEY, stakeInput.value || '0');
    renderSlip();
  });
}

// Place bet (modal) — supports combo & singles, deducts from wallet
$$('#place')?.addEventListener('click', () => {
  if (!slip.length) return;

  const globalStake = Number($$('#stake').value) || 0;
  const totalDec = slip.reduce((acc, b) => acc * Number(b.odd || 1), 1) || 1;

  let requiredStake, payout, ticketHtml;
  if (betMode === 'combo') {
    requiredStake = globalStake;
    payout = globalStake * totalDec;
    ticketHtml = slip.map(b => `<li>${b.teams[0]} vs ${b.teams[1]} — <strong>${b.market}</strong> @ ${fmtSafe(b.odd)}</li>`).join('');
  } else {
    requiredStake = slip.reduce((a, b) => a + (Number(b.stake) || 0), 0);
    payout = slip.reduce((a, b) => a + ((Number(b.stake) || 0) * Number(b.odd || 1)), 0);
    ticketHtml = slip.map(b => {
      const s = Number(b.stake) || 0;
      return `<li>${b.teams[0]} vs ${b.teams[1]} — <strong>${b.market}</strong> @ ${fmtSafe(b.odd)} • Stake ${fmtSafe(s)} • Returns ${fmtSafe(s * Number(b.odd || 1))}</li>`;
    }).join('');
  }

  if (requiredStake <= 0) return;
  if (requiredStake > wallet) { toast('Insufficient funds'); return; }

  // ✅ NEW: Save backup before placing bet
  saveSlipBackup();

  setWallet(wallet - requiredStake);

  // ✅ Determine actual bet type based on number of selections
  let actualBetType;
  if (slip.length === 1) {
    actualBetType = 'Single';
  } else if (betMode === 'combo') {
    actualBetType = 'Combo';
  } else {
    actualBetType = 'Singles';
  }

  showModal('Bet Confirmation', `
  <p>Mode: <strong>${actualBetType}</strong></p>
  <p>Total Stake: <strong>${fmtSafe(requiredStake)}</strong></p>
  <p>Total Odds (dec): <strong>${fmtSafe(totalDec)}</strong></p>
  <p>Potential Payout: <strong>${fmtSafe(payout)}</strong></p>
  <ul>${ticketHtml}</ul>
`);
  toast('Bet placed');

  // ✅ Check if any selections are live
  const hasLiveBets = slip.some(s => s.isLive);

  const newBet = {
    id: Date.now(),
    type: slip.length === 1 ? 'single' : betMode,
    selections: slip.map(s => ({
      match: `${s.teams[0]} vs ${s.teams[1]}`,
      market: s.market,
      odds: s.odd,
      isLive: s.isLive || false, // ✅ Track live status per selection
      league: s.league || 'Unknown'
    })),
    stake: requiredStake,
    totalOdds: totalDec,
    potentialWin: payout,
    status: hasLiveBets ? 'live' : 'unsettled', // ✅ Mark bet as live if contains live selections
    isLive: hasLiveBets, // ✅ Add live flag
    timestamp: new Date().toISOString()
  };

  userBets.push(newBet);
  localStorage.setItem('userBets', JSON.stringify(userBets));

  localStorage.setItem("userBets", JSON.stringify(userBets));
  updateMyBetsBadge(); // ✅ Update badge after placing bet

  // Clear slip after placing
  slip = [];
  saveSlip();
  updateOddSelections();
  renderSlip();
});


// =========================
// Theme toggle using body.dark-mode
// =========================

function applyTheme(mode) {
  // Remove both classes first
  document.body.classList.remove('dark-mode', 'light-mode');

  // Add the correct class
  if (mode === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.add('dark-mode');
  }

  // Update theme text in UI
  const themeText = document.getElementById('themeText');
  if (themeText) {
    themeText.textContent = mode === 'dark' ? 'Dark' : 'Light';
  }

  localStorage.setItem(THEME_KEY, mode);
}

// Load saved theme or default to dark
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

// Theme toggle button click
document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
  const currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});
// =========================
// Dock Theme Toggle to Left (next to logo)
// =========================
(() => {
  const actions = document.querySelector('.header-actions');
  const theme = document.getElementById('themeToggle');
  if (!actions || !theme) return;

  // Try to place the toggle right after a brand/logo element if present
  const brand = document.querySelector(
    '.brand, .logo, .site-logo, .site-title, .header-title, header h1, .header h1'
  );

  if (brand && brand.parentElement) {
    // Put the toggle immediately after the brand
    brand.insertAdjacentElement('afterend', theme);
    theme.classList.add('left-docked');
  } else {
    // Fallback: pin the toggle to the left edge of the same bar that holds .header-actions
    const bar = actions.parentElement;
    if (bar) {
      // Ensure the bar can anchor absolutely positioned children
      if (getComputedStyle(bar).position === 'static') bar.style.position = 'relative';
      bar.prepend(theme);
      theme.classList.add('left-docked-abs');
    }
  }
})();

// =========================
// Modal helpers
// =========================
function showModal(title, html) {
  $$('#mTitle').textContent = title;
  $$('#mBody').innerHTML = html;
  $$('#modal').classList.add('open');
  $$('#modal').setAttribute('aria-hidden', 'false');
}
function closeModal() {
  $$('#modal').classList.remove('open');
  $$('#modal').setAttribute('aria-hidden', 'true');
}



// =========================
// Auth Modals and Nav toggle
// =========================
const navToggleBtn = $$('#navToggle');
const navBackdrop = $$('#navBackdrop');
if (navToggleBtn && navBackdrop) {
  navToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
    navBackdrop.hidden = !document.body.classList.contains('nav-open');
  });
  navBackdrop.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    navBackdrop.hidden = true;
  });
}

// ✅ DEFINE FUNCTIONS OUTSIDE DOMContentLoaded SO THEY'RE GLOBALLY ACCESSIBLE
function openAuth(el) {
  if (el) {
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
  }
}

function closeAuth(el) {
  if (el) {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
  }
}

// ✅ WRAP ONLY THE EVENT LISTENERS IN DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const openLoginBtn = $$('#openLogin');
  const openSignupBtn = $$('#openSignup');
  const loginModal = $$('#loginModal');
  const signupModal = $$('#signupModal');

  // Add click listeners only if elements exist
  if (openLoginBtn && loginModal) {
    openLoginBtn.addEventListener('click', () => openAuth(loginModal));
  }

  if (openSignupBtn && signupModal) {
    openSignupBtn.addEventListener('click', () => openAuth(signupModal));
  }

  // Handle close buttons
  document.querySelectorAll('.close-x').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) closeAuth(modal);
      }
    });
  });

  // Click outside modal to close
  window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeAuth(loginModal);
    if (e.target === signupModal) closeAuth(signupModal);
  });
});



// Block Social and Ask AI when logged out - SHORT VERSION
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#social"], a[href="#ask_ai"]');
  if (!link) return;

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    e.preventDefault();
    e.stopImmediatePropagation();
    toast('Please log in to access this feature');
    setTimeout(() => document.getElementById('openLogin')?.click(), 100);
  }
}, true); // ← 'true' makes it capture phase (runs first)





// Live Events Functionality
document.addEventListener('DOMContentLoaded', function () {
  // Sport tabs functionality
  const sportTabs = document.querySelectorAll('.sport-tab');

  sportTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      // Remove active class from all tabs
      sportTabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');

      const sport = this.dataset.sport;
      filterMatchesBySport(sport);
    });
  });

  // Market tab switching for live events
  document.querySelectorAll('.market-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      const market = this.dataset.market;
      const card = this.closest('.live-match-card');

      // Update active tab
      card.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Update visible odds
      card.querySelectorAll('.odds-set').forEach(set => {
        set.classList.toggle('active', set.dataset.odds === market);
      });
    });
  });

  // Odds buttons functionality
  const oddsButtons = document.querySelectorAll('.live-events-section .odd-btn');

  oddsButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const outcome = this.dataset.outcome;
      const oddValue = this.dataset.odd; // Changed from querySelector

      // Add to bet slip
      const card = this.closest('.live-match-card');
      const teamRows = card.querySelectorAll('.team-row');
      const teamHome = teamRows[0]?.querySelector('.team-name')?.textContent || 'Team 1';
      const teamAway = teamRows[1]?.querySelector('.team-name')?.textContent || 'Team 2';

      // Use your existing slip system
      const matchId = 'live-' + Date.now();
      const odd = parseFloat(oddValue);

      slip.push({
        matchId,
        teams: [teamHome, teamAway],
        outcome,
        odd,
        market: outcome,
        isLive: true
      });

      saveSlip();
      updateOddSelections();
      renderSlip();
      updateBetSlipTrigger();
      toast('Live bet added');

      // Visual feedback
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });

  // Favorite buttons functionality
  const favoriteButtons = document.querySelectorAll('.live-events-section .favorite-btn');

  favoriteButtons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      this.classList.toggle('favorited');

      if (this.classList.contains('favorited')) {
        this.style.color = '#f59e0b';
        this.textContent = '⭐';
      } else {
        this.style.color = '';
        this.textContent = '⭐';
      }
    });
  });

  // Auto-update live times
  setInterval(updateLiveTimes, 1000);
}); // ← THIS closes DOMContentLoaded

// Live Sports Filter Functionality
document.addEventListener('DOMContentLoaded', () => {
  const sportTabs = document.querySelectorAll('.live-sport-tab');

  sportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      sportTabs.forEach(t => t.classList.remove('active'));

      // Add active to clicked tab
      tab.classList.add('active');

      // Get selected sport
      const selectedSport = tab.dataset.sport;

      // Filter matches by sport
      filterLiveMatchesBySport(selectedSport);

      // Show toast notification
      const sportName = tab.querySelector('.tab-label').textContent;
      toast(`Showing ${sportName} live matches`);
    });
  });
});

function filterLiveMatchesBySport(sport) {
  const leagueSections = document.querySelectorAll('.live-matches-container .league-section');

  if (sport === 'all') {
    // Show all matches
    leagueSections.forEach(section => {
      section.style.display = 'block';
    });
  } else {
    // Filter by sport
    leagueSections.forEach(section => {
      const sectionSport = section.dataset.sport;

      if (sectionSport === sport) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  }
}

// Filter matches by sport
function filterMatchesBySport(sport) {
  const leagueSections = document.querySelectorAll('.league-section');

  if (sport === 'highlights') {
    leagueSections.forEach(section => section.style.display = 'block');
    return;
  }

  // For now, show all matches (you can implement actual filtering based on sport)
  leagueSections.forEach(section => {
    section.style.display = 'block';
  });

  console.log('Filtering matches for sport:', sport);
}

// Update live match times
function updateLiveTimes() {
  const liveTimes = document.querySelectorAll('.live-time');

  liveTimes.forEach(timeEl => {
    const currentTime = timeEl.textContent;
    const [minutes, seconds] = currentTime.split(':').map(num => parseInt(num));

    let newSeconds = seconds + 1;
    let newMinutes = minutes;

    if (newSeconds >= 60) {
      newSeconds = 0;
      newMinutes += 1;
    }

    // Don't go beyond 90 minutes for demo
    if (newMinutes < 90) {
      timeEl.textContent = `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`;
    }
  });
}

// Add to bet slip function (integrate with your existing bet slip system)
function addToBetSlip(bet) {
  console.log('Adding live bet to slip:', bet);

  // If you have an existing addToBetSlip function, call it here
  // Otherwise, implement the logic to add the bet to your bet slip

  // Show notification
  showNotification(`Added ${bet.teamHome} vs ${bet.teamAway} (${bet.outcome}: ${bet.odds}) to bet slip`);
}

// Notification function
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-color);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Multi-step form logic
const signupForm = document.getElementById('signupForm');
const formSteps = document.querySelectorAll('.form-step');
const progressSteps = document.querySelectorAll('.progress-step');
let currentStep = 1;

// Validation patterns
const patterns = {
  name: /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,30}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
};

// Show specific step
function showStep(step) {
  // Update form steps
  formSteps.forEach(s => {
    s.classList.toggle('active', s.dataset.step == step);
  });

  // Update progress indicator
  progressSteps.forEach((s, index) => {
    const stepNum = index + 1;
    s.classList.toggle('active', stepNum === step);
    s.classList.toggle('completed', stepNum < step);
  });

  currentStep = step;
}

// Validate field
function validateField(field, pattern, errorMsg) {
  const value = field.value.trim();
  const errorEl = document.getElementById(field.id.replace('su', '') + 'Error');

  if (!value) {
    showError(errorEl, 'This field is required');
    field.classList.add('error');
    return false;
  }

  if (pattern && !pattern.test(value)) {
    showError(errorEl, errorMsg);
    field.classList.add('error');
    return false;
  }

  hideError(errorEl);
  field.classList.remove('error');
  return true;
}

// Show/hide errors
function showError(el, msg) {
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  }
}

function hideError(el) {
  if (el) {
    el.textContent = '';
    el.classList.remove('show');
  }
}

// Validate age (18+)
function validateAge(dateStr) {
  const dob = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

// Step 1 validation
function validateStep1() {
  const firstName = document.getElementById('suFirst');
  const lastName = document.getElementById('suLast');
  const dob = document.getElementById('suDob');
  const country = document.getElementById('suCountry');

  let valid = true;

  // In validateStep1() function, ADD this before the return statement:

  // Validate gender
  const gender = document.getElementById('suGender');
  const genderError = document.getElementById('genderError');
  if (!gender.value) {
    showError(genderError, 'Please select your gender');
    gender.classList.add('error');
    valid = false;
  } else {
    hideError(genderError);
    gender.classList.remove('error');
  }
  // Validate first name
  if (!validateField(firstName, patterns.name, 'Please enter a valid first name')) {
    valid = false;
  }

  // Validate last name
  if (!validateField(lastName, patterns.name, 'Please enter a valid last name')) {
    valid = false;
  }

  // Validate date of birth
  const dobError = document.getElementById('dobError');
  if (!dob.value) {
    showError(dobError, 'Date of birth is required');
    dob.classList.add('error');
    valid = false;
  } else if (!validateAge(dob.value)) {
    showError(dobError, 'You must be 18 or older to register');
    dob.classList.add('error');
    valid = false;
  } else {
    hideError(dobError);
    dob.classList.remove('error');
  }

  // Validate country
  const countryError = document.getElementById('countryError');
  if (!country.value) {
    showError(countryError, 'Please select your country');
    country.classList.add('error');
    valid = false;
  } else {
    hideError(countryError);
    country.classList.remove('error');
  }

  return valid;
}

// Step 2 validation
function validateStep2() {
  const email = document.getElementById('suEmail');
  const username = document.getElementById('suUsername');
  const password = document.getElementById('suPassword');
  const confirm = document.getElementById('suConfirm');

  let valid = true;

  // Validate email
  if (!validateField(email, patterns.email, 'Please enter a valid email address')) {
    valid = false;
  }

  // Validate username
  if (!validateField(username, patterns.username, 'Username must be 3-20 characters, letters and numbers only')) {
    valid = false;
  }

  // Validate password
  if (!validateField(password, patterns.password, 'Password must be at least 8 characters with uppercase, lowercase and numbers')) {
    valid = false;
  }

  // Validate password confirmation
  const confirmError = document.getElementById('confirmError');
  if (confirm.value !== password.value) {
    showError(confirmError, 'Passwords do not match');
    confirm.classList.add('error');
    valid = false;
  } else if (!confirm.value) {
    showError(confirmError, 'Please confirm your password');
    confirm.classList.add('error');
    valid = false;
  } else {
    hideError(confirmError);
    confirm.classList.remove('error');
  }

  return valid;
}

// Step 3 validation
function validateStep3() {
  const terms = document.getElementById('suTerms');
  const termsError = document.getElementById('termsError');

  if (!terms.checked) {
    showError(termsError, 'You must accept the Terms & Conditions');
    return false;
  }

  hideError(termsError);
  return true;
}

// Password strength checker
const passwordInput = document.getElementById('suPassword');
const strengthBar = document.getElementById('strengthBar');

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    const value = passwordInput.value;
    let strength = 0;

    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[!@#$%^&*]/.test(value)) strength++;

    strengthBar.className = 'strength-bar';
    if (strength <= 2) {
      strengthBar.classList.add('weak');
    } else if (strength <= 3) {
      strengthBar.classList.add('medium');
    } else {
      strengthBar.classList.add('strong');
    }
  });
}

// Password toggle visibility
document.querySelectorAll('.password-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const targetId = toggle.dataset.target;
    const input = document.getElementById(targetId);

    if (input.type === 'password') {
      input.type = 'text';
      toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      `;
    } else {
      input.type = 'password';
      toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
    }
  });
});

// Next button handlers
document.querySelectorAll('.btn-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const nextStep = parseInt(btn.dataset.next);
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      showStep(nextStep);
    }
  });
});

// Back button handlers
document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', () => {
    const prevStep = parseInt(btn.dataset.prev);
    showStep(prevStep);
  });
});

// Form submission
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    // Collect form data
    const formData = {
      firstName: document.getElementById('suFirst').value.trim(),
      lastName: document.getElementById('suLast').value.trim(),
      dob: document.getElementById('suDob').value,
      country: document.getElementById('suCountry').value,
      gender: document.getElementById('suGender').value,
      email: document.getElementById('suEmail').value.trim(),
      username: document.getElementById('suUsername').value.trim(),
      password: document.getElementById('suPassword').value,
      promoCode: document.getElementById('suPromo').value.trim(),
      acceptTerms: document.getElementById('suTerms').checked,
      marketing: document.getElementById('suMarketing').checked,
      rememberMe: document.getElementById('suRemember').checked
    };

    // ✅ SAVE TO DEMO ACCOUNTS (MAX 5)
    let savedAccounts = JSON.parse(localStorage.getItem('demoAccounts')) || [];

    // Check if account already exists
    const existingAccount = savedAccounts.find(acc => acc.email === formData.email);

    if (existingAccount) {
      showAuthMessage('This email is already registered!', 3000);
      return;
    }

    // Add new account (max 5)
    if (savedAccounts.length >= 5) {
      savedAccounts.shift(); // Remove oldest account
    }

    // ✅ NEW CODE - Saves balance too
    savedAccounts.push({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      username: formData.username,
      balance: 100.00,        // ✅ ADDED
      withdrawable: 0.00,     // ✅ ADDED
      credits: 100.00         // ✅ ADDED
    });

    // Save to localStorage
    localStorage.setItem('demoAccounts', JSON.stringify(savedAccounts));

    // Create current user session
    const newUser = {
      username: formData.username,
      fullName: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      email: formData.email,
      balance: 100.00, // Welcome bonus
      withdrawable: 0.00,
      credits: 100.00
    };

    localStorage.setItem("currentUser", JSON.stringify(newUser));
    localStorage.setItem("isLoggedIn", "true");
    document.body.classList.add('user-logged-in');

    if (formData.rememberMe) {
      localStorage.setItem('rememberEmail', formData.email);
    }

    // Close modal and update UI
    closeAuth(document.getElementById('signupModal'));
    updateUIAfterAuth(true);

    // Show success message with title
    const title = formData.gender === 'female' ? 'Ms.' : 'Mr.';
    showAuthMessage(`Welcome ${title} ${formData.firstName} ${formData.lastName}! 🎉 You've received a €100 welcome bonus!`, 3000);

    // Reset form
    signupForm.reset();
    showStep(1);
  });
}

// Social sign-up handlers
document.getElementById('googleSignup')?.addEventListener('click', () => {
  // Simulate Google OAuth
  showAuthMessage('Google sign-up coming soon!', 2000);
});

document.getElementById('facebookSignup')?.addEventListener('click', () => {
  // Simulate Facebook OAuth
  showAuthMessage('Facebook sign-up coming soon!', 2000);
});

// Set date max for age restriction
const dobInput = document.getElementById('suDob');
if (dobInput) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  dobInput.max = maxDate.toISOString().slice(0, 10);
  dobInput.min = '1900-01-01';
}

// Real-time validation on blur
document.getElementById('suFirst')?.addEventListener('blur', () => {
  validateField(document.getElementById('suFirst'), patterns.name, 'Please enter a valid first name');
});

document.getElementById('suLast')?.addEventListener('blur', () => {
  validateField(document.getElementById('suLast'), patterns.name, 'Please enter a valid last name');
});

document.getElementById('suEmail')?.addEventListener('blur', () => {
  validateField(document.getElementById('suEmail'), patterns.email, 'Please enter a valid email address');
});

document.getElementById('suUsername')?.addEventListener('blur', () => {
  validateField(document.getElementById('suUsername'), patterns.username, 'Username must be 3-20 characters, letters and numbers only');
});
// Forgot password + Social demo handlers
(() => {
  const forgot = document.querySelector('#forgotLink');
  forgot?.addEventListener('click', (e) => {
    e.preventDefault();
    const html = `
      <form id="resetForm" class="auth-form">
        <label>
          <span>Email</span>
          <input type="email" id="resetEmail" class="input" required />
        </label>
        <button class="btn btn-join place" type="submit">Send reset link</button>
      </form>
    `;
    showModal('Reset password', html);

    const modal = document.querySelector('#modal');
    const handler = (ev) => {
      if (ev.target && ev.target.id === 'resetForm') {
        ev.preventDefault();
        const email = document.querySelector('#resetEmail').value.trim();
        if (!email || !email.includes('@')) return;
        showModal('Email sent', `<p>We’ve sent a reset link to <strong>${email}</strong> (demo).</p>`);
        modal.removeEventListener('submit', handler, true);
      }
    };
    modal.addEventListener('submit', handler, true);
  });

  const demo = (p) => showModal(`${p} Login`, `<p>This is a demo. No real ${p} OAuth connection.</p>`);
  document.getElementById('fbLogin')?.addEventListener('click', () => demo('Facebook'));
  document.getElementById('gLogin')?.addEventListener('click', () => demo('Google'));
})();

// Main Search Bar Functionality (under header)
const mainSearchInput = document.getElementById('mainSearchInput');
const searchBtnInline = document.querySelector('.search-btn-inline');

// Create results dropdown
const resultsDropdown = document.createElement('div');
resultsDropdown.className = 'search-results-dropdown';
resultsDropdown.style.cssText = `
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #1e293b;
  border: 2px solid #ffd34d;
  border-radius: 16px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: none;
  z-index: 100;
`;

document.querySelector('.search-container')?.appendChild(resultsDropdown);

// Search on input
if (mainSearchInput) {
  mainSearchInput.addEventListener('input', () => {
    const term = mainSearchInput.value.trim().toLowerCase();

    if (!term) {
      resultsDropdown.style.display = 'none';
      return;
    }

    const results = MATCHES.filter(m =>
      m.teams.some(t => t.toLowerCase().includes(term)) ||
      m.sport.toLowerCase().includes(term) ||
      m.comp.toLowerCase().includes(term)
    );

    if (results.length === 0) {
      resultsDropdown.innerHTML = '<div class="search-result-item">No results found</div>';
      resultsDropdown.style.display = 'block';
      return;
    }

    resultsDropdown.innerHTML = results.map(m => `
      <div class="search-result-item" data-id="${m.id}">
        <div class="result-meta">${m.comp} • ${m.sport}</div>
        <div class="result-match"><strong>${m.teams[0]} vs ${m.teams[1]}</strong></div>
        <div class="result-meta">${m.time}</div>
      </div>
    `).join('');

    resultsDropdown.style.display = 'block';
  });

  // Search on button click
  searchBtnInline?.addEventListener('click', () => {
    if (mainSearchInput.value.trim()) {
      resultsDropdown.style.display = resultsDropdown.style.display === 'none' ? 'block' : 'none';
    }
  });

  // Search on Enter
  mainSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const firstResult = resultsDropdown.querySelector('.search-result-item[data-id]');
      if (firstResult) {
        firstResult.click();
      }
    }
  });
}

// Click on result
resultsDropdown.addEventListener('click', (e) => {
  const item = e.target.closest('.search-result-item');
  if (!item || !item.dataset.id) return;

  const matchId = item.dataset.id;
  const matchCard = document.querySelector(`[data-id="${matchId}"]`);

  if (matchCard) {
    matchCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    matchCard.classList.add('highlight-match');
    setTimeout(() => matchCard.classList.remove('highlight-match'), 2000);
  }

  resultsDropdown.style.display = 'none';
  mainSearchInput.value = '';
});

// Close on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    resultsDropdown.style.display = 'none';
  }
});

// Close on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    resultsDropdown.style.display = 'none';
  }
});

// AI Search - Uses same MATCHES data as main search
const aiEventSearch = document.getElementById('aiEventSearch');
const aiSearchResults = document.getElementById('aiSearchResults');
const selectedEventDisplay = document.getElementById('selectedEventDisplay');
const getPredictionBtn = document.getElementById('getPredictionBtn');
const aiPredictionResults = document.getElementById('aiPredictionResults');

let selectedEvent = null;

// AI Search functionality
if (aiEventSearch) {
  aiEventSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (searchTerm.length < 2) {
      aiSearchResults.classList.add('hidden');
      return;
    }

    // Use same MATCHES data as main search
    const results = MATCHES.filter(m =>
      m.teams.some(t => t.toLowerCase().includes(searchTerm)) ||
      m.sport.toLowerCase().includes(searchTerm) ||
      m.comp.toLowerCase().includes(searchTerm)
    );

    if (results.length > 0) {
      aiSearchResults.innerHTML = results.map(match => `
        <div class="search-result-item" data-event-id="${match.id}">
          <div style="font-size: 11px; color: #10b981; margin-bottom: 4px;">${match.comp}</div>
          <div style="font-weight: 700; color: white; margin-bottom: 4px;">${match.teams[0]} vs ${match.teams[1]}</div>
          <div style="font-size: 12px; color: #94a3b8;">${match.time} • ${match.sport}</div>
        </div>
      `).join('');

      aiSearchResults.classList.remove('hidden');

      // Add click handlers
      document.querySelectorAll('#aiSearchResults .search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const eventId = item.dataset.eventId;
          selectAIEvent(eventId);
        });
      });
    } else {
      aiSearchResults.innerHTML = '<div style="padding: 12px; color: #94a3b8; text-align: center;">No matches found</div>';
      aiSearchResults.classList.remove('hidden');
    }
  });

  // Close AI search results on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ai-search-section')) {
      aiSearchResults.classList.add('hidden');
    }
  });
}

// Select event for AI prediction
function selectAIEvent(eventId) {
  selectedEvent = MATCHES.find(m => m.id === eventId);

  console.log('Selected event:', selectedEvent); // DEBUG - check if teams array exists

  if (selectedEvent) {
    selectedEventDisplay.innerHTML = `
      <div class="event-info">
        <span class="event-league">${selectedEvent.comp}</span>
        <h3 class="event-match">${selectedEvent.teams[0]} vs ${selectedEvent.teams[1]}</h3>
        <span class="event-time">${selectedEvent.time}</span>
      </div>
    `;

    selectedEventDisplay.classList.remove('hidden');
    getPredictionBtn.classList.remove('hidden');
    aiSearchResults.classList.add('hidden');
    aiPredictionResults.classList.add('hidden');
    aiEventSearch.value = '';
  }
}

// Get AI prediction - FIXED VERSION
if (getPredictionBtn) {
  getPredictionBtn.addEventListener('click', () => {
    if (!selectedEvent) return;

    // Simulate API call with loading state
    getPredictionBtn.textContent = 'Analyzing...';
    getPredictionBtn.disabled = true;

    setTimeout(() => {
      // Calculate prediction data
      const homePercent = Math.floor(Math.random() * 40) + 45; // 45-85%
      const awayPercent = 100 - homePercent;
      const totalAnalysts = Math.floor(Math.random() * 1000) + 500;
      const homeAnalysts = Math.floor((homePercent / 100) * totalAnalysts);
      const awayAnalysts = totalAnalysts - homeAnalysts;

      // Get team names from MATCHES array structure
      const homeTeam = selectedEvent.teams[0];
      const awayTeam = selectedEvent.teams[1];

      // Update prediction display
      document.getElementById('totalBetsCount').textContent = `${totalAnalysts.toLocaleString()} signals analyzed`;

      document.getElementById('homeTeamName').textContent = homeTeam;
      document.getElementById('homePercent').textContent = `${homePercent}%`;
      document.getElementById('homeBar').style.width = `${homePercent}%`;
      document.getElementById('homeBetsCount').textContent = `${homeAnalysts.toLocaleString()} indicators favor home win`;

      document.getElementById('awayTeamName').textContent = awayTeam;
      document.getElementById('awayPercent').textContent = `${awayPercent}%`;
      document.getElementById('awayBar').style.width = `${awayPercent}%`;
      document.getElementById('awayBetsCount').textContent = `${awayAnalysts.toLocaleString()} indicators favor away win`;

      // AI recommendation
      const winner = homePercent > awayPercent ? homeTeam : awayTeam;
      const confidence = Math.max(homePercent, awayPercent);
      const winType = homePercent > awayPercent ? 'Home' : 'Away';

      document.getElementById('aiRecommendation').innerHTML = `
        <strong>My Analysis:</strong> ${winType} Win (${winner}) has ${confidence}% probability based on ${totalAnalysts.toLocaleString()} data signals
      `;

      // Show results with animation
      aiPredictionResults.classList.remove('hidden');
      getPredictionBtn.classList.add('hidden');

      toast('🤖 AI prediction generated!');

      // Reset button
      getPredictionBtn.textContent = 'Get AI Prediction';
      getPredictionBtn.disabled = false;
    }, 1200); // 1.2 second "thinking" delay
  });
}


// =========================
// Init (startup)
// =========================
renderTrending();
ensureSlipChrome();   // create wallet + mode UI
setTimeout(() => {
  renderCards();
  renderSlip();
}, 300);

// ========================================
// MODERN FLOATING BET SLIP
// ========================================

const betSlipCollapsed = document.getElementById('betSlipCollapsed');
const betSlipExpanded = document.getElementById('betSlipExpanded');
const closeExpanded = document.getElementById('closeExpanded');
const betItemsContainer = document.getElementById('betItemsContainer');
const stakeAmount = document.getElementById('stakeAmount');
const potentialWin = document.getElementById('potentialWin');
const placeBetBtn = document.getElementById('placeBetBtn');

// Toggle bet slip
betSlipCollapsed?.addEventListener('click', () => {
  betSlipCollapsed.style.display = 'none';
  betSlipExpanded?.classList.remove('hidden');
});

closeExpanded?.addEventListener('click', () => {
  betSlipExpanded?.classList.add('hidden');
  betSlipCollapsed.style.display = 'flex';
});

// Update collapsed state
function updateCollapsedBetSlip() {
  const count = document.querySelector('.slip-count');
  const odds = document.querySelector('.slip-odds');

  if (count) count.textContent = slip.length;

  // Calculate total odds
  const totalOdds = slip.reduce((acc, bet) => acc * bet.odd, 1);
  if (odds) odds.textContent = totalOdds.toFixed(2);

  // Show/hide collapsed state
  if (slip.length > 0) {
    betSlipCollapsed.style.display = 'flex';
  } else {
    betSlipCollapsed.style.display = 'none';
    betSlipExpanded?.classList.add('hidden');
  }
  autoSwitchBetTab(); // ← ADD THIS LINE

}

// Render bet items in expanded view
function renderBetItems() {
  if (!betItemsContainer) return;

  betItemsContainer.innerHTML = slip.map((bet, index) => `
    <div class="bet-item">
      <div class="bet-item-header">
        <div class="bet-item-info">
          <div class="bet-item-league">
            ${bet.isLive ? '<span class="live-dot"></span>' : ''}
            Match Result SO
          </div>
          <div class="bet-item-match">${bet.teams[0]} - ${bet.teams[1]}</div>
          <div class="bet-item-selection">${bet.market}</div>
        </div>
        <div class="bet-item-odd">${bet.odd.toFixed(2)}</div>
      </div>
      <button class="remove-bet-item" data-index="${index}">×</button>
    </div>
  `).join('');

  // Add remove handlers
  document.querySelectorAll('.remove-bet-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      slip.splice(index, 1);
      saveSlip();
      updateOddSelections();
      renderBetItems();
      updateCollapsedBetSlip();
      updatePotentialWin();
    });
  });

  updatePotentialWin();
}

// ============================================
// UPDATE POTENTIAL WIN WITH DYNAMIC RISK COLORS
// ============================================

function updatePotentialWin() {
  const stake = parseFloat(document.getElementById('stake')?.value) || 0;
  const totalOdds = slip.reduce((acc, bet) => acc * bet.odd, 1);
  const potential = stake * totalOdds;

  // Update potential winnings amount
  const potentialWinEl = document.getElementById('potentialWin');
  if (potentialWinEl) {
    potentialWinEl.textContent = potential.toFixed(2) + ' лв.';
  }

  // ✅ CALCULATE RISK LEVEL BASED ON MULTIPLIER
  const multiplier = stake > 0 ? potential / stake : 0;
  const riskRow = document.getElementById('potentialWinRow');

  if (riskRow && stake > 0) {
    // Remove all existing risk classes
    riskRow.classList.remove('risk-low', 'risk-medium', 'risk-high', 'risk-extreme');

    // Add appropriate risk class based on multiplier
    if (multiplier >= 100) {
      riskRow.classList.add('risk-extreme'); // 🔴 Red - Very high risk (100x+)
    } else if (multiplier >= 50) {
      riskRow.classList.add('risk-high'); // 🟠 Orange - High risk (50x-100x)
    } else if (multiplier >= 10) {
      riskRow.classList.add('risk-medium'); // 🟡 Yellow - Medium risk (10x-50x)
    } else if (multiplier >= 2) {
      riskRow.classList.add('risk-low'); // 🟢 Green - Low risk (2x-10x)
    } else {
      riskRow.classList.add('risk-low'); // 🟢 Default to green for very safe bets
    }
  } else if (riskRow) {
    // No stake entered - remove all risk classes
    riskRow.classList.remove('risk-low', 'risk-medium', 'risk-high', 'risk-extreme');
  }

  // Update header count
  const headerCount = document.querySelector('.header-count');
  if (headerCount) {
    headerCount.textContent = `${slip.length}/30`;
  }

  // Enable/disable place bet button
  const placeBetBtn = document.getElementById('place');
  if (placeBetBtn) {
    placeBetBtn.disabled = slip.length === 0 || stake <= 0;
  }
}

// Quick stake buttons
document.querySelectorAll('.quick-stake-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = btn.dataset.amount;
    if (amount === 'max') {
      stakeAmount.value = wallet.toFixed(2);
    } else {
      const current = parseFloat(stakeAmount.value) || 0;
      stakeAmount.value = (current + parseFloat(amount)).toFixed(2);
    }
    updatePotentialWin();
  });
});

// Stake input change
document.getElementById('stake')?.addEventListener('input', updatePotentialWin);

// Tab switching with validation
document.querySelectorAll('.bet-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const tabType = this.dataset.tab;

    if (tabType === 'single' && slip.length >= 2) {
      toast('Single bets require exactly 1 selection');
      return;
    }

    if (tabType === 'multiple' && slip.length < 2) {
      toast('Multiple bets require 2+ selections');
      return;
    }

    document.querySelectorAll('.bet-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// Auto-switch to Multiple tab when 2+ events
function autoSwitchBetTab() {
  const singleTab = document.querySelector('.bet-tab[data-tab="single"]');
  const multipleTab = document.querySelector('.bet-tab[data-tab="multiple"]');

  if (!singleTab || !multipleTab) return;

  if (slip.length >= 2) {
    document.querySelectorAll('.bet-tab').forEach(t => t.classList.remove('active'));
    multipleTab.classList.add('active');
  } else if (slip.length === 1) {
    document.querySelectorAll('.bet-tab').forEach(t => t.classList.remove('active'));
    singleTab.classList.add('active');
  }
}



// ========================================
// PROMOTIONAL CAROUSEL JAVASCRIPT
// Add this to your main JS file or create a separate carousel.js file
// ========================================

class PromoCarousel {
  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 5;
    this.isPlaying = true;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 5000; // 5 seconds

    this.init();
  }

  init() {
    // Get DOM elements
    this.carousel = document.getElementById('promoCarousel');
    this.slides = document.querySelectorAll('.promo-slide');
    this.prevBtn = document.getElementById('carouselPrev');
    this.nextBtn = document.getElementById('carouselNext');
    this.dots = document.querySelectorAll('.carousel-dot');
    this.progress = document.getElementById('carouselProgress');

    // Setup event listeners
    this.setupEventListeners();

    // Start autoplay
    this.startAutoPlay();

    // Update progress bar
    this.updateProgress();
  }

  setupEventListeners() {
    // Previous button
    this.prevBtn.addEventListener('click', () => {
      this.prevSlide();
      this.resetAutoPlay();
    });

    // Next button
    this.nextBtn.addEventListener('click', () => {
      this.nextSlide();
      this.resetAutoPlay();
    });

    // Dots navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.goToSlide(index);
        this.resetAutoPlay();
      });
    });

    // Pause on hover
    this.carousel.addEventListener('mouseenter', () => {
      this.pauseAutoPlay();
    });

    this.carousel.addEventListener('mouseleave', () => {
      this.resumeAutoPlay();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.prevSlide();
        this.resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        this.nextSlide();
        this.resetAutoPlay();
      }
    });

    // Touch/Swipe support for mobile
    this.setupTouchEvents();
  }

  setupTouchEvents() {
    let touchStartX = 0;
    let touchEndX = 0;

    this.carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    this.carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    });
  }

  handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        this.nextSlide();
      } else {
        // Swipe right - previous slide
        this.prevSlide();
      }
      this.resetAutoPlay();
    }
  }

  nextSlide() {
    this.goToSlide((this.currentSlide + 1) % this.totalSlides);
  }

  prevSlide() {
    this.goToSlide((this.currentSlide - 1 + this.totalSlides) % this.totalSlides);
  }

  goToSlide(index) {
    // Remove active class from current slide and dot
    this.slides[this.currentSlide].classList.remove('active');
    this.slides[this.currentSlide].classList.add('prev');
    this.dots[this.currentSlide].classList.remove('active');

    // Update current slide
    this.currentSlide = index;

    // Add active class to new slide and dot
    setTimeout(() => {
      this.slides.forEach(slide => slide.classList.remove('prev'));
      this.slides[this.currentSlide].classList.add('active');
    }, 50);

    this.dots[this.currentSlide].classList.add('active');

    // Update progress bar
    this.updateProgress();
  }

  updateProgress() {
    const progressPercent = ((this.currentSlide + 1) / this.totalSlides) * 100;
    this.progress.style.width = `${progressPercent}%`;
  }

  startAutoPlay() {
    if (this.isPlaying) {
      this.autoPlayInterval = setInterval(() => {
        this.nextSlide();
      }, this.autoPlayDelay);
    }
  }

  pauseAutoPlay() {
    this.isPlaying = false;
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resumeAutoPlay() {
    this.isPlaying = true;
    this.startAutoPlay();
  }

  resetAutoPlay() {
    this.pauseAutoPlay();
    this.resumeAutoPlay();
  }

  destroy() {
    // Clean up - stop autoplay and remove event listeners
    this.pauseAutoPlay();
  }
}


// ========================================
// ADDITIONAL HELPER FUNCTIONS
// ========================================

// Function to add custom slide (if you want to add slides dynamically)
function addCustomSlide(slideData) {
  const carousel = document.getElementById('promoCarousel');
  const dotsContainer = document.getElementById('carouselDots');

  if (!carousel || !dotsContainer) return;

  // Create new slide HTML
  const slideHTML = `
    <div class="promo-slide" data-slide="${slideData.index}">
      <div class="slide-bg-pattern"></div>
      <div class="slide-decoration slide-decoration-1"></div>
      <div class="slide-decoration slide-decoration-2"></div>
      
      <div class="slide-content">
        <div class="slide-badge">
          <i class="${slideData.badgeIcon}"></i>
          <span>${slideData.badgeText}</span>
        </div>
        <h2 class="slide-title">${slideData.title}</h2>
        <div class="slide-subtitle">${slideData.subtitle}</div>
        <p class="slide-description">${slideData.description}</p>
        <button class="slide-cta ${slideData.ctaClass}">
          ${slideData.ctaText}
          <i class="fas fa-bolt"></i>
        </button>
      </div>
      
      <div class="slide-icon-decoration">
        <i class="${slideData.iconDecoration}"></i>
      </div>
    </div>
  `;

  // Create new dot
  const dotHTML = `<button class="carousel-dot" data-slide="${slideData.index}"></button>`;

  // Insert before navigation elements
  const progressBar = carousel.querySelector('.carousel-progress-bg');
  carousel.insertBefore(createElementFromHTML(slideHTML), progressBar);
  dotsContainer.insertAdjacentHTML('beforeend', dotHTML);
}

// Helper function to create element from HTML string
function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

// Function to update carousel after adding/removing slides
function updateCarouselSlides() {
  if (window.promoCarousel) {
    window.promoCarousel.destroy();
    window.promoCarousel = new PromoCarousel();
  }
}


// ========================================
// CAROUSEL CONTROL FUNCTIONS
// ========================================

// Function to manually control carousel from outside
function carouselGoTo(slideIndex) {
  if (window.promoCarousel) {
    window.promoCarousel.goToSlide(slideIndex);
  }
}

function carouselNext() {
  if (window.promoCarousel) {
    window.promoCarousel.nextSlide();
  }
}

function carouselPrev() {
  if (window.promoCarousel) {
    window.promoCarousel.prevSlide();
  }
}

function carouselPause() {
  if (window.promoCarousel) {
    window.promoCarousel.pauseAutoPlay();
  }
}

function carouselResume() {
  if (window.promoCarousel) {
    window.promoCarousel.resumeAutoPlay();
  }
}

// ========================================
// VISIBILITY API - PAUSE WHEN TAB IS HIDDEN
// ========================================

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    carouselPause();
  } else {
    carouselResume();
  }
});

// ========================================
// ANALYTICS TRACKING (Optional)
// ========================================

// Track which slides users interact with most
function trackSlideView(slideIndex) {
  // Add your analytics code here
  // Example: Google Analytics
  // gtag('event', 'carousel_slide_view', {
  //   'slide_index': slideIndex
  // });

  console.log(`Slide ${slideIndex} viewed`);
}

// ==================== SPORTS NAVIGATION & MODAL ====================

document.addEventListener('DOMContentLoaded', () => {
  initializeDateFilter();
  setupDateFilters();
  setupSessionFilters();


  // ==================== SPORT NAVIGATION BAR ====================

  // Get all sport navigation items
  const sportNavItems = document.querySelectorAll('.sport-nav-item');

  // Handle sport selection from navigation bar
  sportNavItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all items
      sportNavItems.forEach(navItem => navItem.classList.remove('active'));

      // Add active class to clicked item
      item.classList.add('active');

      // Get selected sport
      const sport = item.getAttribute('data-sport');

      // Filter matches by sport
      filterMatchesBySport(sport);

      // Scroll to live matches section
      const liveEventsSection = document.querySelector('.live-events-section');
      if (liveEventsSection) {
        liveEventsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ==================== ALL SPORTS MODAL ====================

  // Show All Sports button
  const showAllBtn = document.getElementById('showAllSportsBtn');
  const allSportsModal = document.getElementById('allSportsModal');
  const closeAllSports = document.getElementById('closeAllSports');
  const allSportsOverlay = document.querySelector('.all-sports-overlay');

  // Open modal
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      allSportsModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal function
  function closeAllSportsModal() {
    allSportsModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  // Close button
  if (closeAllSports) {
    closeAllSports.addEventListener('click', closeAllSportsModal);
  }

  // Click outside to close
  if (allSportsOverlay) {
    allSportsOverlay.addEventListener('click', closeAllSportsModal);
  }

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && allSportsModal?.classList.contains('active')) {
      closeAllSportsModal();
    }
  });


  // ==================== DATE FILTER FUNCTIONALITY ====================

  // Generate dynamic dates for the next 7 days
  function initializeDateFilter() {
    const todayEl = document.getElementById('todayDate');
    if (!todayEl) return; // Exit if elements don't exist

    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Set Today
    document.getElementById('todayDate').textContent = `${months[today.getMonth()]} ${today.getDate()}`;

    // Set Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    document.getElementById('tomorrowDate').textContent = `${months[tomorrow.getMonth()]} ${tomorrow.getDate()}`;

    // Set next 5 days (day3 to day7)
    for (let i = 3; i <= 8; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + (i - 1));

      const dayLabel = days[futureDate.getDay()];
      const dateValue = `${months[futureDate.getMonth()]} ${futureDate.getDate()}`;

      document.getElementById(`day${i}Label`).textContent = dayLabel;
      document.getElementById(`day${i}Date`).textContent = dateValue;
    }
  }

  // ==================== SESSION FILTER (Day/Night) ====================

  function setupSessionFilters() {
    const sessionButtons = document.querySelectorAll('.session-filter-btn');

    sessionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from all
        sessionButtons.forEach(b => b.classList.remove('active'));

        // Add active to clicked
        btn.classList.add('active');

        // Get selected session
        const selectedSession = btn.getAttribute('data-session');
        const sessionLabel = btn.querySelector('.session-label').textContent;

        // ✅ FIX: If a sport is selected, update that sport's events
        if (currentSelectedSport) {
          const selectedDate = document.querySelector('.date-filter-btn.active')?.dataset.date || 'today';
          renderPrematchEventsBySport(currentSelectedSport, selectedDate, selectedSession);
        } else {
          // ✅ NEW: Go back to sports grid, don't show all events
          document.getElementById('prematchContainer').style.display = 'none';
          document.getElementById('allSportsGrid').style.display = 'grid';
        }

        toast(`Filtering: ${sessionLabel}`);
      });
    });
  }

  function filterEventsBySession(session) {
    const selectedDate = document.querySelector('.date-filter-btn.active')?.dataset.date || 'today';
    renderPrematchEvents(selectedDate, session);
    console.log(`Filtering: ${selectedDate} + ${session} session`);
  }



  // Handle date filter clicks
  function setupDateFilters() {
    const dateButtons = document.querySelectorAll('.date-filter-btn');

    dateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from all
        dateButtons.forEach(b => b.classList.remove('active'));

        // Add active to clicked
        btn.classList.add('active');

        // Get selected date
        const selectedDate = btn.getAttribute('data-date');
        const dateLabel = btn.querySelector('.date-label').textContent;

        // ✅ FIX: If a sport is selected, update that sport's events
        if (currentSelectedSport) {
          const selectedSession = document.querySelector('.session-filter-btn.active')?.dataset.session || 'all';
          renderPrematchEventsBySport(currentSelectedSport, selectedDate, selectedSession);
        } else {
          // ✅ NEW: Go back to sports grid, don't show all events
          document.getElementById('prematchContainer').style.display = 'none';
          document.getElementById('allSportsGrid').style.display = 'grid';
        }

        toast(`Date changed to ${dateLabel}`);
      });
    });
  }


  // ==================== MODAL SPORT SELECTION ====================

  // Handle sport selection from modal
  // Handle sport selection from modal
  const allSportCards = document.querySelectorAll('.all-sport-card');

  allSportCards.forEach(card => {
    card.addEventListener('click', () => {
      const sport = card.getAttribute('data-sport');

      // ✅ Store selected sport
      currentSelectedSport = sport;

      // Hide sports grid, show prematch container
      document.getElementById('allSportsGrid').style.display = 'none';
      document.getElementById('prematchContainer').style.display = 'block';

      // Get selected date and session
      const selectedDate = document.querySelector('.date-filter-btn.active')?.dataset.date || 'today';
      const selectedSession = document.querySelector('.session-filter-btn.active')?.dataset.session || 'all';

      // Filter and render prematch events for this sport
      renderPrematchEventsBySport(sport, selectedDate, selectedSession);

      toast(`Showing ${card.querySelector('.all-sport-name').textContent} events`);
    });
  });

  // ==================== SPORTS NAVIGATION & MODAL ====================
  // (your existing sports code)

  // Promotions Modal
  const promotionsBtn = document.getElementById('promotionsBtn');
  const promotionsModal = document.getElementById('promotionsModal');
  const closePromotions = document.getElementById('closePromotions');
  const promotionsOverlay = document.querySelector('.promotions-overlay');

  promotionsBtn.addEventListener('click', () => {
    promotionsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden'; // ADD THIS
    document.documentElement.style.overflow = 'hidden'; // ADD THIS
  });

  if (closePromotions) {
    closePromotions.addEventListener('click', () => {
      promotionsModal.classList.remove('active');
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'auto'; // ADD THIS
      document.documentElement.style.overflow = 'auto'; // ADD THIS
    });
  }

  if (promotionsOverlay) {
    promotionsOverlay.addEventListener('click', () => {
      promotionsModal.classList.remove('active');
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'auto'; // ADD THIS
      document.documentElement.style.overflow = 'auto'; // ADD THIS
    });
  }

  // Close with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && promotionsModal?.classList.contains('active')) {
      promotionsModal.classList.remove('active');
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'auto'; // ADD THIS
      document.documentElement.style.overflow = 'auto'; // ADD THIS
    }
  });
  // ==================== PROMO CLAIM BUTTONS ====================
  const promoClaimButtons = document.querySelectorAll('.promo-claim-btn');

  promoClaimButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();

      const card = button.closest('.promo-card');
      const promoTitle = card.querySelector('.promo-title').textContent;
      const promoAmount = card.querySelector('.promo-amount').textContent;

      showPromoToast(`${promoTitle} - ${promoAmount} claimed!`);
    });
  });

});

// Promo Toast Function
function showPromoToast(message) {
  let toast = document.querySelector('.promo-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'promo-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}


// ==================== NAVIGATION SYSTEM ====================

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav links
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.remove('active');
  });
}

// In Play - Live events only
document.querySelector('a[href="#inplay"]')?.addEventListener('click', (e) => {
  e.preventDefault();
  showSection('inplaySection');
  e.target.classList.add('active');
  showToast('Live Matches');
});

// All Sports Navigation - Goes to page (not modal)
document.querySelector('a[href="#all"]')?.addEventListener('click', (e) => {
  e.preventDefault();
  showSection('allSportsPage');
  e.target.classList.add('active');
  toast('All Sports');
});

// Show All button from home page
document.getElementById('showAllSportsBtn')?.addEventListener('click', () => {
  showSection('allSportsPage');
  toast('All Sports');
});


// Social - Social feed only
document.querySelector('a[href="#social"]')?.addEventListener('click', (e) => {
  e.preventDefault();
  showSection('socialSection');
  e.target.classList.add('active');
  if (typeof renderPosts === 'function') renderPosts();
  showToast('Social Feed');
});

// Comment Modal Functionality
const commentModal = document.getElementById('commentModal');
const closeCommentModal = document.getElementById('closeCommentModal');
const commentInput = document.getElementById('commentInput');
const postCommentBtn = document.getElementById('postCommentBtn');
const commentsList = document.getElementById('commentsList');

// Open comment modal when clicking comment button
document.addEventListener('click', (e) => {
  if (e.target.closest('.post-comment-btn-trigger')) {
    commentModal.classList.remove('hidden');
  }
});

// Close modal
closeCommentModal?.addEventListener('click', () => {
  commentModal.classList.add('hidden');
});

commentModal?.querySelector('.comment-modal-overlay')?.addEventListener('click', () => {
  commentModal.classList.add('hidden');
});

// Post comment
postCommentBtn?.addEventListener('click', () => {
  const text = commentInput.value.trim();
  if (!text) return;

  addComment(text);
  commentInput.value = '';
});

// Enter key to post
commentInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    postCommentBtn.click();
  }
});

function addComment(text) {
  const comment = document.createElement('div');
  comment.className = 'comment-item';
  comment.innerHTML = `
    <img src="user-avatar.jpg" alt="User" class="comment-avatar">
    <div class="comment-content">
      <div>
        <span class="comment-author">You</span>
        <span class="comment-time">Just now</span>
      </div>
      <p class="comment-text">${text}</p>
    </div>
  `;
  commentsList.prepend(comment);
}

// Casino
document.querySelector('a[href="#casino"]')?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Casino Coming Soon');
});

// Logo - Back to home
document.getElementById('navToggle')?.addEventListener('click', () => {
  showSection('homeSection');
  document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));

  // Close All Sports modal if open
  const modal = document.getElementById('allSportsModal');
  if (modal && modal.classList.contains('active')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});


// ==================== PROMOTIONAL CAROUSEL CTA ====================

// Track CTA button clicks
const ctaButtons = document.querySelectorAll('.slide-cta');

ctaButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    console.log(`CTA clicked on slide ${index}`);
    // Add your navigation logic here
    // Example: window.location.href = '/signup';
  });
});

// Preload slide images for performance
function preloadSlideImages() {
  const slides = document.querySelectorAll('.promo-slide');
  slides.forEach(slide => {
    const bgImage = window.getComputedStyle(slide).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const img = new Image();
      img.src = bgImage.slice(4, -1).replace(/"/g, '');
    }
  });
}

preloadSlideImages();

console.log('✅ Sports Navigation & Modal initialized successfully!');


// Check if carousel exists on page
const carouselElement = document.getElementById('promoCarousel');

if (carouselElement) {
  // Initialize the carousel
  const promoCarousel = new PromoCarousel();

  // Optional: Add smooth scroll to carousel when page loads
  setTimeout(() => {
    carouselElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 500);

  // Make carousel instance globally accessible if needed
  window.promoCarousel = promoCarousel;
}

// END DOMContentLoaded

// ==================== FILTER MATCHES BY SPORT ====================

function filterMatchesBySport(sport) {
  console.log('Filtering by sport:', sport);

  // ONLY filter PRE-MATCH sections, NOT live matches
  const preMatchSections = document.querySelectorAll('.pre-match-section .league-section');

  // Live matches section should NEVER be filtered
  const liveMatchesSection = document.querySelector('.live-events-section');
  if (liveMatchesSection) {
    liveMatchesSection.style.display = 'block'; // Always visible
  }

  if (preMatchSections.length === 0) {
    console.warn('⚠️ No pre-match sections found. Waiting for pre-match events to be added.');
    showToast('Pre-match events coming soon');
    return;
  }

  if (sport === 'all') {
    // Show all pre-match sections
    preMatchSections.forEach(section => {
      section.style.display = 'block';
    });
    showToast('Showing all pre-match events');
  } else {
    // Filter pre-match by specific sport
    let matchesFound = false;

    preMatchSections.forEach(section => {
      const sectionSport = section.getAttribute('data-sport');
      if (sectionSport === sport) {
        section.style.display = 'block';
        matchesFound = true;
      } else {
        section.style.display = 'none';
      }
    });

    // If no matches found, show message
    if (!matchesFound) {
      console.warn(`No pre-match events found for sport: ${sport}`);
      showToast('No pre-match events for this sport');
    } else {
      // Get sport name for toast
      const sportNameElement = document.querySelector(`[data-sport="${sport}"] .sport-name`);
      if (sportNameElement) {
        const sportName = sportNameElement.textContent;
        showToast(`Showing ${sportName} pre-match events`);
      }
    }
  }
}

// ==================== TOAST NOTIFICATION ====================

function showToast(message) {
  let toast = document.querySelector('.sport-filter-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'sport-filter-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// ==================== SMOOTH HORIZONTAL SCROLL ====================

const sportsScroll = document.querySelector('.sports-nav-scroll');
if (sportsScroll) {
  sportsScroll.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      sportsScroll.scrollLeft += e.deltaY;
    }
  });
}
// Click and drag to scroll
if (sportsScroll) {
  let isDown = false;
  let startX;
  let scrollLeft;

  sportsScroll.addEventListener('mousedown', (e) => {
    isDown = true;
    sportsScroll.style.cursor = 'grabbing';
    startX = e.pageX - sportsScroll.offsetLeft;
    scrollLeft = sportsScroll.scrollLeft;
  });

  sportsScroll.addEventListener('mouseleave', () => {
    isDown = false;
    sportsScroll.style.cursor = 'grab';
  });

  sportsScroll.addEventListener('mouseup', () => {
    isDown = false;
    sportsScroll.style.cursor = 'grab';
  });

  sportsScroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - sportsScroll.offsetLeft;
    const walk = (x - startX) * 3;
    sportsScroll.scrollLeft = scrollLeft - walk;
  });
}
// ==================== SOCIAL FEED ====================
// Social Feed JavaScript

// Sample posts data
const postsData = [

  {
    id: 1,
    author: "BetNextGen Official",
    username: "@betnextgen",
    avatar: "🏆",
    time: "2h ago",
    content: "🔥 BREAKING: Lakers complete massive trade deal! LeBron welcomes new superstar to LA. Championship odds now at 2.50. What's your take?",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    likes: 3247,
    comments: 142,
    shares: 892,
    isLiked: false,
    isBookmarked: false,
    trending: true
  },
  {
    id: 2,
    author: "Sports Analyst Pro",
    username: "@sportsanalyst",
    avatar: "📊",
    time: "4h ago",
    content: "⚽ Man City vs Arsenal - Match Preview\n\n✅ City: 14 wins in last 16\n❌ Arsenal: 3 losses in 5 away games\n\n💰 My prediction: City 2-1 | Odds: 3.50\n\nWho are you backing? 👇",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    likes: 1823,
    comments: 89,
    shares: 234,
    isLiked: false,
    isBookmarked: false,
    trending: false
  },
  {
    id: 3,
    author: "NBA Insider",
    username: "@nbainsider",
    avatar: "🏀",
    time: "6h ago",
    content: "🚨 POLL: Who wins the NBA Finals?\n\n🔵 Celtics (42%)\n🟡 Lakers (38%)\n🟢 Bucks (20%)\n\n🗳️ 15,439 votes | Ends in 2 hours\n\nCast your vote and win free bets!",
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80",
    likes: 5621,
    comments: 312,
    shares: 1205,
    isLiked: true,
    isBookmarked: true,
    trending: true
  },
  {
    id: 4,
    author: "Top Tipster King",
    username: "@bettipster",
    avatar: "👑",
    time: "8h ago",
    content: "🎯 My record this week:\n✅ 15 wins\n❌ 3 losses\n📈 83% accuracy\n🔥 Current streak: 8 consecutive wins\n\nDon't miss today's premium picks! Follow for daily winners 💰",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    likes: 2156,
    comments: 178,
    shares: 445,
    isLiked: false,
    isBookmarked: false,
    trending: false
  },
  {
    id: 5,
    author: "Football News",
    username: "@footballnews",
    avatar: "⚽",
    time: "10h ago",
    content: "🏆 Champions League Tonight!\n\n🔴 Liverpool vs Real Madrid\n🔵 Bayern vs PSG\n\nBoth games LIVE on BetNextGen!\n\nGet 100% deposit bonus + free live stream access 📺",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    likes: 4392,
    comments: 267,
    shares: 891,
    isLiked: false,
    isBookmarked: true,
    trending: true
  }
];

// Helper function to format numbers
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Create post HTML
function createPostHTML(post) {
  return `
    <div class="post-card" data-post-id="${post.id}">
      ${post.trending ? `
        <div class="trending-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          TRENDING
        </div>
      ` : ''}
      
      <div class="post-header">
        <div class="post-avatar">${post.avatar}</div>
        <div class="post-author-info">
          <div class="post-author-line">
            <span class="post-author-name">${post.author}</span>
            <span class="post-username">${post.username}</span>
            <span class="post-time">• ${post.time}</span>
          </div>
        </div>
      </div>

      <div class="post-content">${post.content}</div>

      ${post.image ? `
        <div class="post-image">
          <img src="${post.image}" alt="Post image" loading="lazy">
        </div>
      ` : ''}

      <div class="post-engagement">
        <button class="engagement-btn like-btn ${post.isLiked ? 'liked' : ''}" data-action="like">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.isLiked ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="like-count">${formatNumber(post.likes)}</span>
        </button>

       <button class="engagement-btn comment-btn post-comment-btn-trigger" data-action="comment">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
         </svg>
        ${post.comments}
       </button>

        <button class="engagement-btn share-btn" data-action="share">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 7 23 1 17 1"></polyline>
            <line x1="16" y1="8" x2="23" y2="1"></line>
            <polyline points="23 17 23 23 1 23 1 7 7 7"></polyline>
          </svg>
          ${post.shares}
        </button>

        <button class="bookmark-btn ${post.isBookmarked ? 'bookmarked' : ''}" data-action="bookmark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.isBookmarked ? '#ffd34d' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Share Modal Functionality
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const shareLinkInput = document.getElementById('shareLinkInput');
let currentSharePostId = null;

// Open share modal
document.addEventListener('click', (e) => {
  if (e.target.closest('.share-btn')) {
    const postCard = e.target.closest('.post-card');
    const postId = postCard.dataset.postId;
    const post = postsData.find(p => p.id === parseInt(postId));

    if (post) {
      currentSharePostId = postId;
      openShareModal(post);
    }
  }
});

function openShareModal(post) {
  // Generate share URL
  const shareUrl = `https://betnextgen.com/post/${post.id}`;
  shareLinkInput.value = shareUrl;

  // Show post preview
  document.getElementById('sharePostPreview').innerHTML = `
    <strong>${post.author}</strong>: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}
  `;

  shareModal.classList.remove('hidden');
}

// Close modal
closeShareModal?.addEventListener('click', () => {
  shareModal.classList.add('hidden');
});

shareModal?.querySelector('.share-modal-overlay')?.addEventListener('click', () => {
  shareModal.classList.add('hidden');
});

// Copy link
copyLinkBtn?.addEventListener('click', () => {
  shareLinkInput.select();
  document.execCommand('copy');

  copyLinkBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    Copied!
  `;

  setTimeout(() => {
    copyLinkBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy Link
    `;
  }, 2000);
});

// Handle social sharing
document.querySelectorAll('.share-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const platform = btn.dataset.share;
    const shareUrl = shareLinkInput.value;
    const post = postsData.find(p => p.id === parseInt(currentSharePostId));
    const text = `Check out this post on BetNextGen: ${post.content.substring(0, 100)}...`;

    let url;
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
    }

    window.open(url, '_blank', 'width=600,height=400');
  });
});

// Render all posts
function renderPosts() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = postsData.map(post => createPostHTML(post)).join('');
  attachEventListeners();
}

// Handle like button click
function handleLike(postId) {
  const post = postsData.find(p => p.id === postId);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes = post.isLiked ? post.likes + 1 : post.likes - 1;

    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    const likeBtn = postCard.querySelector('.like-btn');
    const likeCount = likeBtn.querySelector('.like-count');
    const likeSvg = likeBtn.querySelector('svg');

    if (post.isLiked) {
      likeBtn.classList.add('liked');
      likeSvg.setAttribute('fill', '#ef4444');
    } else {
      likeBtn.classList.remove('liked');
      likeSvg.setAttribute('fill', 'none');
    }

    likeCount.textContent = formatNumber(post.likes);
  }
}

// Handle bookmark button click
function handleBookmark(postId) {
  const post = postsData.find(p => p.id === postId);
  if (post) {
    post.isBookmarked = !post.isBookmarked;

    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    const bookmarkBtn = postCard.querySelector('.bookmark-btn');
    const bookmarkSvg = bookmarkBtn.querySelector('svg');

    if (post.isBookmarked) {
      bookmarkBtn.classList.add('bookmarked');
      bookmarkSvg.setAttribute('fill', '#ffd34d');
    } else {
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkSvg.setAttribute('fill', 'none');
    }
  }
}

// Attach event listeners to all buttons
function attachEventListeners() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.closest('.post-card').dataset.postId);
      handleLike(postId);
    });
  });

  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.closest('.post-card').dataset.postId);
      handleBookmark(postId);
    });
  });

  document.querySelectorAll('.comment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.closest('.post-card').dataset.postId);
      document.getElementById('commentModal').classList.remove('hidden');
    });
  });

}

// Load more posts
document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
  alert('Loading more posts...');
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderPosts();
});

// Casino Carousel
const casinoTrack = document.getElementById('casinoTrack');
const casinoPrev = document.getElementById('casinoPrev');
const casinoNext = document.getElementById('casinoNext');

if (casinoPrev && casinoNext && casinoTrack) {
  casinoPrev.addEventListener('click', () => {
    casinoTrack.scrollBy({ left: -300, behavior: 'smooth' });
  });

  casinoNext.addEventListener('click', () => {
    casinoTrack.scrollBy({ left: 300, behavior: 'smooth' });
  });
}

// Get prediction - CLEANER VERSION
if (getPredictionBtn) {
  getPredictionBtn.addEventListener('click', () => {
    if (!selectedEvent) return;

    // Simulate API call
    setTimeout(() => {
      // Calculate prediction data
      const homePercent = Math.floor(Math.random() * 40) + 45;
      const awayPercent = 100 - homePercent;
      const totalBets = Math.floor(Math.random() * 1000) + 500;
      const homeBets = Math.floor((homePercent / 100) * totalBets);
      const awayBets = totalBets - homeBets;

      // Update HTML elements (NO HTML CODE IN JS!)
      document.getElementById('totalBetsCount').textContent = `Based on ${totalBets.toLocaleString()} bets`;

      document.getElementById('homeTeamName').textContent = `${selectedEvent.home} (Home)`;
      document.getElementById('homePercent').textContent = `${homePercent}%`;
      document.getElementById('homeBar').style.width = `${homePercent}%`;
      document.getElementById('homeBetsCount').textContent = `${homeBets.toLocaleString()} customers predict home win`;

      document.getElementById('awayTeamName').textContent = `${selectedEvent.away} (Away)`;
      document.getElementById('awayPercent').textContent = `${awayPercent}%`;
      document.getElementById('awayBar').style.width = `${awayPercent}%`;
      document.getElementById('awayBetsCount').textContent = `${awayBets.toLocaleString()} customers predict away win`;

      const winner = homePercent > awayPercent ? selectedEvent.home : selectedEvent.away;
      document.getElementById('aiRecommendation').innerHTML = `
        <strong>AI Suggests:</strong> ${homePercent > awayPercent ? 'Home' : 'Away'} Win (${winner}) has higher probability based on customer predictions
      `;

      // Show results
      aiPredictionResults.classList.remove('hidden');
      getPredictionBtn.classList.add('hidden');

      toast('AI prediction generated!');
    }, 800);
  });
}

// Render My Bets - FIXED VERSION
function renderMyBets() {
  const live = userBets.filter(b => b.isLive && b.status === 'live');
  const unsettled = userBets.filter(b => b.status === 'unsettled' || (b.status === 'live' && !b.isLive));
  const settled = userBets.filter(b => b.status === 'settled' || b.status === 'cashed-out');

  // ✅ LIVE NOW TAB
  document.getElementById('live-content').innerHTML = live.length
    ? live.map(bet => {
      const actualIndex = userBets.indexOf(bet);
      return `
        <div class="bet-card live-bet-card">
          <div class="bet-header">
            <div class="bet-type">
              <span class="live-pulse">●</span> LIVE ${bet.type.toUpperCase()}
            </div>
            <button class="cancel-bet-btn" data-bet-index="${actualIndex}" title="Cancel Bet">×</button>
          </div>
          ${bet.selections.map(s => `
            <div class="bet-match">
              <div class="match-league">${s.league || 'Live Match'}</div>
              <div class="match-name">${s.match}</div>
              <div class="match-selection">${s.market} @ ${s.odds}</div>
            </div>
          `).join('')}
          <div class="bet-details">
            <span>Stake: ${bet.stake.toFixed(2)} лв</span>
            <span>Odds: ${bet.totalOdds.toFixed(2)}</span>
            <span class="potential-live">Potential: ${bet.potentialWin.toFixed(2)} лв</span>
          </div>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">No live bets</p>';

  // ✅ UNSETTLED TAB
  document.getElementById('unsettled-content').innerHTML = unsettled.length
    ? unsettled.map(bet => {
      const actualIndex = userBets.indexOf(bet);
      return `
        <div class="bet-card">
          <div class="bet-header">
            <div class="bet-type">${bet.type.toUpperCase()}</div>
            <button class="cancel-bet-btn" data-bet-index="${actualIndex}" title="Cancel Bet">×</button>
          </div>
          ${bet.selections.map(s => `<div class="bet-match">${s.match} - ${s.market} @ ${s.odds}</div>`).join('')}
          <div class="bet-details">
            <span>Stake: ${bet.stake.toFixed(2)} лв</span>
            <span>Odds: ${bet.totalOdds.toFixed(2)}</span>
            <span>Potential: ${bet.potentialWin.toFixed(2)} лв</span>
          </div>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">No unsettled bets</p>';

  // ✅ SETTLED TAB
  document.getElementById('settled-content').innerHTML = settled.length
    ? settled.map(bet => `
        <div class="bet-card">
          <div class="bet-type">${bet.type.toUpperCase()}</div>
          ${bet.selections.map(s => `<div class="bet-match">${s.match} - ${s.market} @ ${s.odds}</div>`).join('')}
          <div class="bet-details">
            <span>Stake: ${bet.stake.toFixed(2)} лв</span>
            <span>Result: ${bet.result || 'Pending'}</span>
          </div>
        </div>
      `).join('')
    : '<p class="empty-state">No settled bets</p>';

  attachCancelListeners();
}

// ============================================
// UPDATE MY BETS BADGE
// ============================================
function updateMyBetsBadge() {
  const badge = document.getElementById('myBetsBadge');
  if (!badge) return;

  // Get all bets from localStorage
  const myBets = JSON.parse(localStorage.getItem('userBets') || '[]');

  // Count active bets (live + unsettled)
  const activeBets = myBets.filter(bet =>
    bet.status === 'live' || bet.status === 'unsettled'
  );

  const count = activeBets.length;

  // Update badge
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  console.log(`📊 My Bets badge updated: ${count} active bets`);
}

// Handle cancel bet button clicks
// Handle cancel bet button clicks
function attachCancelListeners() {
  document.querySelectorAll('.cancel-bet-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const betIndex = parseInt(btn.dataset.betIndex);

      if (confirm('Are you sure you want to cancel this bet?')) {
        const canceledBet = userBets[betIndex];

        // ✅ FIX: Use setWallet() to properly sync all storage
        const currentBalance = getWallet();
        setWallet(currentBalance + canceledBet.stake);

        // Remove bet from array
        userBets.splice(betIndex, 1);
        localStorage.setItem('userBets', JSON.stringify(userBets));

        // Update UI
        renderMyBets();
        toast('Bet canceled and stake refunded!');
      }
    });
  });
}

// ✅ UPDATED - Bet Streak Counter with Stats & Milestones
function updateBetStreak() {
  const streak = JSON.parse(localStorage.getItem('betStreak')) || {
    wins: 0,
    total: 0,
    target: 10
  };

  const percentage = (streak.wins / streak.target) * 100;

  // Update streak count and bar
  const streakCount = document.querySelector('.streak-count');
  const streakBar = document.querySelector('.streak-bar');

  if (streakCount) streakCount.textContent = `${streak.wins}/${streak.target}`;
  if (streakBar) streakBar.style.width = `${percentage}%`;

  // Update next reward
  const nextReward = streak.target - streak.wins;
  const rewardText = document.querySelector('.reward-text');
  if (rewardText) {
    if (nextReward > 0) {
      rewardText.textContent = `${nextReward} more wins to unlock €25 Free Bet!`;
    } else {
      rewardText.textContent = `🎉 Reward unlocked! Claim your €25 Free Bet`;
    }
  }

  // ✅ NEW - Update stats and milestones
  updateStreakStats();
}

// ✅ NEW - Update streak statistics
function updateStreakStats() {
  const streak = JSON.parse(localStorage.getItem('betStreak')) || { wins: 0, total: 0 };
  const winRate = streak.total > 0 ? Math.round((streak.wins / streak.total) * 100) : 0;

  // Update stats display
  const totalWinsEl = document.getElementById('totalWins');
  const winRateEl = document.getElementById('winRate');

  if (totalWinsEl) totalWinsEl.textContent = streak.wins;
  if (winRateEl) winRateEl.textContent = `${winRate}%`;

  // Update milestones
  updateMilestones(streak.wins);
}

// ✅ NEW - Update milestone badges
function updateMilestones(wins) {
  const bronze = document.getElementById('bronzeMilestone');
  const silver = document.getElementById('silverMilestone');
  const gold = document.getElementById('goldMilestone');

  // Bronze (5 wins)
  if (bronze) {
    if (wins >= 5) {
      bronze.classList.remove('locked');
      bronze.classList.add('unlocked');
      bronze.querySelector('.milestone-badge').textContent = '✅';
    } else {
      bronze.classList.add('locked');
      bronze.classList.remove('unlocked');
      bronze.querySelector('.milestone-badge').textContent = '🔒';
    }
  }

  // Silver (10 wins)
  if (silver) {
    if (wins >= 10) {
      silver.classList.remove('locked');
      silver.classList.add('unlocked');
      silver.querySelector('.milestone-badge').textContent = '✅';
    } else {
      silver.classList.add('locked');
      silver.classList.remove('unlocked');
      silver.querySelector('.milestone-badge').textContent = '🔒';
    }
  }

  // Gold (20 wins)
  if (gold) {
    if (wins >= 20) {
      gold.classList.remove('locked');
      gold.classList.add('unlocked');
      gold.querySelector('.milestone-badge').textContent = '✅';

      // Extra celebration for gold
      if (wins === 20) {
        toast('🏆 GOLD STATUS ACHIEVED! You are a legend!');
      }
    } else {
      gold.classList.add('locked');
      gold.classList.remove('unlocked');
      gold.querySelector('.milestone-badge').textContent = '🔒';
    }
  }
}

// ✅ KEEP - Call when user places/wins bet
function recordBetResult(isWin) {
  const streak = JSON.parse(localStorage.getItem('betStreak')) || { wins: 0, total: 0, target: 10 };

  if (isWin) {
    streak.wins++;
    if (streak.wins >= streak.target) {
      toast('🎉 Streak complete! €25 Free Bet unlocked!');
      // Reset after reward
      streak.wins = 0;
    }

    // Show milestone notifications
    if (streak.wins === 5) {
      toast('🥉 Bronze Bettor unlocked!');
    } else if (streak.wins === 10) {
      toast('🥈 Silver Bettor unlocked!');
    }
  }
  streak.total++;

  localStorage.setItem('betStreak', JSON.stringify(streak));
  updateBetStreak();
}

document.addEventListener('DOMContentLoaded', updateBetStreak);

// Live Stats Dashboard - Auto-update
function updateLiveStats() {
  // Simulate real-time updates
  const onlineUsers = Math.floor(Math.random() * 5000) + 10000;
  const winnings = Math.floor(Math.random() * 100000) + 400000;
  const activeBets = Math.floor(Math.random() * 3000) + 7000;

  document.getElementById('onlineUsers').textContent = onlineUsers.toLocaleString();
  document.getElementById('todayWinnings').textContent = `€${winnings.toLocaleString()}`;
  document.getElementById('activeBets').textContent = activeBets.toLocaleString();

  // Animate numbers
  animateValue('onlineUsers', onlineUsers - 100, onlineUsers, 1000);
}

function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;

  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

// Update every 10 seconds
setInterval(updateLiveStats, 10000);
document.addEventListener('DOMContentLoaded', updateLiveStats);

// Recent Winners Feed
const recentWinners = [
  { name: 'John D.', amount: 2450, bet: 'Arsenal vs Chelsea - Home Win', initial: 'JD' },
  { name: 'Sarah M.', amount: 890, bet: 'Lakers ML - Full Time', initial: 'SM' },
  { name: 'Mike K.', amount: 5200, bet: '5-Leg Parlay - All Winners', initial: 'MK' },
  { name: 'Emma R.', amount: 1750, bet: 'Barcelona vs Real Madrid - Over 2.5', initial: 'ER' },
  { name: 'David L.', amount: 3100, bet: 'Tennis Combo - 3 Selections', initial: 'DL' },
  { name: 'Lisa P.', amount: 1920, bet: 'Nadal vs Djokovic - Nadal Win', initial: 'LP' },
  { name: 'Tom W.', amount: 8450, bet: '7-Fold Acca - Champions League', initial: 'TW' },
  { name: 'Anna K.', amount: 1340, bet: 'Bayern vs Dortmund - BTTS', initial: 'AK' }
];

// ============================================
// RECENT BIG WINS - HOMEPAGE RENDERING
// ============================================

let winnerIndex = 0;
const maxVisible = 4; // Show 4 cards

function renderRecentWinners() {
  const feed = document.getElementById('winnersFeed');
  if (!feed) return;

  // ✅ Show first 4 winners
  const visibleWinners = bigWinsData.slice(0, maxVisible);

  feed.innerHTML = visibleWinners.map(winner => `
    <div class="winner-card">
      <div class="winner-avatar">${winner.initial}</div>
      <div class="winner-info">
        <div class="winner-name">${winner.name}</div>
        <div class="winner-bet">${winner.bet}</div>
      </div>
      <div class="winner-amount">€${winner.amount.toLocaleString()}</div>
    </div>
  `).join('');

  winnerIndex = maxVisible;
  startWinnerRotation();
}

function startWinnerRotation() {
  setInterval(() => {
    const feed = document.getElementById('winnersFeed');
    if (!feed) return;

    const nextWinner = bigWinsData[winnerIndex % bigWinsData.length];
    const firstCard = feed.firstElementChild;

    if (firstCard) {
      // ✅ FIX: Fade out AND remove immediately
      firstCard.style.transition = 'all 0.4s ease';
      firstCard.style.opacity = '0';
      firstCard.style.transform = 'translateX(-20px)';

      setTimeout(() => {
        // Remove the old card
        firstCard.remove();

        // Add new card at the bottom with starting state
        const newCard = document.createElement('div');
        newCard.className = 'winner-card';
        newCard.style.opacity = '0';
        newCard.style.transform = 'translateX(20px)';
        newCard.innerHTML = `
          <div class="winner-avatar">${nextWinner.initial}</div>
          <div class="winner-info">
            <div class="winner-name">${nextWinner.name}</div>
            <div class="winner-bet">${nextWinner.bet}</div>
          </div>
          <div class="winner-amount">€${nextWinner.amount.toLocaleString()}</div>
        `;

        feed.appendChild(newCard);

        // ✅ FIX: Force reflow and animate in
        requestAnimationFrame(() => {
          newCard.style.transition = 'all 0.4s ease';
          newCard.style.opacity = '1';
          newCard.style.transform = 'translateX(0)';
        });
      }, 400); // Match transition time
    }

    winnerIndex++;
  }, 8000);
}

function addNewWinner(winner) {
  recentWinners.unshift(winner);
  if (recentWinners.length > 8) {
    recentWinners.pop();
  }
}

document.addEventListener('DOMContentLoaded', renderRecentWinners);

// ============================================
// LIVE MATCHES RENDERING SYSTEM
// ============================================

// Function to create a single live match card HTML
// ✅ UPDATE: Add match-id to cards
function createLiveMatchCard(match) {
  const isFootball = match.sport === 'football' || match.sport === 'ice-hockey' || match.sport === 'handball';
  const marketType = isFootball ? '3-way' : '2-way';

  let oddsHTML = '';
  if (isFootball) {
    oddsHTML = `
      <div class="odds-labels">
        <span>1</span>
        <span>X</span>
        <span>2</span>
      </div>
      <div class="odds-buttons" data-market="3-way">
  <button class="odds-btn odd-btn" data-match="${match.id}" data-outcome="1" data-odd="${match.odds['1']}">
    <span class="lbl">1</span>
    <span class="val">${match.odds['1']}</span>
  </button>
  <button class="odds-btn odd-btn" data-match="${match.id}" data-outcome="X" data-odd="${match.odds['X']}">
    <span class="lbl">X</span>
    <span class="val">${match.odds['X']}</span>
  </button>
  <button class="odds-btn odd-btn" data-match="${match.id}" data-outcome="2" data-odd="${match.odds['2']}">
    <span class="lbl">2</span>
    <span class="val">${match.odds['2']}</span>
  </button>
</div>    `;
  } else {
    oddsHTML = `
      <div class="odds-labels" style="grid-template-columns: repeat(2, 1fr);">
        <span>1</span>
        <span>2</span>
      </div>
      <div class="odds-buttons" data-market="2-way">
  <button class="odds-btn odd-btn" data-match="${match.id}" data-outcome="1" data-odd="${match.odds['1']}">
    <span class="lbl">1</span>
    <span class="val">${match.odds['1']}</span>
  </button>
  <button class="odds-btn odd-btn" data-match="${match.id}" data-outcome="2" data-odd="${match.odds['2']}">
    <span class="lbl">2</span>
    <span class="val">${match.odds['2']}</span>
  </button>
</div>
    `;
  }

  return `
    <div class="live-match-card" data-sport="${match.sport}" data-match-id="${match.id}">
      <div class="match-time-display">
        <div class="live-time">${match.time}</div>
        <div class="live-indicator">●</div>
      </div>

      <div class="teams-display">
        <div class="team-row">
          <span class="team-name">${match.teams[0]}</span>
          <span class="team-score">${match.score[0]}</span>
        </div>
        <div class="team-row">
          <span class="team-name">${match.teams[1]}</span>
          <span class="team-score">${match.score[1]}</span>
        </div>
      </div>

      <div class="betting-section">
        <div class="odds-container">
          <div class="odds-set active">
            ${oddsHTML}
          </div>
        </div>
      </div>

      <div class="match-actions">
        <button class="action-btn stats-btn" title="Statistics" onclick="openMatchPanel('${match.id}', 'stats')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor" />
          </svg>
        </button>
        <button class="action-btn tv-btn" title="Watch Live" onclick="openMatchPanel('${match.id}', 'stream')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none" />
            <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2" />
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>
    </div>
  `;
}
// Function to render live matches into a container
function renderLiveMatches(containerId, matchesToShow, limitPerSport = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} not found`);
    return;
  }

  // Group matches by LEAGUE (not just sport)
  const groupedByLeague = {};
  matchesToShow.forEach(match => {
    const leagueKey = match.league; // Use full league name as key

    if (!groupedByLeague[leagueKey]) {
      groupedByLeague[leagueKey] = {
        sport: match.sport,
        league: match.league,
        icon: match.leagueIcon,
        matches: []
      };
    }
    groupedByLeague[leagueKey].matches.push(match);
  });

  // Build HTML
  let html = '';
  Object.keys(groupedByLeague).forEach(leagueKey => {
    const leagueData = groupedByLeague[leagueKey];
    const matches = limitPerSport
      ? leagueData.matches.slice(0, limitPerSport)
      : leagueData.matches;

    html += `
      <div class="league-section" data-sport="${leagueData.sport}">
        <div class="league-header">
          <span class="league-icon">${leagueData.icon}</span>
          <span class="league-name">${leagueData.league}</span>
          <button class="favorite-btn">⭐</button>
        </div>
        <div class="league-matches">
          ${matches.map(match => createLiveMatchCard(match)).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  requestAnimationFrame(() => {
    container.querySelectorAll('.odds-buttons').forEach(oddsContainer => {
      const buttonCount = oddsContainer.querySelectorAll('.odds-btn').length;

      if (buttonCount === 2) {
        oddsContainer.classList.add('two-way');

        const labels = oddsContainer.previousElementSibling;
        if (labels?.classList.contains('odds-labels')) {
          labels.classList.add('two-way');
        }
      }
    });
  });


  // Update count
  const countEl = document.getElementById(containerId === 'homeLiveContainer' ? 'homeLiveCount' : 'inplayLiveCount');
  if (countEl) {
    countEl.textContent = `${matchesToShow.length} Live Matches`;
  }
}


// Initialize live matches when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Render home page (show first match of each sport)
  renderLiveMatches('homeLiveContainer', LIVE_MATCHES_DATA, 1);

  // Render in-play page (show FOOTBALL by default since we removed "All Sports")
  const footballMatches = LIVE_MATCHES_DATA.filter(m => m.sport === 'football');
  renderLiveMatches('inplayLiveContainer', footballMatches);

  startMatchTimers();

});

// Sport filter functionality
document.addEventListener('click', (e) => {
  const sportTab = e.target.closest('.live-sport-tab');
  if (!sportTab) return;

  const selectedSport = sportTab.dataset.sport;

  // Update active tab
  document.querySelectorAll('.live-sport-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  sportTab.classList.add('active');

  // Filter matches (removed "all" option)
  const filtered = LIVE_MATCHES_DATA.filter(m => m.sport === selectedSport);

  // Re-render in-play page
  renderLiveMatches('inplayLiveContainer', filtered);

  toast(`Showing ${sportTab.querySelector('.tab-label').textContent}`);
});

// ============================================
// PREMATCH EVENTS RENDERING
// ============================================

function createPrematchCard(match) {
  const isFootball = match.sport === 'football' || match.sport === 'ice-hockey';

  let oddsHTML = '';
  if (isFootball) {
    oddsHTML = `
      <div class="odds-labels">
        <span>1</span>
        <span>X</span>
        <span>2</span>
      </div>
      <div class="odds-buttons">
        <button class="odd-btn" data-match="${match.id}" data-outcome="1" data-odd="${match.odds['1']}">${match.odds['1']}</button>
        <button class="odd-btn" data-match="${match.id}" data-outcome="X" data-odd="${match.odds['X']}">${match.odds['X']}</button>
        <button class="odd-btn" data-match="${match.id}" data-outcome="2" data-odd="${match.odds['2']}">${match.odds['2']}</button>
      </div>
    `;
  } else {
    oddsHTML = `
      <div class="odds-labels two-way">
        <span>1</span>
        <span>2</span>
      </div>
      <div class="odds-buttons two-way">
        <button class="odd-btn" data-match="${match.id}" data-outcome="1" data-odd="${match.odds['1']}">${match.odds['1']}</button>
        <button class="odd-btn" data-match="${match.id}" data-outcome="2" data-odd="${match.odds['2']}">${match.odds['2']}</button>
      </div>
    `;
  }

  return `
    <div class="live-match-card prematch-card" data-sport="${match.sport}" data-date="${match.date}" data-session="${match.sessionType}">
      <div class="match-time-display">
        <div class="prematch-time">${match.time}</div>
      </div>

      <div class="teams-display">
        <div class="team-row">
          <span class="team-name">${match.teams[0]}</span>
        </div>
        <div class="team-row">
          <span class="team-name">${match.teams[1]}</span>
        </div>
      </div>

      <div class="betting-section">
        <div class="odds-container">
          ${oddsHTML}
        </div>
      </div>
    </div>
  `;
}

function renderPrematchEvents(selectedDate = 'today', selectedSession = 'all') {
  const container = document.getElementById('prematchContainer');
  if (!container) return;

  // Filter by date and session
  let filtered = PREMATCH_EVENTS.filter(m => m.date === selectedDate);

  if (selectedSession !== 'all') {
    filtered = filtered.filter(m => m.sessionType === selectedSession);
  }

  // Group by league
  const groupedByLeague = {};
  filtered.forEach(match => {
    if (!groupedByLeague[match.league]) {
      groupedByLeague[match.league] = {
        sport: match.sport,
        league: match.league,
        matches: []
      };
    }
    groupedByLeague[match.league].matches.push(match);
  });

  // Build HTML
  let html = '';
  Object.values(groupedByLeague).forEach(leagueData => {
    html += `
      <div class="league-section pre-match-section" data-sport="${leagueData.sport}">
        <div class="league-header">
          <span class="league-name">${leagueData.league}</span>
        </div>
        <div class="league-matches">
          ${leagueData.matches.map(match => createPrematchCard(match)).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html || '<p style="text-align:center;color:#94a3b8;padding:40px;">No matches for this time</p>';
}

function renderPrematchEventsBySport(sport, selectedDate, selectedSession) {
  // Filter by sport first
  let filtered = PREMATCH_EVENTS.filter(m => m.sport === sport);

  // Then by date
  filtered = filtered.filter(m => m.date === selectedDate);

  // Then by session
  if (selectedSession !== 'all') {
    filtered = filtered.filter(m => m.sessionType === selectedSession);
  }

  const container = document.getElementById('prematchContainer');
  if (!container) return;

  // Group by league
  const groupedByLeague = {};
  filtered.forEach(match => {
    if (!groupedByLeague[match.league]) {
      groupedByLeague[match.league] = {
        sport: match.sport,
        league: match.league,
        matches: []
      };
    }
    groupedByLeague[match.league].matches.push(match);
  });

  // Build HTML with back button
  let html = `
    <button id="backToSportsBtn" class="back-to-sports-btn" style="margin-bottom: 20px; padding: 10px 20px; background: #10b981; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
      ← Back to All Sports
    </button>
  `;

  Object.values(groupedByLeague).forEach(leagueData => {
    html += `
      <div class="league-section pre-match-section" data-sport="${leagueData.sport}">
        <div class="league-header">
          <span class="league-name">${leagueData.league}</span>
        </div>
        <div class="league-matches">
          ${leagueData.matches.map(match => createPrematchCard(match)).join('')}
        </div>
      </div>
    `;
  });

  if (Object.keys(groupedByLeague).length === 0) {
    html += '<p style="text-align:center;color:#94a3b8;padding:40px;">No matches for this time</p>';
  }

  container.innerHTML = html;

  // Add back button handler
  document.getElementById('backToSportsBtn')?.addEventListener('click', () => {
    // ✅ Clear selected sport
    currentSelectedSport = null;

    document.getElementById('prematchContainer').style.display = 'none';
    document.getElementById('allSportsGrid').style.display = 'grid';
  });

  // Fix 2-way odds styling
  requestAnimationFrame(() => {
    container.querySelectorAll('.odds-buttons').forEach(oddsContainer => {
      const buttonCount = oddsContainer.querySelectorAll('.odd-btn').length;
      if (buttonCount === 2) {
        oddsContainer.classList.add('two-way');
        const labels = oddsContainer.previousElementSibling;
        if (labels?.classList.contains('odds-labels')) {
          labels.classList.add('two-way');
        }
      }
    });
  });
}
// ============================================
// RIGHT SIDE PANEL
// ============================================

function openMatchPanel(matchId, tab = 'stats') {
  const match = LIVE_MATCHES_DATA.find(m => m.id === matchId);
  if (!match) return;

  // Populate info
  document.getElementById('panelLeague').textContent = match.league;
  document.getElementById('panelTeam1').textContent = match.teams[0];
  document.getElementById('panelTeam2').textContent = match.teams[1];
  document.getElementById('panelScore1').textContent = match.score[0];
  document.getElementById('panelScore2').textContent = match.score[1];

  const panelTimeEl = document.getElementById('panelTime');
  if (panelTimeEl) {
    panelTimeEl.dataset.matchId = matchId;
    panelTimeEl.textContent = match.time + ' ● LIVE';
  }

  // Generate stats
  const statsHTML = generateMatchStats(match);
  document.getElementById('panelStats').innerHTML = statsHTML;

  // Show panel
  document.getElementById('panelBackdrop').style.display = 'block';
  const panel = document.getElementById('matchDetailsPanel');
  panel.style.display = 'flex';
  setTimeout(() => panel.classList.add('open'), 10);

  switchPanelTab(tab);
}

function closeMatchPanel() {
  const panel = document.getElementById('matchDetailsPanel');
  panel.classList.remove('open');
  document.getElementById('panelBackdrop').style.display = 'none';
  setTimeout(() => panel.style.display = 'none', 300);
}

function switchPanelTab(tab) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('active'));

  if (tab === 'stats') {
    document.querySelectorAll('.panel-tab')[0].classList.add('active');
    document.getElementById('panelStatsView').classList.add('active');
  } else {
    document.querySelectorAll('.panel-tab')[1].classList.add('active');
    document.getElementById('panelStreamView').classList.add('active');
  }
}

function generateMatchStats(match) {
  const stats = {
    'Possession': [52, 48],
    'Shots': [12, 8],
    'Shots on Target': [5, 3],
    'Corners': [6, 4],
    'Fouls': [8, 11],
    'Yellow Cards': [2, 3]
  };

  let html = '';
  Object.keys(stats).forEach(label => {
    const [home, away] = stats[label];
    const total = home + away;
    const homePercent = (home / total) * 100;

    html += `
      <div class="stat-row">
        <div class="stat-value">${home}</div>
        <div class="stat-center">
          <div class="stat-label">${label}</div>
          <div class="stat-bar">
            <div class="stat-bar-fill" style="width: ${homePercent}%"></div>
          </div>
        </div>
        <div class="stat-value">${away}</div>
      </div>
    `;
  });

  return html;
}

// ============================================
// ADVANCED NOTIFICATIONS SYSTEM
// ============================================

function createNotificationContainer() {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  return container;
}

function showWinNotification(amount, profit) {
  const container = createNotificationContainer();

  const notification = document.createElement('div');
  notification.className = 'notification win';

  const isBigWin = profit >= 100; // Big win if profit is 100+ лв

  notification.innerHTML = `
    <button class="notification-close">×</button>
    <div class="notification-header">
      <div class="notification-icon">${isBigWin ? '🎉' : '✅'}</div>
      <div class="notification-title">${isBigWin ? 'BIG WIN!' : 'You Won!'}</div>
    </div>
    <div class="notification-body">
      <div class="notification-amount">+${amount.toFixed(2)} лв</div>
      <div>Profit: <strong style="color: #10b981;">+${profit.toFixed(2)} лв</strong></div>
    </div>
  `;

  container.appendChild(notification);

  // Big win confetti
  if (isBigWin) {
    createConfetti();
  }

  // Close button
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

function showLossNotification(amount, loss) {
  const container = createNotificationContainer();

  const notification = document.createElement('div');
  notification.className = 'notification loss';

  notification.innerHTML = `
    <button class="notification-close">×</button>
    <div class="notification-header">
      <div class="notification-icon">😞</div>
      <div class="notification-title">Bet Lost</div>
    </div>
    <div class="notification-body">
      <div class="notification-amount">-${amount.toFixed(2)} лв</div>
      <div>Better luck next time!</div>
    </div>
  `;

  container.appendChild(notification);

  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  });

  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

function createConfetti() {
  const colors = ['#ffd34d', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3000);
    }, i * 30);
  }
}

// ============================================
// FORCE UI UPDATE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Force update bet slip UI after validation
  setTimeout(() => {
    updateBetSlipUI();
    updateBetSlipTrigger();
    updateMyBetsBadge();
    console.log('✅ Bet slip UI force updated on load');
  }, 100);
});