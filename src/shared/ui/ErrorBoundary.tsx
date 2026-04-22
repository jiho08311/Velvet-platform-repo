import React from "react"
import { RestrictedStateShell } from "./RestrictedStateShell"

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
        <RestrictedStateShell
          title="Something went wrong"
          description="This screen could not be loaded. Please refresh the page or try again in a moment."
          visual={<div className="h-10 w-10 rounded-2xl bg-zinc-800" />}
        />
      )
    }

    return this.props.children
  }
}