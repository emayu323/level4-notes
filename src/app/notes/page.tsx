'use client'
import { useEffect, useState, FormEvent } from 'react'
import { db } from '@/lib/firebase'
import {
  addDoc, collection, deleteDoc, doc,
  getDocs, orderBy, query, serverTimestamp, where
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

type Note = {
  id: string
  text: string
  userId: string
  createdAt?: { seconds: number; nanoseconds: number } | null
}

export default function NotesPage() {
  const [uid, setUid] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const colRef = collection(db, 'notes')

  // ログイン確認
  useEffect(() => {
    const auth = getAuth()
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null)
    })
    return () => unsub()
  }, [])

  async function loadNotes(u: string) {
    setLoading(true); setError('')
    try {
      const q = query(colRef,
        where('userId', '==', u),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      const list: Note[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Note,'id'>) }))
      setNotes(list)
    } catch (e: any) {
      setError(e?.message ?? '読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (uid) void loadNotes(uid) }, [uid])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!uid) return alert('まず /auth でログインしてください')
    if (!text.trim()) return
    await addDoc(colRef, {
      text: text.trim(),
      userId: uid,                 // ← これが重要（ルールの create 条件）
      createdAt: serverTimestamp()
    })
    setText('')
    await loadNotes(uid)
  }

  async function onDelete(id: string) {
    if (!uid) return
    await deleteDoc(doc(db, 'notes', id))
    await loadNotes(uid)
  }

  if (!uid) {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold">メモ</h1>
        <p>先に <a className="underline" href="/auth">/auth</a> でログインしてください。</p>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">メモ</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2"
               value={text} onChange={(e) => setText(e.target.value)}
               placeholder="メモを入力" />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">追加</button>
      </form>

      {loading ? <p>読み込み中…</p> : error ? <p className="text-red-600">{error}</p> : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="border rounded px-3 py-2 flex justify-between">
              <span>{n.text}</span>
              <button onClick={() => onDelete(n.id)} className="text-sm text-red-600">削除</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
