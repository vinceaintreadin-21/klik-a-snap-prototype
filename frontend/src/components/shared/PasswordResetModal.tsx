import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Loader2, Mail, X } from 'lucide-react'
import axios from 'axios'
import api from '../../utils/api'

interface Props {
  uid?: string
  token?: string
  onClose: () => void
}

export default function PasswordResetModal({ uid, token, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [sent, setSent] = useState(false)
  const [complete, setComplete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deadline, setDeadline] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const resetting = Boolean(uid && token)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [deadline])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || (!resetting && remaining > 0)) return
    setError('')
    if (resetting && password !== confirm) {
      setError('Passwords must match.')
      return
    }
    setBusy(true)
    try {
      if (resetting) {
        await api.post('/auth/password-reset/confirm/', {
          uid, token, password, confirm_password: confirm,
        })
        setPassword('')
        setConfirm('')
        setComplete(true)
      } else {
        const response = await api.post('/auth/password-reset/', { email })
        setSent(true)
        setRemaining(response.data.retry_after ?? 60)
        setDeadline(Date.now() + (response.data.retry_after ?? 60) * 1000)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const seconds = Number(error.response.headers['retry-after']) || 60
        setRemaining(seconds)
        setDeadline(Date.now() + seconds * 1000)
        setError(`Please wait ${seconds} seconds before trying again.`)
      } else {
        setError(axios.isAxiosError(error)
          ? error.response?.data?.error || 'Unable to complete your request. Please try again.'
          : 'Unable to complete your request. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <dialog ref={dialog} aria-labelledby="reset-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-7 text-slate-800 shadow-2xl backdrop:bg-black/40">
      <button type="button" aria-label="Close password reset" onClick={onClose} disabled={busy}
        className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50">
        <X size={18} />
      </button>
      {complete ? <CheckCircle2 className="mb-4 text-emerald-500" size={30} /> : <Mail className="mb-4 text-indigo-500" size={30} />}
      <h2 id="reset-title" className="text-xl font-semibold">
        {complete ? 'Password updated' : resetting ? 'Set your new password' : sent ? 'Check your email' : 'Forgot your password?'}
      </h2>
      {complete ? (
        <>
          <p role="status" className="mt-3 text-sm text-slate-500">Log in with your new password to access your portal.</p>
          <button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white">Back to log in</button>
        </>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {resetting ? (
            <>
              <p className="text-sm text-slate-500">Use at least 8 characters and avoid common passwords.</p>
              <label className="block text-xs font-semibold uppercase tracking-wide">New password
                <input type="password" required minLength={8} autoComplete="new-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} disabled={busy} autoFocus className={inputClass} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide">Confirm password
                <input type="password" required minLength={8} autoComplete="new-password" value={confirm}
                  onChange={(event) => setConfirm(event.target.value)} disabled={busy} className={inputClass} />
              </label>
            </>
          ) : sent ? (
            <p role="status" className="text-sm leading-6 text-slate-500">If an eligible account uses <strong className="break-all text-slate-700">{email}</strong>, a reset link has been sent. Check your inbox and spam folder.</p>
          ) : (
            <label className="block text-xs font-semibold uppercase tracking-wide">Registered email
              <input type="email" required autoComplete="email" value={email} autoFocus disabled={busy}
                onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </label>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy || (!resetting && remaining > 0)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />}
            {busy ? 'Please wait…' : resetting ? 'Reset password' : remaining > 0 ? `Try again in ${remaining}s` : sent ? 'Resend email' : 'Send reset link'}
          </button>
          {sent && <button type="button" disabled={busy} onClick={() => { setSent(false); setError('') }} className="w-full text-sm text-indigo-600">Use another email</button>}
        </form>
      )}
    </dialog>
  )
}
