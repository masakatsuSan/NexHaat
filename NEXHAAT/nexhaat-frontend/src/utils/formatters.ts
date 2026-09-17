export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getQualityBadgeVariant(quality: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (quality) {
    case 'Grade-A':
      return 'success';
    case 'Grade-B':
      return 'warning';
    case 'Grade-C':
      return 'danger';
    default:
      return 'info';
  }
}

export function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'LISTED':
    case 'OPEN':
      return 'success';
    case 'SOLD':
    case 'CLOSED':
      return 'danger';
    default:
      return 'info';
  }
}