import { extractReceiptData } from './ai-service.js';
import { supabase } from './supabase.js';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewImg = document.getElementById('preview-img');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const loadingOverlay = document.getElementById('loading-overlay');
const scanLine = document.getElementById('scan-line');
const statusBadge = document.getElementById('status-badge');
const submitBtn = document.getElementById('submit-btn');
const successMsg = document.getElementById('success-msg');
const form = document.getElementById('receipt-form');

// Form inputs
const merchantInput = document.getElementById('merchant');
const dateInput = document.getElementById('date');
const totalInput = document.getElementById('total');
const currencyInput = document.getElementById('currency');

// Modal elements
const receiptsModal = document.getElementById('receipts-modal');
const viewAllBtn = document.getElementById('view-all-btn');
const closeModalBtn = document.getElementById('close-modal');
const receiptsTableBody = document.getElementById('receipts-table-body');

// Handled by HTML <label for="file-input"> automatically

// Handle drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    handleFile(file);
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

async function handleFile(file) {
  console.log("File selected:", file.name, file.type, file.size);
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);

  // UI state for processing
  loadingOverlay.style.display = 'flex';
  scanLine.style.display = 'block';
  statusBadge.textContent = 'Processing...';
  statusBadge.className = 'status-badge processing';
  submitBtn.disabled = true;
  successMsg.style.display = 'none';

  try {
    const data = await extractReceiptData(file);

    // Fill form
    merchantInput.value = data.merchant || '';
    dateInput.value = data.date || '';
    totalInput.value = data.total || '';
    currencyInput.value = data.currency || '';

    // Update UI state
    statusBadge.textContent = 'Review Ready';
    statusBadge.className = 'status-badge complete';
    submitBtn.disabled = false;
  } catch (error) {
    console.error("Extraction error details:", error);
    alert('Failed to extract data: ' + error.message);
    statusBadge.textContent = 'Failed';
    statusBadge.className = 'status-badge';
    submitBtn.disabled = false; // Allow manual entry
  } finally {
    loadingOverlay.style.display = 'none';
    scanLine.style.display = 'none';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect data
  const submission = {
    merchant: merchantInput.value,
    date: dateInput.value,
    total: totalInput.value,
    currency: currencyInput.value
  };

  // Save to Supabase
  try {
    if (!supabase) {
      throw new Error("Database connection not configured. Check your .env file.");
    }

    const { data, error } = await supabase
      .from('receipts')
      .insert([submission]);

    if (error) throw error;

    console.log('Submission saved to Supabase:', data);

    // Show success
    successMsg.style.display = 'block';
    submitBtn.disabled = true;

    setTimeout(() => {
      successMsg.style.display = 'none';
      // resetApp();
    }, 3000);
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    alert('Failed to save to database: ' + error.message);
  }
});

function resetApp() {
  previewImg.style.display = 'none';
  uploadPlaceholder.style.display = 'block';
  form.reset();
  statusBadge.textContent = 'Waiting';
  statusBadge.className = 'status-badge';
  submitBtn.disabled = true;
}

// --- View All Receipts Logic ---

viewAllBtn.addEventListener('click', async () => {
  receiptsModal.classList.add('active');
  await fetchReceipts();
});

closeModalBtn.addEventListener('click', () => {
  receiptsModal.classList.remove('active');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === receiptsModal) {
    receiptsModal.classList.remove('active');
  }
});

async function fetchReceipts() {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized. Check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.");
    }

    receiptsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading receipts...</td></tr>';

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database error: ${error.message} (${error.code})`);
    }

    renderTable(data);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    receiptsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">
      ${error.message}<br>
      <small>Check browser console for more details.</small>
    </td></tr>`;
  }
}

function renderTable(receipts) {
  if (receipts.length === 0) {
    receiptsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No receipts found.</td></tr>';
    return;
  }

  receiptsTableBody.innerHTML = receipts.map(receipt => `
    <tr>
      <td>${receipt.date}</td>
      <td>${receipt.merchant}</td>
      <td>${receipt.total}</td>
      <td>${receipt.currency}</td>
      <td>
        <div class="action-btns">
          <button class="icon-btn edit-btn" data-id="${receipt.id}" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="icon-btn download-btn download" data-id="${receipt.id}" title="Download Excel">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="icon-btn delete-btn delete" data-id="${receipt.id}" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Add event listeners to action buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editReceipt(btn.dataset.id, receipts));
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteReceipt(btn.dataset.id));
  });

  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => downloadSingleReceipt(btn.dataset.id, receipts));
  });
}

async function editReceipt(id, receipts) {
  const receipt = receipts.find(r => r.id == id);
  if (!receipt) return;

  const { value: formValues } = await Swal.fire({
    title: 'Edit Receipt',
    background: 'rgba(30, 41, 59, 0.95)',
    color: '#f8fafc',
    customClass: {
      popup: 'premium-swal-popup'
    },
    html: `
      <style>
        .premium-swal-popup {
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
        }
        .swal-form-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 1rem;
          width: 100%;
        }
        .swal-form-group label {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 0.4rem;
          font-weight: 500;
        }
        .swal-custom-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #f8fafc;
          font-size: 1rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .swal-custom-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
      </style>
      <div class="swal-form-group">
        <label>Merchant</label>
        <input id="swal-merchant" class="swal-custom-input" value="${receipt.merchant}" placeholder="Merchant">
      </div>
      <div class="swal-form-group">
        <label>Date</label>
        <input id="swal-date" type="date" class="swal-custom-input" value="${receipt.date}">
      </div>
      <div class="swal-form-group">
        <label>Total Amount</label>
        <input id="swal-total" type="number" step="0.01" class="swal-custom-input" value="${receipt.total}" placeholder="0.00">
      </div>
      <div class="swal-form-group" style="margin-bottom: 0;">
        <label>Currency</label>
        <input id="swal-currency" class="swal-custom-input" value="${receipt.currency}" placeholder="USD">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Save Changes',
    confirmButtonColor: '#6366f1',
    cancelButtonColor: 'rgba(255, 255, 255, 0.1)',
    preConfirm: () => {
      return {
        merchant: document.getElementById('swal-merchant').value,
        date: document.getElementById('swal-date').value,
        total: document.getElementById('swal-total').value,
        currency: document.getElementById('swal-currency').value
      }
    }
  });

  if (formValues) {
    try {
      const { error } = await supabase
        .from('receipts')
        .update(formValues)
        .eq('id', id);

      if (error) throw error;

      Swal.fire('Updated!', 'Receipt has been updated.', 'success');
      await fetchReceipts();
    } catch (error) {
      console.error('Error updating receipt:', error);
      Swal.fire('Error', 'Failed to update receipt.', 'error');
    }
  }
}

async function deleteReceipt(id) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f43f5e',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Yes, delete it!',
    background: '#1e293b',
    color: '#f8fafc'
  });

  if (result.isConfirmed) {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Swal.fire('Deleted!', 'Receipt has been deleted.', 'success');
      await fetchReceipts();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      Swal.fire('Error', 'Failed to delete receipt.', 'error');
    }
  }
}

function downloadSingleReceipt(id, receipts) {
  const receipt = receipts.find(r => r.id == id);
  if (!receipt) return;

  const data = [
    {
      'Merchant': receipt.merchant,
      'Date': receipt.date,
      'Total': receipt.total,
      'Currency': receipt.currency
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Receipt");
  
  XLSX.writeFile(wb, `Receipt_${receipt.merchant}_${receipt.date}.xlsx`);
}
