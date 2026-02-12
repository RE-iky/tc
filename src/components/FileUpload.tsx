import { useState, useCallback } from 'react'
import { VideoInfo } from '@/types'
import './FileUpload.css'

interface Props {
  onAdd: (video: VideoInfo) => void
}

type Status = 'idle' | 'upload' | 'done' | 'error'

interface State {
  status: Status
  msg: string
}

export default function FileUpload({ onAdd }: Props) {
  const [active, setActive] = useState(false)
  const [state, setState] = useState<State>({ status: 'idle', msg: '' })

  const handle = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setState({ status: 'error', msg: 'Format error' })
      return
    }
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setState({ status: 'error', msg: 'File too large' })
      return
    }

    setState({ status: 'upload', msg: 'Uploading...' })

    const form = new FormData()
    form.append('video', file)
    form.append('title', file.name.replace(/\.[^.]+$/, ''))

    try {
      const r = await fetch('/api/videos/upload', { method: 'POST', body: form })
      const res = await r.json()
      if (res.success) onAdd(res.data)
      setState({ status: 'done', msg: 'Done' })
      setTimeout(() => setState({ status: 'idle', msg: '' }), 3000)
    } catch {
      setState({ status: 'error', msg: 'Failed' })
    }
  }, [onAdd])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setActive(false)
    if (e.dataTransfer?.files?.[0]) handle(e.dataTransfer.files[0])
  }, [handle])

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handle(e.target.files[0])
  }, [handle])

  return (
    <section className="upload">
      <h3>Upload Video</h3>
      <div className={active ? 'zone active' : 'zone'} onDragEnter={() => setActive(true)} onDragLeave={() => setActive(false)} onDragOver={e => e.preventDefault()} onDrop={onDrop}>
        <input type="file" accept="video/*" onChange={onInput} />
        <div className="content">
          {state.status === 'idle' && <p>Drag file or click to upload</p>}
          {state.status === 'upload' && <p>{state.msg}</p>}
          {state.status === 'done' && <p className="done">{state.msg}</p>}
          {state.status === 'error' && <p className="error">{state.msg} <button onClick={() => setState({ status: 'idle', msg: '' })}>Retry</button></p>}
        </div>
      </div>
      <p className="hint">MP4/WebM/OGG, max 2GB</p>
    </section>
  )
}
