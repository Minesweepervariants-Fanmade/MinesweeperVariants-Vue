import { useSettings } from '@/composables/useSettings'
import typia from 'typia'

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

export interface Task {
  taskid: number
  queueing: number
  interval?: number
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

  // 将 token 加入 url 参数
  const token = window.localStorage.getItem('token')
  let urlWithToken = url

  if (token) {
    const urlObj = new URL(url, window.location.origin)
    urlObj.searchParams.set('token', token)
    urlWithToken = urlObj.toString()
  }

  try {
    response = await Promise.race([
      fetch(urlWithToken, rest),
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

export function test_connect_fail_reason(): string {
  const { settings } = useSettings()

  // 如果页面不是通过 HTTPS 访问，则无需检查
  const pageProtocol = typeof window !== 'undefined' && window.location && window.location.protocol
  if (pageProtocol !== 'https:') return ''

  const serverUrl = settings.value?.serverUrl?.toString()?.trim() ?? ''
  if (!serverUrl) return ''

  // 处理几种常见的 serverUrl 写法：
  // - 以 http:// 或 https:// 开头
  // - 以 // 开头（协议相对） -> 与页面协议一致，故安全
  // - 以 / 开头 或 不带协议（相对地址） -> 使用当前页面协议，故安全
  const lower = serverUrl.toLowerCase()
  if (lower.startsWith('http://')) {
    return '\n警告：页面通过 HTTPS 加载，但配置的服务器地址使用 HTTP（http://），这会导致浏览器阻止或混合内容被屏蔽。请将服务器地址改为 HTTPS 或使用相对/协议相同的地址。'
  }

  // 其它情况（https://, //, /path, relative）视为安全
  return ''
}

// 通用的错误处理函数
async function handleFetchError(error: unknown, response: { ok: boolean; status: number; json: () => Promise<unknown>; text: () => Promise<string> } | null) {
  if (response?.status === 401) {
    window.localStorage.removeItem('token')
    const result = await fetchWithoutValidation(getApiEndpoint('new_token'))
    const data = typia.assert<{ token: string }>(result.data)
    const token = data.token

    if (token) {
      window.localStorage.setItem('token', token)
    } else {
      return { error: '未授权访问 (401), 未能成功获取token', status: 401 }
    }
    return
  }
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
  options: FetchOptions = {},
  retries: number = 3
): Promise<FetchResult> {
  const { response, error } = await fetchCore(url, options)

  // 如果有错误或响应不正常，返回错误信息
  if (error || !response || !response.ok) {
    const result = await handleFetchError(error, response)
    if (result) {
      return result
    }

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return fetchWithoutValidation(url, options, retries - 1)
    }

    return { error: '请求失败', status: 400 }
  }

  if (response.status === 202) {
    const data = await response.json() as { interval?: string }
    const interval = data?.interval ? parseInt(data.interval) : 100
    await new Promise(resolve => setTimeout(resolve, interval))
    return await fetchWithoutValidation(url)
  }

  // 仅当响应正常时才尝试解析JSON
  try {
    const data = await response.json() as object
    if ('taskid' in data) {
      const task = typia.assert<Task>(data)
      if (task?.interval) {
        await new Promise(resolve => setTimeout(resolve, task.interval))
      }
      const _result = await fetchWithoutValidation(`${getApiEndpoint('check')}?taskid=${task.taskid}`)
      return _result
    }

    return { data, status: response.status }
  } catch (error) {
    return { error: `返回值不合法，${error}`, status: response.status }
  }
}


// 专门用于获取文本内容的 fetch 函数
export async function fetchText(
  url: string,
  options: FetchOptions = {},
  retries: number = 3
): Promise<FetchResult<string>> {
  const { response, error } = await fetchCore(url, options)

  // 如果有错误或响应不正常，返回错误信息
  if (error || !response || !response.ok) {
    const result = await handleFetchError(error, response)
    if (result) {
      return result
    }
    if (retries > 0) {
      return fetchText(url, options, retries - 1)
    }

    return { error: '请求失败', status: 400 }
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
