import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import QueueBitsLogo from '../components/shared/QueueBitsLogo'
import PasswordResetModal from '../components/shared/PasswordResetModal'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deadline, setDeadline] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { uid, token } = useParams<{ uid: string; token: string }>()

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [deadline])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading || remaining > 0) return
    setError('')
    setIsLoading(true)
    try {
      await login({ username, password }, remember)
      navigate('/', { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const seconds = Number(error.response.headers['retry-after']) || 60
        setRemaining(seconds)
        setDeadline(Date.now() + seconds * 1000)
        setError('Too many login attempts. Please wait before trying again.')
      } else {
        setError('Unable to log in. Check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#808080] px-5 py-10">
      <div className="w-full max-w-[380px] rounded-[28px] border border-white/60 bg-white px-8 py-9 shadow-[0_16px_32px_rgba(0,0,0,0.2)] sm:px-9">
        <div className="text-center">
          <QueueBitsLogo className="mx-auto size-20 object-contain" />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">QueueBits</h1>
          <p className="mt-1 text-xs text-slate-500">Log in to access your portal</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label htmlFor="login-username" className="ml-1 text-xs font-bold uppercase text-gray-500">Username or Email</label>
            <input id="login-username" type="text" required autoComplete="username"
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all"
              placeholder="Enter your username or email" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div>
            <label htmlFor="login-password" className="ml-1 text-xs font-bold uppercase text-gray-500">Password</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-3 pr-12 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              <button type="button" onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-500">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-slate-500">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-3.5 accent-indigo-500" />
              Remember me
            </label>
            <button type="button" onClick={() => setForgot(true)} className="font-medium text-violet-600 hover:underline">Forgot password?</button>
          </div>
          <button type="submit" disabled={isLoading || remaining > 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_3px_10px_rgba(99,102,241,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
            {isLoading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
            {isLoading ? 'Logging in…' : remaining > 0 ? `Try again in ${remaining}s` : 'Log in'}
          </button>
        </form>
      </div>
      {(forgot || (uid && token)) && <PasswordResetModal uid={uid} token={token} onClose={() => { setForgot(false); if (uid) navigate('/login', { replace: true }) }} />}
    </main>
  )
}
