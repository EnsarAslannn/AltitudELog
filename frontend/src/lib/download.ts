export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Deferred, not revoked inline: Firefox and Safari start reading the blob asynchronously after
  // click(), so revoking in the same tick can abort the download before it begins.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
