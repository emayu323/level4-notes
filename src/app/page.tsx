import Link from 'next/link'

export default function Home() {
  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Level4 Notes</h1>
      <p className="text-sm text-gray-600">まずはログインしてから、メモを使います。</p>
      <div className="space-x-3">
        <Link href="/auth" className="px-3 py-2 rounded bg-black text-white">ログイン</Link>
        <Link href="/notes" className="px-3 py-2 rounded border">メモ</Link>
      </div>
    </main>
  )
}
