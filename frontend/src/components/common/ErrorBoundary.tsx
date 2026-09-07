import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { translate, useLanguageStore } from '../../i18n'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches a render-time crash anywhere in the app.
 *
 * Without one, a single bad render unmounts the whole tree and leaves a blank white page with no
 * way back — the user cannot even tell whether they are still signed in. `SculptureLayer` already
 * boundaries the landing page's WebGL model for exactly this reason; this is the same guarantee
 * for every other route.
 *
 * It has to be a class: `getDerivedStateFromError` and `componentDidCatch` have no hook equivalent.
 * That also means it cannot call `useT()`, so it reads the language store directly — the same
 * store the hook reads, so the fallback still renders in the user's chosen language.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry sink in this project yet, so the console is the only place this can go —
    // dropping it silently would make a production crash unreportable.
    console.error('Unhandled render error', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    // A full navigation rather than a router push: the router tree is the thing that just threw,
    // so remounting the document is what actually clears the bad state.
    window.location.assign('/dashboard')
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const t = (key: Parameters<typeof translate>[1]) =>
      translate(useLanguageStore.getState().language, key)

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface px-6 py-24 text-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded bg-error/10 text-error">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <h1 className="display text-3xl text-on-surface sm:text-4xl">{t('errorBoundary.title')}</h1>
        <p className="max-w-md text-on-surface-variant">{t('errorBoundary.body')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={this.handleReload}
            className="inline-flex items-center justify-center rounded bg-action px-4 py-2.5 text-sm font-semibold text-on-action transition-colors hover:bg-action-hover"
          >
            {t('errorBoundary.reload')}
          </button>
          <button
            onClick={this.handleGoHome}
            className="inline-flex items-center justify-center rounded border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            {t('errorBoundary.backToDashboard')}
          </button>
        </div>
      </div>
    )
  }
}
