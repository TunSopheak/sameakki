/** Saves a file the browser has built, as if it had been downloaded. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the address is released
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
