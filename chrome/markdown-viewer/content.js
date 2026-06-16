(function () {
  const markdownPath = /\.(md|markdown)$/i

  if (!markdownPath.test(window.location.pathname)) {
    return
  }

  if (!document.body) {
    return
  }

  const rawMarkdown = document.body.innerText
  const fileName = decodeURIComponent(window.location.pathname.split('/').pop() || 'Markdown')

  const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const safeHref = (href) => {
    try {
      const url = new URL(href.trim(), window.location.href)
      const allowedProtocols = new Set(['file:', 'http:', 'https:', 'mailto:'])

      return allowedProtocols.has(url.protocol) ? escapeHtml(url.href) : '#'
    } catch (_error) {
      return '#'
    }
  }

  const renderInline = (value) => escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => (
      `<a href="${safeHref(href)}">${label}</a>`
    ))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

  const splitTableRow = (line) => {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
    const cells = []
    let cell = ''

    for (let index = 0; index < trimmed.length; index += 1) {
      const character = trimmed[index]
      const previous = index > 0 ? trimmed[index - 1] : ''

      if (character === '|' && previous !== '\\') {
        cells.push(cell.trim().replace(/\\\|/g, '|'))
        cell = ''
      } else {
        cell += character
      }
    }

    cells.push(cell.trim().replace(/\\\|/g, '|'))

    return cells
  }

  const isTableSeparator = (line) => {
    const cells = splitTableRow(line)

    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  }

  const tableAlignment = (separatorCell) => {
    const cell = separatorCell.trim()
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')

    if (left && right) {
      return 'center'
    }

    if (right) {
      return 'right'
    }

    if (left) {
      return 'left'
    }

    return ''
  }

  const renderTableCell = (tagName, value, alignment) => {
    const alignAttribute = alignment ? ` style="text-align: ${alignment}"` : ''

    return `<${tagName}${alignAttribute}>${renderInline(value)}</${tagName}>`
  }

  const renderTable = (headerLine, separatorLine, bodyLines) => {
    const headers = splitTableRow(headerLine)
    const alignments = splitTableRow(separatorLine).map(tableAlignment)
    const headerHtml = headers
      .map((header, index) => renderTableCell('th', header, alignments[index] || ''))
      .join('')
    const bodyHtml = bodyLines
      .map((row) => {
        const cells = splitTableRow(row)
        const cellsHtml = headers
          .map((_header, index) => renderTableCell('td', cells[index] || '', alignments[index] || ''))
          .join('')

        return `<tr>${cellsHtml}</tr>`
      })
      .join('\n')

    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
  }

  const renderMarkdown = (markdown) => {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
    const output = []
    let paragraph = []
    let listType = null
    let inCode = false
    let codeLanguage = ''
    let codeLines = []

    const flushParagraph = () => {
      if (paragraph.length === 0) {
        return
      }

      output.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
      paragraph = []
    }

    const closeList = () => {
      if (!listType) {
        return
      }

      output.push(`</${listType}>`)
      listType = null
    }

    const openList = (type) => {
      if (listType === type) {
        return
      }

      closeList()
      output.push(`<${type}>`)
      listType = type
    }

    const closeCodeBlock = () => {
      if (codeLanguage.toLowerCase() === 'mermaid') {
        output.push(`<pre class="mermaid">${escapeHtml(codeLines.join('\n'))}</pre>`)
        inCode = false
        codeLanguage = ''
        codeLines = []
        return
      }

      const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : ''
      output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      inCode = false
      codeLanguage = ''
      codeLines = []
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      const fence = line.match(/^```\s*([A-Za-z0-9_-]*)\s*$/)

      if (inCode) {
        if (fence) {
          closeCodeBlock()
        } else {
          codeLines.push(line)
        }
        continue
      }

      if (fence) {
        flushParagraph()
        closeList()
        inCode = true
        codeLanguage = fence[1]
        continue
      }

      if (/^\s*$/.test(line)) {
        flushParagraph()
        closeList()
        continue
      }

      const nextLine = lines[index + 1] || ''
      if (line.includes('|') && isTableSeparator(nextLine)) {
        const bodyLines = []

        flushParagraph()
        closeList()
        index += 2

        while (index < lines.length && lines[index].includes('|') && !/^\s*$/.test(lines[index])) {
          bodyLines.push(lines[index])
          index += 1
        }

        index -= 1
        output.push(renderTable(line, nextLine, bodyLines))
        continue
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/)
      if (heading) {
        flushParagraph()
        closeList()
        const level = heading[1].length
        output.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`)
        continue
      }

      const unorderedListItem = line.match(/^\s*[-*+]\s+(.+)$/)
      if (unorderedListItem) {
        flushParagraph()
        openList('ul')
        output.push(`<li>${renderInline(unorderedListItem[1])}</li>`)
        continue
      }

      const orderedListItem = line.match(/^\s*\d+\.\s+(.+)$/)
      if (orderedListItem) {
        flushParagraph()
        openList('ol')
        output.push(`<li>${renderInline(orderedListItem[1])}</li>`)
        continue
      }

      const quote = line.match(/^>\s?(.*)$/)
      if (quote) {
        flushParagraph()
        closeList()
        output.push(`<blockquote>${renderInline(quote[1])}</blockquote>`)
        continue
      }

      paragraph.push(line.trim())
    }

    flushParagraph()
    closeList()

    if (inCode) {
      closeCodeBlock()
    }

    return output.join('\n')
  }

  const renderMermaid = () => {
    const mermaidBlocks = Array.from(document.querySelectorAll('pre.mermaid'))

    if (mermaidBlocks.length === 0 || !window.mermaid) {
      return
    }

    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
      flowchart: {
        htmlLabels: false,
        useMaxWidth: true,
      },
    })

    window.mermaid.run({ nodes: mermaidBlocks }).catch((error) => {
      console.error('Mermaid render failed', error)
    })
  }

  document.documentElement.classList.add('markdown-viewer-extension')
  document.title = fileName
  document.body.innerHTML = `
    <main class="markdown-viewer-shell">
      <header class="markdown-viewer-header">
        <div>
          <p class="markdown-viewer-kicker">Local Markdown</p>
          <h1>${escapeHtml(fileName)}</h1>
        </div>
        <button class="markdown-viewer-toggle" type="button">Raw</button>
      </header>
      <article class="markdown-viewer-content">${renderMarkdown(rawMarkdown)}</article>
      <pre class="markdown-viewer-raw" hidden>${escapeHtml(rawMarkdown)}</pre>
    </main>
  `

  renderMermaid()

  const toggle = document.querySelector('.markdown-viewer-toggle')
  const rendered = document.querySelector('.markdown-viewer-content')
  const raw = document.querySelector('.markdown-viewer-raw')

  if (!toggle || !rendered || !raw) {
    return
  }

  toggle.addEventListener('click', () => {
    const showingRaw = !raw.hidden

    raw.hidden = showingRaw
    rendered.hidden = !showingRaw
    toggle.textContent = showingRaw ? 'Raw' : 'Rendered'
  })
}())
