export default function Notes({ value, onChange }) {
  return (
    <div className="flex flex-col h-full p-4 md:p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Notes</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your notes here…"
        className="flex-1 resize-none text-sm text-gray-700 placeholder-gray-300 focus:outline-none leading-relaxed"
      />
    </div>
  )
}
