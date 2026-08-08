export default function CategoryChips({ categories, active, onChange, labels = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className={!active ? "chip-active" : "chip hover:bg-cloud"} onClick={() => onChange(null)}>
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          className={active === c ? "chip-active" : "chip hover:bg-cloud"}
          onClick={() => onChange(c)}
        >
          {labels[c] || c}
        </button>
      ))}
    </div>
  );
}
