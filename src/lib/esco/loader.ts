import fs from 'fs'
import path from 'path'
import { EscoSkill } from '@/types'

let cachedSkills: EscoSkill[] | null = null

export function getEscoSkills(): EscoSkill[] {
  if (cachedSkills) return cachedSkills

  const filePath = path.join(process.cwd(), 'data', 'esco_skills_subset.csv')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.trim().split('\n').slice(1) // skip header

  cachedSkills = lines.map(line => {
    const cols = line.split(',')
    const esco_id = cols[0]?.trim() ?? ''
    const skill_name = cols[1]?.trim() ?? ''
    const skill_category = cols[2]?.trim() ?? ''
    // description may contain commas — rejoin remaining columns
    const description = cols.slice(3).join(',').trim().replace(/^"|"$/g, '')
    return { esco_id, skill_name, skill_category, description }
  }).filter(s => s.esco_id)

  return cachedSkills
}
