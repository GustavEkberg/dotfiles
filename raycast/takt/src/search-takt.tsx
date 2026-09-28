import { Action, ActionPanel, Icon, List, openExtensionPreferences, showToast, Toast } from '@raycast/api'
import { useEffect, useState } from 'react'
import { searchItems, type SearchItem, type SearchKind } from './search-index'
import { readSettings, type Settings } from './settings'
import { openInChrome, taktUrl } from './web'
import { loadSearchIndex } from './workspace'

const LABELS: Readonly<Record<SearchKind, string>> = {
  person: 'Person',
  company: 'Company',
  project: 'Project',
  deal: 'Deal',
  note: 'Note',
  playbook: 'Playbook',
  invoice: 'Invoice',
}
const KIND_ICONS: Readonly<Record<SearchKind, Icon>> = {
  person: Icon.Person,
  company: Icon.Building,
  project: Icon.Folder,
  deal: Icon.BankNote,
  note: Icon.Document,
  playbook: Icon.Book,
  invoice: Icon.Receipt,
}

type State =
  | { readonly type: 'loading' }
  | { readonly type: 'ready'; readonly items: ReadonlyArray<SearchItem>; readonly settings: Settings }
  | { readonly type: 'error'; readonly message: string }

async function loadState(force = false): Promise<State> {
  try {
    const settings = readSettings()
    const items = await loadSearchIndex(settings.workspaceRoot, force)
    return { type: 'ready', items, settings }
  } catch (error) {
    return { type: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}

export default function Command() {
  const [state, setState] = useState<State>({ type: 'loading' })
  const [query, setQuery] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    let mounted = true
    loadState().then((result) => {
      if (mounted) setState(result)
    })
    return () => {
      mounted = false
    }
  }, [])

  const refresh = async () => {
    setState({ type: 'loading' })
    setState(await loadState(true))
  }

  const openItem = async (item: SearchItem, settings: Settings) => {
    try {
      await openInChrome(item.href, settings)
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Could not open Google Chrome',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const results = state.type === 'ready' ? searchItems(state.items, query) : []

  return (
    <List
      isShowingDetail={showPreview}
      isLoading={state.type === 'loading'}
      filtering={false}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search people, projects, notes, deals… (a = archived)"
    >
      <List.EmptyView
        icon={state.type === 'error' ? Icon.Warning : Icon.MagnifyingGlass}
        title={state.type === 'error' ? 'Could not read takt workspace' : query ? 'No matching entries' : 'Search takt'}
        description={
          state.type === 'error' ? state.message : 'Search names, IDs, tags, or use prefixes like “people” and “notes”.'
        }
        actions={
          <ActionPanel>
            <Action title="Refresh Workspace" icon={Icon.ArrowClockwise} onAction={refresh} />
            {state.type === 'error' && (
              <Action title="Open Extension Preferences" icon={Icon.Cog} onAction={openExtensionPreferences} />
            )}
          </ActionPanel>
        }
      />
      {state.type === 'ready' &&
        results.map((item) => (
          <List.Item
            key={`${item.kind}:${item.id}`}
            id={`${item.kind}:${item.id}`}
            title={item.name}
            subtitle={showPreview ? undefined : (item.secondary ?? undefined)}
            icon={{ value: KIND_ICONS[item.kind], tooltip: LABELS[item.kind] }}
            accessories={showPreview ? undefined : [{ tag: LABELS[item.kind] }]}
            detail={<List.Item.Detail markdown={item.markdown} />}
            actions={
              <ActionPanel>
                <Action
                  title="Open in Google Chrome"
                  icon={Icon.Globe}
                  onAction={() => openItem(item, state.settings)}
                />
                <Action
                  title={showPreview ? 'Hide Preview' : 'Show Preview'}
                  icon={showPreview ? Icon.EyeDisabled : Icon.Eye}
                  shortcut={{ modifiers: ['cmd', 'shift'], key: 'p' }}
                  onAction={() => setShowPreview((previous) => !previous)}
                />
                <Action.CopyToClipboard title="Copy Web URL" content={taktUrl(item.href, state.settings.siteOrigin)} />
                <Action title="Refresh Workspace" icon={Icon.ArrowClockwise} onAction={refresh} />
              </ActionPanel>
            }
          />
        ))}
    </List>
  )
}
