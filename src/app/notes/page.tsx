'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import Link from 'next/link'

type Note = { id: string; text: string; createdAt?: any }

export default function NotesPage() {
  const [uid, setUid] = useState<string|null>(null)
  const [text, setText] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState('')

  useEffect(() => onAuthStateChanged(auth, u => {
    setUid(u?.uid ?? null)
    if (!u) setNotes([])
  }), [])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'notes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
  }, [uid])

  async function addNote() {
    if (!uid || !text.trim()) return
    try {
      await addDoc(collection(db, 'users', uid, 'notes'), { text: text.trim(), createdAt: serverTimestamp() })
      setText('')
    } catch { setError('保存に失敗しました') }
  }
  async function remove(id: string) {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'notes', id))
  }

  if (!uid) {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-4">
        <p>先にログインしてください。</p>
        <Link href="/auth" className="underline">ログインへ</Link>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">メモ</h1>
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" value={text}
               onChange={e => setText(e.target.value)} placeholder="メモを書く" />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={addNote}>追加</button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="divide-y">
        {notes.map(n => (
          <li key={n.id} className="py-2 flex justify-between">
            <span>{n.text}</span>
            <button className="text-sm text-gray-600 hover:text-red-600" onClick={() => remove(n.id)}>削除</button>
          </li>
        ))}
      </ul>
      <Link href="/" className="text-sm underline">← ホーム</Link>
    </main>
  )
}
