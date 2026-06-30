function calculateDays() {
  const fromDate = document.getElementById('from_date').value;
  const toDate = document.getElementById('to_date').value;
  const daysField = document.getElementById('days');

  if (!fromDate || !toDate) {
    daysField.value = '';
    return;
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diff = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
  if (diff > 0) {
    daysField.value = diff;
  } else {
    daysField.value = 0;
  }
}

function confirmAction(formId, actionLabel) {
  const answer = confirm(`Are you sure you want to ${actionLabel} this leave request?`);
  if (answer) {
    document.getElementById(formId).submit();
  }
}

function submitBulkAction() {
  const selected = Array.from(document.querySelectorAll('.request-checkbox:checked'));
  if (selected.length === 0) {
    alert('Please select at least one request.');
    return false;
  }
  return confirm('Are you sure you want to apply this bulk action?');
}

function confirmSingleAction(requestId, action) {
  const message = action === 'approve'
    ? 'Are you sure you want to approve this leave request?'
    : 'Are you sure you want to reject this leave request?';
  if (!confirm(message)) return;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `/admin/requests/${requestId}/action`;

  const actionInput = document.createElement('input');
  actionInput.type = 'hidden';
  actionInput.name = 'action';
  actionInput.value = action;

  const notesInput = document.createElement('input');
  notesInput.type = 'hidden';
  notesInput.name = 'admin_notes';
  notesInput.value = action === 'approve' ? 'Approved by admin' : 'Rejected by admin';

  form.appendChild(actionInput);
  form.appendChild(notesInput);
  document.body.appendChild(form);
  form.submit();
}
