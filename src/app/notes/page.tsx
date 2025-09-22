'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

type Note = {
  id: string;
  text: string;
  createdAt?: Timestamp | null;
  userId?: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // Firestore 参照はメモ化
  const colRef = useMemo(() => collection(db, 'notes'), []);

  // 一覧取得（依存関係は colRef のみ）
  const loadNotes = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: Note[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Note, 'id'>;
        return { id: d.id, ...data };
      });
      setNotes(list);
    } catch (e) {
      // 未ログインやルール違反だとここに来ます
      setErr('読み込みに失敗しました。まず /auth でログインしてください。');
    } finally {
      setLoading(false);
    }
  }, [colRef]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setErr('');
    setLoading(true);
    try {
      // 認証済みのとき Firebase Auth の uid を使う
      const uid =
        typeof window !== 'undefined'
          ? (await import('firebase/auth')).getAuth().currentUser?.uid ?? null
          : null;

      await addDoc(colRef, {
        text: value,
        createdAt: serverTimestamp(),
        userId: uid,
      });
      setText('');
      await loadNotes();
    } catch (e) {
      setErr('追加に失敗しました。ログイン済みか確認してください。');
    } finally {
      setLoading(false);
    }
  }

  const onDelete = useCallback(
    async (id: string) => {
      setErr('');
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'notes', id));
        await loadNotes();
      } catch {
        setErr('削除に失敗しました。権限を確認してください。');
      } finally {
        setLoading(false);
      }
    },
    [loadNotes]
  );

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">メモ</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setText(e.currentTarget.value)
          }
          placeholder="メモを入力"
        />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">
          追加
        </button>
      </form>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="border rounded px-3 py-2 flex justify-between">
              <span>{n.text}</span>
              <button
                onClick={() => void onDelete(n.id)}
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
