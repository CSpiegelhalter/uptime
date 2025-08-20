export default function Badge({ children }: { children: React.ReactNode }) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
        {children}
      </span>
    );
  }
  