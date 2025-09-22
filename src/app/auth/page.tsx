'use client'
import { useEffect, useState } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import Link from 'next/link'

export default function AuthPage() {
  const [user, setUser] = useState<User|null>(null)
  useEffect(() => onAuthStateChanged(auth, setUser), [])

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">ログイン</h1>
      {!user ? (
        <button className="px-4 py-2 rounded bg-black text-white"
                onClick={() => signInWithPopup(auth, googleProvider)}>
          Google でログイン
        </button>
      ) : (
        <div className="space-y-3">
          <p>こんにちは、{user.displayName ?? user.email}</p>
          <div className="space-x-3">
            <Link href="/notes" className="underline">メモへ</Link>
            <button className="px-3 py-1 rounded border" onClick={() => signOut(auth)}>ログアウト</button>
          </div>
        </div>
      )}
      <Link href="/" className="text-sm underline">← ホームへ</Link>
    </main>
  )
}
