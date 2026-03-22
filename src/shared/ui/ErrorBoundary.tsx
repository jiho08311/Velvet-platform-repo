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
        <div className="p-6 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-400">
            Please refresh the page or try again later.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}