import { AnimationOpacity, AnimationSlide } from '@/components/Animations'
import { useTitle } from '@/hooks/useTitle'
import { Button, Input, Spin, Tag, message } from 'antd'
import axios from 'axios'
import { useState } from 'react'

const API = 'http://localhost:3001'

const CURL_EXAMPLES = '# 健康检查\ncurl http://localhost:3001/health\n\n# 创建\ncurl -X POST http://localhost:3001/api/items \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"test"}\'\n\n# 列表\ncurl http://localhost:3001/api/items\n\n# 详情\ncurl http://localhost:3001/api/items/1\n\n# 更新\ncurl -X PUT http://localhost:3001/api/items/1 \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"updated"}\'\n\n# 删除\ncurl -X DELETE http://localhost:3001/api/items/1'

type Status = 'idle' | 'loading' | 'success' | 'error'

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.1V12a10 10 0 1 1-6-9.2" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const CrossIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  desc: string
  children?: React.ReactNode
  onSend: () => Promise<any>
  response?: any
  status?: Status
}

const methodColor: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
}

function EndpointCard({ method, path, desc, children, onSend, response, status }: EndpointProps) {
  const [localStatus, setLocalStatus] = useState<Status>('idle')
  const [localResponse, setLocalResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const currentStatus = status || localStatus
  const currentResponse = response !== undefined ? response : localResponse

  const handleSend = async () => {
    if (onSend) {
      setLoading(true)
      setLocalStatus('loading')
      try {
        const res = await onSend()
        setLocalResponse(res)
        setLocalStatus('success')
      } catch (e: any) {
        setLocalResponse(e?.response?.data || e.message)
        setLocalStatus('error')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
      <AnimationSlide direction="slideInUp" distance={24} duration={500}>
      <div className="endpoint-card bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <Tag color={methodColor[method]} className="!m-0 !px-3 !py-0.5 !text-xs !font-bold !leading-6 !border-none">
              {method}
            </Tag>
            <code className="text-sm text-gray-600 font-mono">{path}</code>
            <span className="text-xs text-gray-400 ml-auto hidden sm:inline">{desc}</span>
          </div>
          <span className="text-xs text-gray-400 sm:hidden">{desc}</span>
        </div>

        <div className="p-5 space-y-4">
          {children && <div className="space-y-3">{children}</div>}

          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SendIcon />}
              onClick={handleSend}
              loading={loading}
              className="!bg-[#13c2c2] !border-none hover:!bg-[#0ea5a5]"
            >
              发送请求
            </Button>
          </div>

          {currentStatus !== 'idle' && (
            <div
              className={`response-area rounded-lg p-4 font-mono text-sm ${
                currentStatus === 'loading'
                  ? 'bg-gray-50'
                  : currentStatus === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
              }`}
            >
              {currentStatus === 'loading' ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Spin size="small" />
                  <span>请求中...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {currentStatus === 'success' ? (
                      <span className="text-green-600 inline-flex"><CheckIcon /></span>
                    ) : (
                      <span className="text-red-500 inline-flex"><CrossIcon /></span>
                    )}
                    <span className={currentStatus === 'success' ? 'text-green-600' : 'text-red-500'}>
                      {currentStatus === 'success' ? '请求成功' : '请求失败'}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                    {JSON.stringify(currentResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimationSlide>
  )
}

export const RequestPage: React.FC<{ title?: string }> = (props) => {
  if (props.title) useTitle(props.title)

  const [createName, setCreateName] = useState('')
  const [updateId, setUpdateId] = useState('')
  const [updateName, setUpdateName] = useState('')
  const [getOneId, setGetOneId] = useState('')
  const [deleteId, setDeleteId] = useState('')

  const endpoints = [
    {
      key: 'health',
      method: 'GET' as const,
      path: '/health',
      desc: '服务健康检查',
      children: null,
      onSend: async () => {
        const res = await axios.get(`${API}/health`)
        return res.data
      },
    },
    {
      key: 'create',
      method: 'POST' as const,
      path: '/api/items',
      desc: '创建 Item',
      children: (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">name</label>
          <Input
            placeholder="输入 name (1~100 字符)"
            value={createName}
            onChange={e => setCreateName(e.target.value)}
          />
        </div>
      ),
      onSend: async () => {
        if (!createName) { message.warning('请先输入 name'); throw new Error('name is required') }
        const res = await axios.post(`${API}/api/items`, { name: createName })
        return res.data
      },
    },
    {
      key: 'list',
      method: 'GET' as const,
      path: '/api/items',
      desc: '获取 Item 列表',
      children: null,
      onSend: async () => {
        const res = await axios.get(`${API}/api/items`)
        return res.data
      },
    },
    {
      key: 'getOne',
      method: 'GET' as const,
      path: '/api/items/:id',
      desc: '获取单个 Item',
      children: (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">ID</label>
          <Input
            placeholder="输入 ID"
            value={getOneId}
            onChange={e => setGetOneId(e.target.value)}
          />
        </div>
      ),
      onSend: async () => {
        if (!getOneId) { message.warning('请先输入 ID'); throw new Error('ID is required') }
        const res = await axios.get(`${API}/api/items/${getOneId}`)
        return res.data
      },
    },
    {
      key: 'update',
      method: 'PUT' as const,
      path: '/api/items/:id',
      desc: '更新 Item',
      children: (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ID</label>
            <Input
              placeholder="输入 ID"
              value={updateId}
              onChange={e => setUpdateId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">name</label>
            <Input
              placeholder="输入新 name"
              value={updateName}
              onChange={e => setUpdateName(e.target.value)}
            />
          </div>
        </div>
      ),
      onSend: async () => {
        if (!updateId) { message.warning('请先输入 ID'); throw new Error('id is required') }
        if (!updateName) { message.warning('请先输入 name'); throw new Error('name is required') }
        const res = await axios.put(`${API}/api/items/${updateId}`, { name: updateName })
        return res.data
      },
    },
    {
      key: 'delete',
      method: 'DELETE' as const,
      path: '/api/items/:id',
      desc: '删除 Item',
      children: (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">ID</label>
          <Input
            placeholder="输入要删除的 ID"
            value={deleteId}
            onChange={e => setDeleteId(e.target.value)}
          />
        </div>
      ),
      onSend: async () => {
        if (!deleteId) { message.warning('请先输入 ID'); throw new Error('id is required') }
        const res = await axios.delete(`${API}/api/items/${deleteId}`)
        return res.data
      },
    },
  ]

  return (
    <div className="request-container h-[calc(100vh-var(--header-height))] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimationOpacity fromOpacity={0} toOpacity={1} duration={600}>
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
              API 接口测试
            </h1>
            <p className="text-gray-500 text-sm">
              基于 Fastify + React 的全栈模板，以下是所有 RESTful API 接口的在线测试面板
            </p>
          </div>
        </AnimationOpacity>

        <div className="space-y-6">
          {endpoints.map((ep) => (
            <EndpointCard
              key={ep.key}
              method={ep.method}
              path={ep.path}
              desc={ep.desc}
              onSend={ep.onSend}
            >
              {ep.children}
            </EndpointCard>
          ))}
        </div>

        <AnimationOpacity fromOpacity={0} toOpacity={1} duration={600} delay={800}>
          <div className="mt-12 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-[#13c2c2] mb-3">快速测试 (cURL)</h3>
            <div className="space-y-2 text-xs text-gray-600 font-mono">
              <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">{CURL_EXAMPLES}</pre>
            </div>
          </div>
        </AnimationOpacity>
      </div>
    </div>
  )
}

export default RequestPage
