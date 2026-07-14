import { carModels } from './config/carModels.js';
import { fetchPasswordsWithRetry } from './utils/api.js';
import {
    renderVersionButtons,
    renderPasswordGroup,
    updateCarInstructions,
    updateCountdown,
    updatePasswordsFromApi
} from './utils/ui.js';
import {
    timezones,
    setTimezone,
    getDefaultTimezoneIndex,
    getStoredTimezoneIndex,
    formatTimezoneLabel,
    getSelectedLocalTime,
    currentTimezoneOffset
} from './config/timezones.js';

let currentCarModel = 'traveler';
let currentVersion = '0407';

async function updatePasswords() {
    const localTime = getSelectedLocalTime(currentTimezoneOffset);
    const month = String(localTime.getMonth() + 1).padStart(2, '0');
    const date = String(localTime.getDate()).padStart(2, '0');
    const hours = String(localTime.getHours()).padStart(2, '0');
    const minutes = String(localTime.getMinutes()).padStart(2, '0');
    const tzLabel = formatTimezoneLabel(currentTimezoneOffset);

    document.getElementById('updateTime').textContent =
        `${localTime.getFullYear()}-${month}-${date} ${hours}:${minutes} ${tzLabel}`;

    const serialNumber = document.getElementById('serialNumber')?.value || '';

    const result = await fetchPasswordsWithRetry(currentCarModel, currentVersion, serialNumber);

    if (result !== null) {
        updatePasswordsFromApi(result, currentCarModel, currentVersion);
    }
}

function initTimezoneSelector() {
    const select = document.getElementById('timezone');
    if (!select) return;

    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.offset;
        option.textContent = tz.label;
        select.appendChild(option);
    });

    const storedIdx = getStoredTimezoneIndex();
    const idx = storedIdx !== -1 ? storedIdx : getDefaultTimezoneIndex();
    const offset = timezones[idx].offset;
    select.value = String(offset);
    setTimezone(offset);

    select.addEventListener('change', function() {
        const newOffset = parseInt(this.value, 10);
        setTimezone(newOffset);
        updatePasswords();
    });
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

    initTimezoneSelector();
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