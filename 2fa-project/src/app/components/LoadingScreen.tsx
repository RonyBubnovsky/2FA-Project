export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 flex flex-col items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-400 border-t-transparent"></div>
          <h2 className="mt-6 text-xl font-medium text-secondary-700 dark:text-secondary-300">
            {message}
          </h2>
        </div>
      </div>
    </div>
  )
} 