// App Data
let transactions = JSON.parse(localStorage.getItem('familyFlowData')) || [];
let chartInstance = null;
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Helper function to grab HTML elements quickly
const el = id => document.getElementById(id);

// 1. Core Render Function (Refreshes the entire screen)
function updateUI() {
    el('transactionList').innerHTML = '';
    let totalInc = 0, totalExp = 0, breakdown = {};

    // --- Filter Logic ---
    const members = [...new Set(transactions.map(t => t.member))];
    const activeView = members.includes(el('viewFilter').value) ? el('viewFilter').value : 'all';
    
    // Update Dropdown Options
    el('viewFilter').innerHTML = '<option value="all">All Family</option>' + 
        members.map(m => `<option value="${m}" ${m === activeView ? 'selected' : ''}>${m}</option>`).join('');

    // Update Top Titles
    el('breakdownTitle').innerText = activeView === 'all' ? 'Member Breakdown' : 'Category Breakdown';
    el('balanceTitle').innerText = activeView === 'all' ? 'Household Balance' : `${activeView}'s Balance`;
    el('incomeTitle').innerText = activeView === 'all' ? 'Total Income' : `${activeView}'s Income`;
    el('expenseTitle').innerText = activeView === 'all' ? 'Total Expenses' : `${activeView}'s Expenses`;

    // Filter Data by selected person
    const filtered = activeView === 'all' ? transactions : transactions.filter(t => t.member === activeView);

    // --- Render List & Calculate Totals ---
    filtered.forEach(t => {
        const isInc = t.type === 'income';
        isInc ? (totalInc += t.amount) : (totalExp += t.amount);

        // Track spending categories for pie chart
        if (!isInc) {
            const key = activeView === 'all' ? t.member : t.category.slice(2).trim();
            breakdown[key] = (breakdown[key] || 0) + t.amount;
        }

        // Add HTML item to list
        const icon = isInc ? '+' : '-';
        const colorClass = isInc ? 'income' : 'expense';
        
        el('transactionList').insertAdjacentHTML('beforeend', `
            <li class="transaction-item">
                <div class="t-left">
                    <div class="t-emoji">${t.category.slice(0, 2)}</div>
                    <div class="t-details">
                        <h4>${t.title}</h4>
                        <p>${t.member} • ${t.category.slice(2).trim()}</p>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <div class="t-amount ${colorClass}">${icon}₹${t.amount.toFixed(2)}</div>
                    <button class="btn-delete" onclick="deleteItem(${t.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </li>
        `);
    });

    // Update Top Stat Numbers
    el('totalBalance').innerText = `₹${(totalInc - totalExp).toFixed(2)}`;
    el('totalIncome').innerText = `₹${totalInc.toFixed(2)}`;
    el('totalExpense').innerText = `₹${totalExp.toFixed(2)}`;

    // Update Savings Insight
    let savingsPct = 0;
    if (totalInc > 0) savingsPct = ((totalInc - totalExp) / totalInc) * 100;
    if (el('savingsPercent')) {
        el('savingsPercent').innerText = totalInc === 0 ? '0%' : `${savingsPct.toFixed(1)}%`;
        el('savingsPercent').style.color = savingsPct >= 0 && totalInc > 0 ? 'var(--success)' : (totalInc === 0 ? 'var(--text-muted)' : 'var(--danger)');
    }

    // Update Pie Chart & Save data to Browser
    drawChart(breakdown);
    localStorage.setItem('familyFlowData', JSON.stringify(transactions));
}

// 2. Add New Form Submission
el('transactionForm').onsubmit = (e) => {
    e.preventDefault();
    let title = el('titleInput').value.trim();
    let amount = parseFloat(el('amountInput').value);
    let member = el('memberInput').value.trim();

    if (!title || !amount || !member) return;

    // Add new data to the top of our array
    transactions.unshift({
        id: Date.now(),
        title, amount,
        type: el('typeInput').value,
        category: el('categoryInput').value,
        member: member[0].toUpperCase() + member.slice(1).toLowerCase()
    });

    el('transactionForm').reset();
    updateUI();
};

// 3. Delete Feature
window.deleteItem = (id) => {
    transactions = transactions.filter(t => t.id !== id);
    updateUI();
};

