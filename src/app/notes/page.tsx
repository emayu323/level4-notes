'use client'
import { useEffect, useState, FormEvent } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  addDoc, collection, deleteDoc, doc,
  getDocs, orderBy, query, serverTimestamp, where
} from 'firebase/firestore'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'

type Note = {
  id: string
  text: string
  userId: string
  createdAt?: { seconds: number; nanoseconds: number } | null
}

export default function NotesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const colRef = collection(db, 'notes')

  // サインイン状態を待つ
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function loadNotes(uid: string) {
    setLoading(true)
    try {
      const q = query(
        colRef,
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      const list: Note[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Note, 'id'>) }))
      setNotes(list)
    } finally {
      setLoading(false)
    }
  }

  // ログインが決まったら読み込み
  useEffect(() => {
    if (user?.uid) void loadNotes(user.uid)
  }, [user])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user?.uid) return alert('先に /auth でログインしてください')
    if (!text.trim()) return
    await addDoc(colRef, {
      text: text.trim(),
      userId: user.uid,
      createdAt: serverTimestamp(),
    })
    setText('')
    await loadNotes(user.uid)
  }

  async function onDelete(id: string) {
    if (!user?.uid) return
    await deleteDoc(doc(db, 'notes', id))
    await loadNotes(user.uid)
  }

  if (loading) {
    return <main className="max-w-xl mx-auto p-6">読み込み中…</main>
  }

  if (!user) {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold">メモ</h1>
        <p className="text-red-500">まず <Link href="/auth" className="underline">/auth</Link> でログインしてください。</p>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">メモ</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メモを入力"
        />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">
          追加
        </button>
      </form>

      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="border rounded px-3 py-2 flex justify-between">
              <span>{n.text}</span>
              <button onClick={() => onDelete(n.id)} className="text-sm text-red-600">
                削除
              </button>
            </li>
          ))}
          {notes.length === 0 && <li className="text-sm text-gray-500">メモはまだありません</li>}
        </ul>
      )}
    </main>
  )
}
