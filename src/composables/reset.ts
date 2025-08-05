
import { fetchWithoutValidation } from '@/utils/fetchUtils'

export async function fetchReset() {
  return await fetchWithoutValidation('http://localhost:5050/api/reset', { method: 'POST' })
}
