import { useSettings } from '@/composables/useSettings'

export interface FetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeout?: number // 超时时间（毫秒）
}

export interface FetchResult<T = unknown> {
  data?: T
  error?: string
  status?: number
}

// 内部通用的fetch处理函数
async function fetchCore(
  url: string,
  options: FetchOptions = {}
): Promise<{ response: { ok: boolean; status: number; json: () => Promise<unknown>; text: () => Promise<string> } | null; error: unknown | null }> {
  const { timeout = 10000, ...rest } = options

  let timeoutId: number | undefined
  let response: { ok: boolean; status: number; json: () => Promise<unknown>; text: () => Promise<string> } | null = null
  let error: unknown = null

  // 创建超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('TIMEOUT'))
    }, timeout)
  })

  try {
    response = await Promise.race([
      fetch(url, rest),
      timeoutPromise
    ])
  } catch (e: unknown) {
    error = e
  } finally {
    // 清理timer
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
    }
  }

  return { response, error }
}

// 通用的错误处理函数
function handleFetchError(error: unknown, response: { ok: boolean; status: number; json: () => Promise<unknown>; text: () => Promise<string> } | null): FetchResult<never> {
  // 处理异常错误
  if (error) {
    if (
      typeof error === 'object' && error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message
      if (message === 'TIMEOUT') {
        return { error: '请求超时，请稍后重试' }
      }
      if (message.includes('Failed to fetch')) {
        // Failed to fetch 可能是网络错误，也可能是服务器错误(如500)
        if (message.includes('500') || message.toLowerCase().includes('internal server error')) {
          return { error: '服务器内部错误 (500)', status: 500 }
        }
        return { error: '无法连接服务器或不允许跨域' }
      }
      return { error: `请求失败: ${message}` }
    }
    return { error: `请求失败: ${String(error)}` }
  }

  // 检查响应状态
  if (!response || !response.ok) {
    const status = response?.status
    let errorMsg = `服务器异常: ${status || 'unknown'}`
    if (status === 404) errorMsg = '资源未找到 (404)'
    else if (status === 403) errorMsg = '无权限访问 (403)'
    else if (status === 500) errorMsg = '服务器内部错误 (500)'
    return { error: errorMsg, status }
  }

  // 不应该到达这里
  return { error: '未知错误' }
}

export async function fetchWithoutValidation(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const { response, error } = await fetchCore(url, options)

  // 如果有错误或响应不正常，返回错误信息
  if (error || !response || !response.ok) {
    return handleFetchError(error, response)
  }

  // 仅当响应正常时才尝试解析JSON
  try {
    const data = await response.json()
    return { data, status: response.status }
  } catch {
    return { error: '返回值不合法，无法解析为JSON', status: response.status }
  }
}


// 专门用于获取文本内容的 fetch 函数
export async function fetchText(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<string>> {
  const { response, error } = await fetchCore(url, options)

  // 如果有错误或响应不正常，返回错误信息
  if (error || !response || !response.ok) {
    return handleFetchError(error, response)
  }

  // 仅当响应正常时才尝试获取文本内容
  try {
    const data = await response.text()
    return { data, status: response.status }
  } catch {
    return { error: '返回值不合法，无法解析为文本', status: response.status }
  }
}

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
