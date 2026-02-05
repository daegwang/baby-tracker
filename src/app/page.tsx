import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🍼 Baby Tracker
          </h1>
          <p className="text-muted-foreground">
            Track your baby's daily activities with ease
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Features</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center">
                <span className="mr-2">📊</span>
                Track sleep, feeding, diaper changes & pumping
              </li>
              <li className="flex items-center">
                <span className="mr-2">👥</span>
                Share access with multiple caregivers
              </li>
              <li className="flex items-center">
                <span className="mr-2">📱</span>
                Works offline as a Progressive Web App
              </li>
              <li className="flex items-center">
                <span className="mr-2">🔄</span>
                Real-time sync across all devices
              </li>
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="block w-full text-center bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90"
          >
            Get Started
          </Link>

          <p className="text-xs text-center text-muted-foreground">
            Sign in or create an account to continue
          </p>
        </div>
      </div>
    </div>
  )
}
