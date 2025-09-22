'use client';
import { useEffect, useMemo, useState, FormEvent } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, where, getFirestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Note = {
  id: string;
  text: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
  userId: string;
};

export default function NotesPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const colRef = useMemo(() => collection(db, 'notes'), []);

  // ログイン状態を監視して、uid をセット
  useEffect(() => {
    const auth = getAuth();
    const off = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => off();
  }, []);

  // uid が取れてから購読開始
  useEffect(() => {
    if (!uid) { setLoading(false); setNotes([]); return; }

    const q = query(
      colRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Note[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Note, 'id'>) }));
      setNotes(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [uid, colRef]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uid) { alert('まず /auth でログインしてください'); return; }
    const value = text.trim();
    if (!value) return;

    await addDoc(colRef, {
      text: value,
      userId: uid,
      createdAt: serverTimestamp(),
    });
    setText('');
    // onSnapshot が拾うのでリロード不要
  }

  async function onDelete(id: string) {
    await deleteDoc(doc(db, 'notes', id));
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

      {!uid && <p className="text-sm text-gray-500">まず <a href="/auth" className="underline">/auth</a> でログインしてください。</p>}

      {loading ? (
        <p>読み込み中…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-500">メモはまだありません</p>
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="border rounded px-3 py-2 flex justify-between">
              <span>{n.text}</span>
              <button onClick={() => onDelete(n.id)} className="text-sm text-red-600">削除</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
