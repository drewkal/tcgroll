// src/lib/settings.ts
import { prisma } from './prisma'

export type SettingKey = 'logo_header' | 'logo_footer' | 'hero_banner'

export async function getSetting(key: SettingKey): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function getSettings(keys: SettingKey[]): Promise<Record<string, string | null>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } })
  const map: Record<string, string | null> = {}
  for (const k of keys) map[k] = rows.find(r => r.key === k)?.value ?? null
  return map
}

export async function setSetting(key: SettingKey, value: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}
