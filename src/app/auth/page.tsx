'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth, googleProvider } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'

export default function AuthPage() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  async function handleLogin() {
    try {
      setBusy(true)
      await signInWithPopup(auth, googleProvider)
      // ログイン後はメモ画面へ
      window.location.href = '/notes'
    } catch (e) {
      alert('ログインに失敗しました')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    await signOut(auth)
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">ログイン</h1>

      {user ? (
        <>
          <p>ログイン中：{user.email}</p>
          <div className="flex gap-3">
            <button onClick={handleLogout} className="px-4 py-2 rounded border">ログアウト</button>
            <Link href="/notes" className="px-4 py-2 rounded bg-black text-white">メモへ</Link>
          </div>
        </>
      ) : (
        <button
          onClick={handleLogin}
          disabled={busy}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {busy ? '処理中…' : 'Googleでログイン'}
        </button>
      )}
    </main>
  )
}
