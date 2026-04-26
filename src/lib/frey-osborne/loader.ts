import fs from 'fs'
import path from 'path'
import { FreyOsborneEntry } from '@/types'

let cache: Map<string, FreyOsborneEntry> | null = null

export function getFreyOsborneData(): Map<string, FreyOsborneEntry> {
  if (cache) return cache

  const filePath = path.join(process.cwd(), 'data', 'frey_osborne_isco.csv')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.trim().split('\n').slice(1)

  cache = new Map()
  for (const line of lines) {
    const cols = line.split(',')
    const isco_code = cols[0]?.trim()
    const occupation_name = cols[1]?.trim() ?? ''
    const automation_probability = parseFloat(cols[2]?.trim() ?? '0.5')
    if (isco_code) {
      cache.set(isco_code, { isco_code, occupation_name, automation_probability })
    }
  }

  return cache
}

export function getFreyOsborneScore(isco_code: string): number {
  const data = getFreyOsborneData()
  return data.get(isco_code)?.automation_probability ?? 0.5
}
