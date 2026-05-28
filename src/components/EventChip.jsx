export function EventChip({ event, onClick }) {
  const title =
    event.title.length > 18
      ? event.title.slice(0, 18) + '…'
      : event.title

  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onClick(event)
      }}
      className="w-full text-left text-[10px] px-1 py-0.5 rounded leading-tight text-white truncate"
      style={{ backgroundColor: event.color }}
      title={event.title}
    >
      {title}
    </button>
  )
}
