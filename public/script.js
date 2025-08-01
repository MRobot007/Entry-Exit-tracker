// Global variables
let people = [];
let entries = [];
let currentUser = null;
let qrScanner = null;
let scannedData = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadData();
    initializeEventListeners();
});

// Authentication
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('dashboardPage').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    updateStats();
    renderPeople();
    renderActivity();
}

// Event Listeners
function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // QR Scanner
    document.getElementById('startScanBtn').addEventListener('click', openQRScanner);
    document.getElementById('closeQrModal').addEventListener('click', closeQRScanner);
    
    // Manual entry
    document.getElementById('manualEntryBtn').addEventListener('click', () => handleManualEntry('entry'));
    document.getElementById('manualExitBtn').addEventListener('click', () => handleManualEntry('exit'));
    
    // People management
    document.getElementById('addPersonBtn').addEventListener('click', openAddPersonModal);
    document.getElementById('closeAddPersonModal').addEventListener('click', closeAddPersonModal);
    document.getElementById('addPersonForm').addEventListener('submit', handleAddPerson);
    document.getElementById('cancelAddPersonBtn').addEventListener('click', closeAddPersonModal);
    
    // Entry/Exit modal
    document.getElementById('selectEntryBtn').addEventListener('click', () => handleEntryExit('entry'));
    document.getElementById('selectExitBtn').addEventListener('click', () => handleEntryExit('exit'));
    document.getElementById('cancelEntryExitBtn').addEventListener('click', closeEntryExitModal);
}

// Login handling
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.textContent = 'Signing in...';
    
    // Simulate login delay
    setTimeout(() => {
        if (username && password) {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', username);
            currentUser = username;
            showToast('Login successful!', 'success');
            showDashboard();
        } else {
            showToast('Please enter username and password', 'error');
        }
        
        // Reset button state
        loginBtn.disabled = false;
        loginBtnText.textContent = 'Sign In';
    }, 1000);
}

function handleLogout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    currentUser = null;
    showToast('Logged out successfully', 'success');
    showLogin();
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Data management
function loadData() {
    people = JSON.parse(localStorage.getItem('people') || '[]');
    entries = JSON.parse(localStorage.getItem('entries') || '[]');
}

function saveData() {
    localStorage.setItem('people', JSON.stringify(people));
    localStorage.setItem('entries', JSON.stringify(entries));
}

// QR Scanner
async function openQRScanner() {
    const modal = document.getElementById('qrModal');
    const video = document.getElementById('qrVideo');
    const status = document.getElementById('scannerStatus');
    
    modal.classList.add('active');
    
    try {
        const QrScanner = window.QrScanner;
        qrScanner = new QrScanner(video, result => {
            handleQRScanSuccess(result);
        }, {
            onDecodeError: err => {
                console.log('QR decode error:', err);
            }
        });
        
        await qrScanner.start();
        status.textContent = 'Position QR code in camera view';
    } catch (error) {
        console.error('Error starting QR scanner:', error);
        status.textContent = 'Error accessing camera. Please check permissions.';
        showToast('Camera access denied or not available', 'error');
    }
}

function closeQRScanner() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('active');
    
    if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
        qrScanner = null;
    }
}

