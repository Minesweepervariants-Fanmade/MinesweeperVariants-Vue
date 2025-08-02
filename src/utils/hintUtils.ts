import { fetchWithValidation } from './fetchUtils'
import { getApiEndpoint } from './endpointUtils'

export async function fetchHint(count = 1) {
  const endpoint = `${getApiEndpoint('hint')}?count=${count}`
  return fetchWithValidation(endpoint)
}