// 4. Draw Pie Chart & Breakdown List
function drawChart(data) {
    const labels = Object.keys(data).sort((a, b) => data[b] - data[a]);
    
    // 4A. Draw Small List below chart
    el('memberBreakdownList').innerHTML = labels.length === 0 ? '<li class="empty-state">No data</li>' :
        labels.map((lbl, i) => `
            <li class="member-item">
                <div class="member-name">
                    <span class="member-color-dot" style="background-color: ${colors[i % colors.length]}"></span>
                    ${lbl}
                </div>
                <span class="t-amount expense">-₹${data[lbl].toFixed(2)}</span>
            </li>
        `).join('');

    // 4B. Draw Chart.js Circle
    if (chartInstance) chartInstance.destroy(); // Clear old chart
    chartInstance = new Chart(el('memberChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Empty'],
            datasets: [{
                data: labels.length ? labels.map(l => data[l]) : [1],
                backgroundColor: labels.length ? colors : ['#ccc']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
    });
}
webkitSpeechRecognition

// 5. Dark Mode Toggle
el('themeToggle').onclick = () => {
    let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        el('themeToggle').innerText = '🌙 Switch to Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        el('themeToggle').innerText = '☀️ Switch to Light Mode';
    }
    setTimeout(updateUI, 10); // Refresh UI for chart colors
};

// --- Tab Switching Logic ---
window.switchTab = (tabId) => {
    // Remove active class from all buttons and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to target
    event.currentTarget.classList.add('active');
    el('tab-' + tabId).classList.add('active');
};
window.editItem = (id) => {
   const item = transactions.find(t => t.id === id);

   el('titleInput').value = item.title;
   el('amountInput').value = item.amount;
};

// 6. Fetch Tip of the Day from Public API
fetch('https://api.adviceslip.com/advice')
    .then(res => res.json())
    .then(data => el('tipText').innerHTML = `💡 Tip: ${data.slip.advice}`)
    .catch(() => el('tipText').innerHTML = `💡 Tip: Track your expenses!`);

// --- Start the App ---
el('viewFilter').onchange = updateUI;
updateUI(); // Initial render

/* ================= MONEYMUNCHKIN CHATBOT ================= */

// Open & Close Chat
const chatToggle = document.getElementById("chatToggle");
const chatWindow = document.getElementById("chatWindow");
const closeChat = document.getElementById("closeChat");

chatToggle.onclick = () => {
    chatWindow.style.display = "flex";
};

closeChat.onclick = () => {
    chatWindow.style.display = "none";
};

// Send Message
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

sendBtn.onclick = sendMessage;
chatInput.addEventListener("keypress", function(e){
    if(e.key === "Enter"){
        sendMessage();
    }
});

function sendMessage(){

    let message = chatInput.value.trim();

    if(message === "") return;

    addMessage(message, "user-message");

    let botReply = getBotReply(message.toLowerCase());

    setTimeout(() => {
        addMessage(botReply, "bot-message");
    }, 500);

    chatInput.value = "";
}

// Add Messages
function addMessage(text, className){

    const div = document.createElement("div");

    div.className = className;
    div.innerHTML = text;

    chatBody.appendChild(div);

    chatBody.scrollTop = chatBody.scrollHeight;
}

// Bot Logic
function getBotReply(msg){

    // Example calculations
    let totalIncome = 50000;
    let totalExpense = 32000;
    let balance = totalIncome - totalExpense;

    // Balance
    if(msg.includes("balance")){
        return `💰 Your current balance is ₹${balance}`;
    }

    // Income
    else if(msg.includes("income")){
        return `📈 Your total income is ₹${totalIncome}`;
    }

    // Expense
    else if(msg.includes("expense") || msg.includes("spent")){
        return `💸 Your total expenses are ₹${totalExpense}`;
    }

    // Savings
    else if(msg.includes("saving")){
        return `🏦 You saved ₹${balance} this month. Great job!`;
    }

    // Budget
    else if(msg.includes("budget")){
        return `📊 You have used ${(totalExpense/totalIncome*100).toFixed(1)}% of your budget.`;
    }

    // Food
    else if(msg.includes("food")){
        return `🍔 Food is currently your highest spending category.`;
    }

    // Tips
    else if(msg.includes("tip") || msg.includes("advice")){
        const tips = [
            "💡 Track daily expenses regularly.",
            "💡 Avoid unnecessary subscriptions.",
            "💡 Save at least 20% of your income.",
            "💡 Plan monthly budgets in advance."
        ];

        return tips[Math.floor(Math.random() * tips.length)];
    }

    // Greeting
    else if(msg.includes("hello") || msg.includes("hi")){
        return `👋 Hello! How can I help you today?`;
    }

    // Default Reply
    else{
        return `🤖 Sorry, I didn't understand that.<br>
        Try asking about balance, expenses, savings or budget.`;
    }
}