function handleQRScanSuccess(result) {
    closeQRScanner();
    
    try {
        scannedData = JSON.parse(result.data);
        
        // Show entry/exit selection modal
        const modal = document.getElementById('entryExitModal');
        const personInfo = document.getElementById('scannedPersonInfo');
        
        personInfo.innerHTML = `
            <h4>${scannedData.name}</h4>
            <p>ID: ${scannedData.id || 'Not specified'}</p>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        showToast('Invalid QR code format', 'error');
    }
}

function handleEntryExit(type) {
    if (scannedData) {
        addEntry(type, scannedData.name, scannedData.id);
        closeEntryExitModal();
        scannedData = null;
    }
}

function closeEntryExitModal() {
    const modal = document.getElementById('entryExitModal');
    modal.classList.remove('active');
}

// Manual entry
function handleManualEntry(type) {
    const name = document.getElementById('manualName').value.trim();
    const id = document.getElementById('manualId').value.trim();
    
    if (!name) {
        showToast('Please enter a name', 'error');
        return;
    }
    
    addEntry(type, name, id);
    
    // Clear form
    document.getElementById('manualName').value = '';
    document.getElementById('manualId').value = '';
}

// Entry management
function addEntry(type, name, id = '') {
    const entry = {
        id: generateId(),
        type: type,
        name: name,
        personId: id,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
    };
    
    entries.unshift(entry);
    saveData();
    updateStats();
    renderActivity();
    
    showToast(`${type === 'entry' ? 'Entry' : 'Exit'} recorded for ${name}`, 'success');
}

// People management
function openAddPersonModal() {
    const modal = document.getElementById('addPersonModal');
    modal.classList.add('active');
}

function closeAddPersonModal() {
    const modal = document.getElementById('addPersonModal');
    modal.classList.remove('active');
    
    // Clear form
    document.getElementById('newPersonName').value = '';
    document.getElementById('newPersonId').value = '';
}

async function handleAddPerson(e) {
    e.preventDefault();
    
    const name = document.getElementById('newPersonName').value.trim();
    const id = document.getElementById('newPersonId').value.trim();
    
    if (!name) {
        showToast('Please enter a name', 'error');
        return;
    }
    
    try {
        // Generate QR code
        const qrData = JSON.stringify({ name, id });
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        const person = {
            id: generateId(),
            name: name,
            enrollmentId: id,
            qrCode: qrCodeDataURL,
            createdAt: new Date().toISOString()
        };
        
        people.push(person);
        saveData();
        renderPeople();
        closeAddPersonModal();
        
        showToast(`${name} added successfully`, 'success');
    } catch (error) {
        console.error('Error generating QR code:', error);
        showToast('Error generating QR code', 'error');
    }
}

function deletePerson(personId) {
    if (confirm('Are you sure you want to delete this person?')) {
        people = people.filter(p => p.id !== personId);
        saveData();
        renderPeople();
        showToast('Person deleted successfully', 'success');
    }
}

function downloadQRCode(person) {
    const link = document.createElement('a');
    link.download = `${person.name}_QR.png`;
    link.href = person.qrCode;
    link.click();
}

// Rendering functions
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(e => e.date === today);
    
    const totalEntries = todayEntries.filter(e => e.type === 'entry').length;
    const totalExits = todayEntries.filter(e => e.type === 'exit').length;
    const netCount = totalEntries - totalExits;
    
    document.getElementById('netCount').textContent = netCount;
    document.getElementById('totalEntries').textContent = totalEntries;
    document.getElementById('totalExits').textContent = totalExits;
}

function renderPeople() {
    const container = document.getElementById('peopleList');
    
    if (people.length === 0) {
        container.innerHTML = '<p>No people registered yet.</p>';
        return;
    }
    
    container.innerHTML = people.map(person => `
        <div class="person-item">
            <div class="person-info">
                <h4>${person.name}</h4>
                <p>${person.enrollmentId ? `ID: ${person.enrollmentId}` : 'No ID specified'}</p>
                <p>Added: ${new Date(person.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="person-actions">
                <button onclick="downloadQRCode(${JSON.stringify(person).replace(/"/g, '&quot;')})" class="secondary-btn">
                    Download QR
                </button>
                <button onclick="deletePerson('${person.id}')" class="exit-btn">
                    Delete
                </button>
            </div>
        </div>
        <div class="qr-code">
            <img src="${person.qrCode}" alt="QR Code for ${person.name}" style="max-width: 150px; border-radius: 0.5rem;">
        </div>
    `).join('');
}

function renderActivity() {
    const container = document.getElementById('activityList');
    
    if (entries.length === 0) {
        container.innerHTML = '<p>No activity recorded yet.</p>';
        return;
    }
    
    const recentEntries = entries.slice(0, 10); // Show last 10 entries
    
    container.innerHTML = recentEntries.map(entry => `
        <div class="activity-item">
            <div class="activity-info">
                <h4>${entry.name}</h4>
                <p>${entry.personId ? `ID: ${entry.personId}` : 'No ID'}</p>
                <p>${new Date(entry.timestamp).toLocaleString()}</p>
            </div>
            <span class="activity-type ${entry.type}">${entry.type.toUpperCase()}</span>
        </div>
    `).join('');
}

// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions globally available for onclick handlers
window.deletePerson = deletePerson;
window.downloadQRCode = downloadQRCode;