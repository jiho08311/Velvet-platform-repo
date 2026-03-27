import React from "react"

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("UI ErrorBoundary caught error:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 text-zinc-100">
          <div className="max-w-md">
            <div className="mb-4 h-10 w-10 rounded-2xl bg-zinc-800" />

            <h2 className="text-xl font-semibold tracking-tight text-white">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              This screen could not be loaded. Please refresh the page or try
              again in a moment.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}