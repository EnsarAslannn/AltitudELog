import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Otomatik METAR, uçuş kaydından sonra arka planda alınır.',
        sources: [{ title: 'Operasyon yetenekleri', url: '/#yetenekler' }],
        suggestions: ['METAR bilgisini nerede görebilirim?'],
        usedAi: false,
      }),
    })
  })

  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForLoadState('networkidle')
})

test('answers a question, restores the conversation and manages dialog focus', async ({ page }, testInfo) => {
  const launcher = page.getByRole('button', { name: 'AltitudELog asistanını aç' })
  await launcher.click()

  const dialog = page.getByRole('dialog', { name: 'AltitudELog asistanı' })
  await expect(dialog).toBeVisible()
  await expect(page.getByLabel('Mesajınız')).toBeFocused()

  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  if (testInfo.project.name === 'mobile') {
    expect(box!.x).toBeGreaterThan(0)
    expect(box!.width).toBeLessThan(390)
    expect(box!.height).toBeLessThanOrEqual(540)
  } else {
    expect(box!.width).toBeLessThanOrEqual(350)
    expect(box!.height).toBeLessThanOrEqual(500)
    expect(box!.x).toBeGreaterThan(900)
  }

  await page.getByLabel('Mesajınız').fill('METAR nasıl çalışır?')
  await page.getByRole('button', { name: 'Gönder' }).click()
  await expect(page.getByText(/Otomatik METAR, uçuş kaydından sonra/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Operasyon yetenekleri' })).toHaveAttribute(
    'href',
    '/#yetenekler',
  )

  await page.reload()
  await page.getByRole('button', { name: 'AltitudELog asistanını aç' }).click()
  await expect(page.getByText('METAR nasıl çalışır?')).toBeVisible()

  await page.getByRole('button', { name: 'Konuşmalar' }).click()
  await page.getByRole('button', { name: 'Tüm konuşmaları temizle' }).click()

  const confirmation = page.getByRole('alertdialog', { name: 'Tüm konuşmaları temizle' })
  await expect(confirmation).toBeVisible()
  await expect(confirmation.getByRole('button', { name: 'Vazgeç' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(confirmation).toBeHidden()
  await expect(page.getByRole('button', { name: 'Tüm konuşmaları temizle' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'AltitudELog asistanını aç' })).toBeFocused()
})
