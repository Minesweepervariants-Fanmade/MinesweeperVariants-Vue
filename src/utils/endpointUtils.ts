import { useSettings } from '@/composables/useSettings'

/**
 * 获取完整 API endpoint
 * @param path 相对路径（如 'metadata' 或 'click'）
 */
export function getApiEndpoint(path: string): string {
  const { settings } = useSettings()
  let base = settings.value.serverUrl
  if (!base.endsWith('/')) base += '/'
  return base + path.replace(/^\//, '')
}
