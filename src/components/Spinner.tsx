export function Spinner({ className = "size-8" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full border-2 border-primary/25 border-t-primary animate-spin`} />
  );
}

export function CenteredSpinner({ height = "h-32" }: { height?: string }) {
  return (
    <div className={`w-full ${height} grid place-items-center`}>
      <Spinner />
    </div>
  );
}
