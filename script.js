// Konfigurasi Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyU6fBN36dWiwvIEHkQAkaDpJjdqRomuECR3pTJt661MbGqF_9s8SDowJ5GS4s_8cOYhg/exec'; 

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupFormValidation();
    loadLocalStorageData();
});

// Inisialisasi form
function initializeForm() {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Setup validasi real-time
function setupFormValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Ambil data form - HANYA 5 KOLOM
    const formData = {
        timestamp: new Date().toLocaleString('id-ID'),
        nama: document.getElementById('nama').value.trim(),
        program: document.getElementById('program').value,
        nik: document.getElementById('nik').value.trim(),
        alamat: document.getElementById('alamat').value.trim(),
        whatsapp: formatPhoneNumber(document.getElementById('whatsapp').value.trim())
        // TIDAK ADA KOLOM KELAS TAMBAHAN
    };
    
    // Kirim data
    await submitFormData(formData);
}

// Validasi form
function validateForm() {
    let isValid = true;
    const fields = [
        { id: 'nama', validator: validateName },
        { id: 'program', validator: validateProgram },
        { id: 'nik', validator: validateNIK },
        { id: 'alamat', validator: validateAddress },
        { id: 'whatsapp', validator: validateWhatsApp }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!field.validator(element.value.trim())) {
            showFieldError(element, getErrorMessage(field.id));
            isValid = false;
        }
    });
    
    return isValid;
}

// Fungsi validasi individual
function validateName(name) {
    return name.length >= 3 && name.length <= 50;
}

function validateProgram(program) {
    return program !== '';
}

function validateNIK(nik) {
    return /^\d{16}$/.test(nik);
}

function validateAddress(address) {
    return address.length >= 10 && address.length <= 200;
}

function validateWhatsApp(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 14;
}

// Format nomor telepon
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.substring(1);
    }
    return cleaned;
}

// Tampilkan error field
function showFieldError(element, message) {
    element.style.borderColor = '#ef4444';
    element.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
    
    // Hapus pesan error sebelumnya
    let errorDiv = element.parentNode.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        element.parentNode.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.9rem';
    errorDiv.style.marginTop = '5px';
}

// Hapus error field
function clearFieldError(e) {
    const element = e.target;
    element.style.borderColor = '#e5e7eb';
    element.style.boxShadow = 'none';
    
    const errorDiv = element.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Validasi individual field
function validateField(e) {
    const element = e.target;
    const value = element.value.trim();
    let isValid = true;
    
    switch (element.id) {
        case 'nama':
            isValid = validateName(value);
            break;
        case 'nik':
            isValid = validateNIK(value);
            break;
        case 'alamat':
            isValid = validateAddress(value);
            break;
        case 'whatsapp':
            isValid = validateWhatsApp(value);
            break;
        case 'program':
            isValid = value !== '';
            break;
    }
    
    if (!isValid && value !== '') {
        showFieldError(element, getErrorMessage(element.id));
    } else {
        clearFieldError({ target: element });
    }
}

// Pesan error berdasarkan field
function getErrorMessage(fieldId) {
    const messages = {
        'nama': 'Nama harus 3-50 karakter',
        'program': 'Pilih program kursus',
        'nik': 'NIK harus 16 digit angka',
        'alamat': 'Alamat harus 10-200 karakter',
        'whatsapp': 'Nomor WhatsApp tidak valid'
    };
    return messages[fieldId] || 'Input tidak valid';
}

// Kirim data ke Google Sheets
async function submitFormData(formData) {
    showMessage('Mengirim data...', 'info');
    
    try {
        // Kirim ke Google Sheets
        const response = await sendToGoogleSheets(formData);
        
        if (response.success) {
            // Simpan ke localStorage
            saveToLocalStorage(formData);
            
            // Reset form
            document.getElementById('registrationForm').reset();
            
            // Tampilkan pesan sukses
            showMessage('✅ Pendaftaran berhasil! Data telah disimpan.', 'success');
            
            // Log untuk debugging
            console.log('Data terkirim:', formData);
            
        } else {
            throw new Error(response.error || 'Gagal mengirim data');
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        // Simpan ke localStorage sebagai backup
        saveToLocalStorage(formData);
        
        showMessage('⚠️ Data disimpan secara lokal. Silakan coba lagi nanti.', 'info');
    }
}

// Kirim ke Google Sheets
async function sendToGoogleSheets(data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
    });
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    });
    
    // Karena no-cors, kita anggap berhasil
    return { success: true, message: 'Data terkirim' };
}

// Simpan ke localStorage
function saveToLocalStorage(data) {
    try {
        const storageKey = 'tiktaktop_registrations';
        let savedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        savedData.push({
            ...data,
            id: Date.now(),
            status: 'local'
        });
        
        // Simpan maksimal 100 data
        if (savedData.length > 100) {
            savedData = savedData.slice(-100);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(savedData));
        
    } catch (error) {
        console.error('Gagal menyimpan ke localStorage:', error);
    }
}

// Load data dari localStorage
function loadLocalStorageData() {
    try {
        const storageKey = 'tiktaktop_registrations';
        const savedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        if (savedData.length > 0) {
            console.log(`${savedData.length} data tersimpan di localStorage`);
        }
        
    } catch (error) {
        console.error('Gagal membaca localStorage:', error);
    }
}

// Tampilkan pesan
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto hide setelah 5 detik (kecuali success)
    if (type !== 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}