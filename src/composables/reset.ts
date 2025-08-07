
import { fetchWithoutValidation, getApiEndpoint } from '@/utils/fetchUtils'

export async function fetchReset() {
  return await fetchWithoutValidation(getApiEndpoint('reset'), { method: 'POST' })
}
