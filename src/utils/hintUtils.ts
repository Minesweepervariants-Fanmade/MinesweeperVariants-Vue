import { fetchWithValidation, getApiEndpoint } from './fetchUtils'

export async function fetchHint(count = 1) {
  const endpoint = `${getApiEndpoint('hint')}?count=${count}`
  return fetchWithValidation(endpoint)
}
