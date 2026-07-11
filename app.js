import { carModels } from './config/carModels.js';
import { fetchPasswordsWithRetry } from './utils/api.js';
import { 
    renderVersionButtons, 
    renderPasswordGroup,
    updateCarInstructions, 
    updateCountdown,
    updatePasswordsFromApi
} from './utils/ui.js';

let currentCarModel = 'traveler';
let currentVersion = '0407';

async function updatePasswords() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('updateTime').textContent = 
        `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;
    
    const serialNumber = document.getElementById('serialNumber')?.value || '';
    
    const result = await fetchPasswordsWithRetry(currentCarModel, currentVersion, serialNumber);
    
    if (result !== null) {
        updatePasswordsFromApi(result, currentCarModel, currentVersion);
    }
}

document.getElementById('carModel').addEventListener('change', function() {
    currentCarModel = this.value;
    const carModel = carModels[currentCarModel];
    currentVersion = carModel.versions[0];
    
    renderVersionButtons(currentCarModel, currentVersion);
    renderPasswordGroup(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
});

document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('usagePopup');
    const closePopup = document.getElementById('closePopup');
    
    if (popup) {
        popup.style.display = 'flex';
    }
    
    if (closePopup) {
        closePopup.addEventListener('click', function() {
            if (popup) {
                popup.style.display = 'none';
            }
        });
    }
    
    renderVersionButtons(currentCarModel, currentVersion);
    renderPasswordGroup(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
    
    document.querySelector('.version-buttons').addEventListener('click', function(e) {
        if (e.target.classList.contains('version-button')) {
            document.querySelectorAll('.version-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentVersion = e.target.dataset.version;
            renderPasswordGroup(currentCarModel, currentVersion);
            updateCarInstructions(currentCarModel, currentVersion);
            updatePasswords();
        }
    });
});

setInterval(() => {
    updateCountdown(currentCarModel, currentVersion);
}, 1000);

setInterval(updatePasswords, 60000);