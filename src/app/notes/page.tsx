'use client';
import { useEffect, useState, FormEvent } from 'react';
import { db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc,
  getDocs, orderBy, query, serverTimestamp
} from 'firebase/firestore';

type Note = {
  id: string;
  text: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const colRef = collection(db, 'notes');

  async function loadNotes() {
    setLoading(true);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: Note[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Note, 'id'>),
    }));
    setNotes(list);
    setLoading(false);
  }

  useEffect(() => {
    void loadNotes();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(colRef, { text: text.trim(), createdAt: serverTimestamp() });
    setText('');
    await loadNotes();
  }

  async function onDelete(id: string) {
    await deleteDoc(doc(db, 'notes', id));
    await loadNotes();
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
          {notes.map((n) => (
            <li key={n.id} className="border rounded px-3 py-2 flex justify-between">
              <span>{n.text}</span>
              <button
                onClick={() => onDelete(n.id)}
                className="text-sm text-red-600"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
