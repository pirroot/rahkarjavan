export default function Loading() {
  return (
    <main
      className="mx-auto min-h-[70vh] max-w-7xl animate-pulse px-4 py-10"
      aria-label="در حال بارگذاری"
    >
      <div className="h-9 w-48 rounded-lg bg-gray-200 dark:bg-white/10" />
      <div className="mt-7 aspect-video max-w-4xl rounded-2xl bg-gray-200 dark:bg-white/10" />
      <div className="mt-6 h-6 max-w-2xl rounded bg-gray-200 dark:bg-white/10" />
      <div className="mt-4 h-4 max-w-xl rounded bg-gray-200 dark:bg-white/10" />
    </main>
  );
}
