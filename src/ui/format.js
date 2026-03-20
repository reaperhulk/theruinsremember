// Shared number formatting for the UI
// Handles numbers up to 10^33+ with short suffixes

export function formatNumber(n) {
  if (!isFinite(n)) return 'Infinity';
  if (n < 0) return '-' + formatNumber(-n);
  if (n >= 1e63) return n.toExponential(1);             // beyond vigintillion, use scientific
  if (n >= 1e60) return (n / 1e60).toFixed(1) + 'Vg';  // vigintillion
  if (n >= 1e57) return (n / 1e57).toFixed(1) + 'Od';  // octodecillion
  if (n >= 1e54) return (n / 1e54).toFixed(1) + 'Sd';  // septendecillion
  if (n >= 1e51) return (n / 1e51).toFixed(1) + 'Sxd'; // sexdecillion
  if (n >= 1e48) return (n / 1e48).toFixed(1) + 'Qid'; // quindecillion
  if (n >= 1e45) return (n / 1e45).toFixed(1) + 'Qad'; // quattuordecillion
  if (n >= 1e42) return (n / 1e42).toFixed(1) + 'Td';  // tredecillion
  if (n >= 1e39) return (n / 1e39).toFixed(1) + 'Dd';  // duodecillion
  if (n >= 1e36) return (n / 1e36).toFixed(1) + 'Ud';  // undecillion
  if (n >= 1e33) return (n / 1e33).toFixed(1) + 'D';   // decillion
  if (n >= 1e30) return (n / 1e30).toFixed(1) + 'N';   // nonillion
  if (n >= 1e27) return (n / 1e27).toFixed(1) + 'O';   // octillion
  if (n >= 1e24) return (n / 1e24).toFixed(1) + 'Sp';  // septillion
  if (n >= 1e21) return (n / 1e21).toFixed(1) + 'Sx';  // sextillion
  if (n >= 1e18) return (n / 1e18).toFixed(1) + 'Qi';  // quintillion
  if (n >= 1e15) return (n / 1e15).toFixed(1) + 'Qa';  // quadrillion
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

export function formatTime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
