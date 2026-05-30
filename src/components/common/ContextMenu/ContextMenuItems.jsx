export function ContextMenuItem({ icon: Icon, label, onClick }) {
  return (
    <button type="button" 
      className="context-menu__item" 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {Icon && <Icon weight="bold" />}
      <span>{label}</span>
    </button>
  );
}

export function ContextMenuDivider() {
  return <div className="context-menu__divider" />;
}
